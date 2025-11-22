/// <reference types="@cloudflare/workers-types" />
import { DropboxClient } from './dropbox';

export class FileCache {
    constructor(
        private client: DropboxClient,
        private kv: KVNamespace,
        private ctx: ExecutionContext,
        private tokenHash: string
    ) { }

    async getFile(path: string): Promise<{ content: string; rev: string }> {
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;
        const key = `${this.tokenHash}:${dropboxPath}`;

        const cached = await this.kv.get(key, { type: 'json' }) as { rev: string, content: string } | null;

        if (cached) {
            // SWR: Return cached, revalidate in background
            console.log(`[FileCache] Cache Hit (SWR) for ${dropboxPath}`);
            this.ctx.waitUntil(this.revalidate(dropboxPath, cached.rev));
            return cached;
        }

        // Cache Miss
        console.log(`[FileCache] Cache Miss - Downloading ${dropboxPath}`);
        const { content, rev } = await this.client.downloadFile(dropboxPath);
        await this.kv.put(key, JSON.stringify({ rev, content }));
        return { content, rev };
    }

    private async revalidate(path: string, cachedRev: string) {
        try {
            const metadata = await this.client.getMetadata(path);
            if (metadata.rev !== cachedRev) {
                console.log(`[FileCache] Updating ${path} (cached: ${cachedRev}, current: ${metadata.rev})`);
                const { content, rev } = await this.client.downloadFile(path);
                const key = `${this.tokenHash}:${path}`;
                await this.kv.put(key, JSON.stringify({ rev, content }));
            } else {
                console.log(`[FileCache] Cache Fresh for ${path}`);
            }
        } catch (e) {
            console.error(`[FileCache] Revalidation failed for ${path}`, e);
        }
    }
}
