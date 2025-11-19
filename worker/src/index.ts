import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

app.get('/', (c) => {
    return c.text('OrgDrop Worker is running!');
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
