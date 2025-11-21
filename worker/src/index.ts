import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie } from 'hono/cookie';
import { DropboxClient } from './dropbox';

interface Env {
    DROPBOX_APP_KEY: string;
    DROPBOX_APP_SECRET: string;
    DROPBOX_ROOT_PATH: string;
    DROPBOX_CACHE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors({
    origin: 'http://localhost:5173', // Allow frontend
    credentials: true, // Allow cookies
}));

app.get('/', (c) => {
    return c.text('OrgDrop Worker is running!');
});

app.get('/api/files', async (c) => {
    const token = getCookie(c, 'dropbox_token');
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const rootPath = c.env.DROPBOX_ROOT_PATH || '';

    try {
        const client = new DropboxClient(token);
        const files = await client.listFiles(rootPath === '/' ? '' : rootPath);
        return c.json(files);
    } catch (e: any) {
        return c.text(e.message, 500);
    }
});

app.get('/api/files/:path', async (c) => {
    const token = getCookie(c, 'dropbox_token');
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const path = c.req.param('path');
    try {
        const client = new DropboxClient(token);
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;

        // Generate Cache Key
        const tokenBuffer = new TextEncoder().encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBuffer);
        const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        const cacheKey = `${tokenHash}:${dropboxPath}`;

        // 1. Check KV
        const cached = await c.env.DROPBOX_CACHE.get(cacheKey, { type: 'json' }) as { rev: string, content: string } | null;

        // Background Revalidation Logic
        const revalidate = async () => {
            try {
                // Check Metadata with Dropbox
                const metadata = await client.getMetadata(dropboxPath);

                // If cache is missing or stale, update it
                if (!cached || metadata.rev !== cached.rev) {
                    console.log(`Cache Update Needed for ${dropboxPath} (cached: ${cached?.rev}, current: ${metadata.rev})`);
                    const { content, rev } = await client.downloadFile(dropboxPath);
                    await c.env.DROPBOX_CACHE.put(cacheKey, JSON.stringify({ rev, content }));
                    console.log(`Cache Updated for ${dropboxPath}`);
                } else {
                    console.log(`Cache Fresh for ${dropboxPath}`);
                }
            } catch (e) {
                console.error('Background revalidation failed', e);
            }
        };

        if (cached) {
            console.log(`Cache Hit (Stale-While-Revalidate) for ${dropboxPath}`);
            // Return immediately
            c.executionCtx.waitUntil(revalidate());
            return c.text(cached.content);
        }

        // 2. No Cache - Blocking Download
        console.log(`Cache Miss - Downloading ${dropboxPath}`);
        const { content, rev } = await client.downloadFile(dropboxPath);

        // Store in KV
        await c.env.DROPBOX_CACHE.put(cacheKey, JSON.stringify({ rev, content }));

        return c.text(content);
    } catch (e: any) {
        return c.text(e.message, 404);
    }
});

app.get('/api/search', async (c) => {
    const token = getCookie(c, 'dropbox_token');
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const query = c.req.query('q')?.toLowerCase() || '';
    if (!query) return c.json([]);

    const rootPath = c.env.DROPBOX_ROOT_PATH || '';

    try {
        const client = new DropboxClient(token);
        // 1. Search using Dropbox API to find relevant files
        const searchMatches = await client.searchFiles(query, rootPath === '/' ? '' : rootPath);

        // 2. Download content of matched files to find specific lines (naive implementation)
        // Limit to top 5 files to avoid timeout
        const topMatches = searchMatches.slice(0, 5);

        const results = await Promise.all(topMatches.map(async (match: any) => {
            try {
                const { content } = await client.downloadFile(match.path);
                const lines = content.split(/\r?\n/);
                const lineMatches = lines
                    .map((line, index) => ({ line, index }))
                    .filter(({ line }) => line.toLowerCase().includes(query))
                    .map(({ line, index }) => ({
                        lineNumber: index + 1,
                        lineContent: line.trim()
                    }));

                if (lineMatches.length > 0) {
                    return {
                        filePath: match.path, // Use full path
                        matches: lineMatches
                    };
                }
                return null;
            } catch (e) {
                console.error(`Failed to search in file ${match.path}`, e);
                return null;
            }
        }));

        return c.json(results.filter(r => r !== null));
    } catch (e: any) {
        return c.text(e.message, 500);
    }
});

app.get('/api/config', async (c) => {
    const token = getCookie(c, 'dropbox_token');
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const rootPath = c.env.DROPBOX_ROOT_PATH || '';

    try {
        const client = new DropboxClient(token);
        const configPath = rootPath === '/' ? '/orgdrop.json' : `${rootPath}/orgdrop.json`;

        let config = { agendaPaths: ['*.org', 'areas/', 'projects/', 'resources/'] };
        try {
            const { content } = await client.downloadFile(configPath);
            const parsed = JSON.parse(content);
            if (parsed.agendaPaths) {
                config = parsed;
            }
        } catch (e: any) {
            // Config file not found or invalid, use default
            if (e.message && e.message.includes('path/not_found')) {
                console.log('Config file (orgdrop.json) not found, using default configuration.');
            } else {
                console.log('Config file invalid or other error, using default', e);
            }
        }

        return c.json({
            rootPath: rootPath === '/' ? '' : rootPath,
            config
        });
    } catch (e: any) {
        return c.text(e.message, 500);
    }
});

app.get('/api/images/:path', async (c) => {
    const token = getCookie(c, 'dropbox_token');
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const path = c.req.param('path');
    try {
        const client = new DropboxClient(token);
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;
        const link = await client.getTemporaryLink(dropboxPath);
        return c.redirect(link);
    } catch (e: any) {
        return c.text(e.message, 404);
    }
});

app.get('/auth/dropbox', (c) => {
    const clientId = c.env.DROPBOX_APP_KEY;
    // Use the worker's URL for callback
    const redirectUri = 'http://localhost:8787/auth/callback';
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return c.redirect(authUrl);
});

app.get('/auth/callback', async (c) => {
    const code = c.req.query('code');
    if (!code) {
        return c.text('Missing code', 400);
    }

    const clientId = c.env.DROPBOX_APP_KEY;
    const clientSecret = c.env.DROPBOX_APP_SECRET;
    const redirectUri = 'http://localhost:8787/auth/callback';

    try {
        const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return c.text(`Dropbox Auth Failed: ${error}`, 400);
        }

        const data = await response.json() as { access_token: string, uid: string };

        // Set HttpOnly cookie
        setCookie(c, 'dropbox_token', data.access_token, {
            httpOnly: true,
            secure: true, // Requires HTTPS (might fail on localhost if not careful, but usually fine on modern browsers/localhost)
            sameSite: 'Lax',
            path: '/',
            maxAge: 3600 * 4, // 4 hours
        });

        // Redirect back to frontend
        return c.redirect('http://localhost:5173/');
    } catch (e) {
        return c.text(`Auth Error: ${e}`, 500);
    }
});

export default app;
