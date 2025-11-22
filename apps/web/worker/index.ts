/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';

import { getCookie, setCookie } from 'hono/cookie';
import { DropboxClient } from './dropbox';
import { OrgParser, type AgendaItem, type OrgHeadingNode } from '@orgdrop/domain';
import { FileCache } from './file-cache';
import { hashToken } from './utils';
interface Env {
    DROPBOX_APP_KEY: string;
    DROPBOX_APP_SECRET: string;
    DROPBOX_ROOT_PATH: string;
    DROPBOX_CACHE: KVNamespace;
    ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
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
        const tokenHash = await hashToken(token);
        const client = new DropboxClient(token);
        const fileCache = new FileCache(client, c.env.DROPBOX_CACHE, c.executionCtx, tokenHash);

        const { content } = await fileCache.getFile(path);
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

app.get('/api/agenda', async (c) => {
    const token = getCookie(c, 'dropbox_token');
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const rootPath = c.env.DROPBOX_ROOT_PATH || '';
    const client = new DropboxClient(token);

    try {
        const tokenHash = await hashToken(token);
        const fileCache = new FileCache(client, c.env.DROPBOX_CACHE, c.executionCtx, tokenHash);

        // 1. Get Config
        let config = { agendaPaths: ['*.org', 'areas/', 'projects/', 'resources/'] };
        try {
            const configPath = rootPath === '/' ? '/orgdrop.json' : `${rootPath}/orgdrop.json`;
            const { content } = await fileCache.getFile(configPath);
            const parsed = JSON.parse(content);
            if (parsed.agendaPaths) {
                config = parsed;
            }
        } catch (e) {
            console.log('Config not found or invalid, using default');
        }

        // 2. List all files
        const files = await client.listFiles(rootPath === '/' ? '' : rootPath);

        // 3. Filter files
        const agendaFiles = filterFiles(files, { rootPath, config });

        // 4. Fetch and Parse
        const parser = new OrgParser();
        const items: AgendaItem[] = [];

        await Promise.all(agendaFiles.map(async (file) => {
            try {
                const { content, rev } = await fileCache.getFile(file);

                const dropboxPath = file.startsWith('/') ? file : `/${file}`;
                const agendaCacheKey = `agenda:${tokenHash}:${dropboxPath}`;

                // Check Agenda Cache
                const cachedAgenda = await c.env.DROPBOX_CACHE.get(agendaCacheKey, { type: 'json' }) as { rev: string, items: AgendaItem[] } | null;

                if (cachedAgenda && cachedAgenda.rev === rev) {
                    items.push(...cachedAgenda.items);
                } else {
                    // Parse and Cache
                    const orgFile = parser.parse(content);
                    const fileItems: AgendaItem[] = [];
                    extractTasks(orgFile.nodes, file, fileItems);

                    c.executionCtx.waitUntil(c.env.DROPBOX_CACHE.put(agendaCacheKey, JSON.stringify({ rev, items: fileItems })));
                    items.push(...fileItems);
                }
            } catch (e) {
                console.error(`Failed to process file ${file}`, e);
            }
        }));

        return c.json(items);
    } catch (e: any) {
        return c.text(e.message, 500);
    }
});

app.get('/auth/dropbox', (c) => {
    const clientId = c.env.DROPBOX_APP_KEY;
    const url = new URL(c.req.url);
    const redirectUri = `${url.origin}/auth/callback`;
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
    const url = new URL(c.req.url);
    const redirectUri = `${url.origin}/auth/callback`;

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
        // Redirect back to root
        return c.redirect('/');
    } catch (e) {
        return c.text(`Auth Error: ${e}`, 500);
    }
});

app.get('*', async (c) => {
    return await c.env.ASSETS.fetch(c.req.raw);
});

export default app;

function filterFiles(files: string[], appConfig: { rootPath: string, config: { agendaPaths: string[] } }): string[] {
    const { rootPath, config } = appConfig;
    if (!config.agendaPaths || config.agendaPaths.length === 0) {
        return files;
    }

    return files.filter(file => {
        return config.agendaPaths.some(agendaPath => {
            // Resolve agenda path to absolute path
            let resolvedPath = agendaPath;
            if (!agendaPath.startsWith('/')) {
                resolvedPath = rootPath === '/' || rootPath === ''
                    ? `/${agendaPath}`
                    : `${rootPath}/${agendaPath}`;
            }

            // Handle special case for root files (*.org)
            if (agendaPath === '*.org') {
                const root = rootPath === '/' ? '' : rootPath;
                // Check if file starts with root
                if (file.startsWith(root + '/')) {
                    const relative = file.substring(root.length + 1);
                    // If relative contains /, it's in a subdir, so exclude it
                    if (!relative.includes('/') && relative.endsWith('.org')) {
                        return true;
                    }
                }
                return false;
            }

            // Check for exact match (file)
            if (file === resolvedPath) return true;

            // Check for directory match
            // If resolvedPath is a directory, file should start with it + '/'
            const dirPrefix = resolvedPath.endsWith('/') ? resolvedPath : `${resolvedPath}/`;
            if (file.startsWith(dirPrefix)) return true;

            return false;
        });
    });
}

function extractTasks(nodes: any[], file: string, items: AgendaItem[]) {
    for (const node of nodes) {
        if (node.type === 'heading') {
            const heading = node as OrgHeadingNode;
            if (heading.todoKeyword && heading.todoKeyword !== 'DONE' && heading.todoKeyword !== 'CANCELED') {
                items.push({ file, heading });
            }
        }
        if (node.children) {
            extractTasks(node.children, file, items);
        }
    }
}
