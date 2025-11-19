import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

const DUMMY_FILES: Record<string, string> = {
    'example.org': `
* TODO Welcome to OrgDrop (Remote)
** NEXT Features to implement
- [X] Org Parser
- [ ] File Repository
- [ ] UI Components
** [#A] Important Links
- [[https://github.com][GitHub]]
- [[https://google.com][Google]]

* Images
[[file:example.png]]
`,
    'todo.org': `
* Work
** TODO Finish report
** WAITING Email reply
* Personal
** TODO Buy milk
`
};

app.get('/', (c) => {
    return c.text('OrgDrop Worker is running!');
});

app.get('/api/files', (c) => {
    return c.json(Object.keys(DUMMY_FILES));
});

app.get('/api/files/:path', (c) => {
    const path = c.req.param('path');
    const content = DUMMY_FILES[path];
    if (!content) {
        return c.text('File not found', 404);
    }
    return c.text(content);
});

app.get('/api/search', (c) => {
    const query = c.req.query('q')?.toLowerCase() || '';
    const results: any[] = [];

    for (const [path, content] of Object.entries(DUMMY_FILES)) {
        const lines = content.split(/\r?\n/);
        const matches = lines
            .map((line, index) => ({ line, index }))
            .filter(({ line }) => line.toLowerCase().includes(query))
            .map(({ line, index }) => ({
                lineNumber: index + 1,
                lineContent: line.trim()
            }));

        if (matches.length > 0) {
            results.push({
                filePath: path,
                matches
            });
        }
    }
    return c.json(results);
});

app.get('/auth/dropbox', (c) => {
    const clientId = c.env.DROPBOX_APP_KEY;
    const redirectUri = 'http://localhost:5173/auth/callback'; // TODO: Make dynamic
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return c.redirect(authUrl);
});

app.get('/auth/callback', async (c) => {
    const code = c.req.query('code');
    if (!code) {
        return c.text('Missing code', 400);
    }
    // TODO: Exchange code for token
    return c.json({ message: 'Auth successful (placeholder)', code });
});

export default app;
