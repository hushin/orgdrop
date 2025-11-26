/// <reference types="@cloudflare/workers-types" />
import { DropboxClient } from './dropbox';

export class FileCache {
    private client: DropboxClient;
    private kv: KVNamespace;
    private ctx: ExecutionContext;
    private tokenHash: string;

    constructor(
        client: DropboxClient,
        kv: KVNamespace,
        ctx: ExecutionContext,
        tokenHash: string
    ) {
        this.client = client;
        this.kv = kv;
        this.ctx = ctx;
        this.tokenHash = tokenHash;
    }

    async getFile(path: string, knownRev?: string): Promise<{ content: string; rev: string; cached: boolean }> {
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;
        const key = `${this.tokenHash}:${dropboxPath}`;

        const cached = await this.kv.get(key, { type: 'json' }) as { rev: string, content: string } | null;

        if (cached) {
            // SWR: Return cached, revalidate in background
            console.log(`[FileCache] Cache Hit (SWR) for ${dropboxPath}`);

            if (knownRev) {
                if (cached.rev !== knownRev) {
                    console.log(`[FileCache] Stale (cached: ${cached.rev}, known: ${knownRev})`);
                    this.ctx.waitUntil(this.updateCache(dropboxPath));
                }
            } else {
                this.ctx.waitUntil(this.revalidate(dropboxPath, cached.rev));
            }
            return { ...cached, cached: true };
        }

        // Cache Miss
        console.log(`[FileCache] Cache Miss - Downloading ${dropboxPath}`);
        const { content, rev } = await this.client.downloadFile(dropboxPath);
        await this.kv.put(key, JSON.stringify({ rev, content }));
        return { content, rev, cached: false };
    }

    private async revalidate(path: string, cachedRev: string) {
        try {
            const metadata = await this.client.getMetadata(path);
            if (metadata.rev !== cachedRev) {
                console.log(`[FileCache] Updating ${path} (cached: ${cachedRev}, current: ${metadata.rev})`);
                await this.updateCache(path);
            } else {
                console.log(`[FileCache] Cache Fresh for ${path}`);
            }
        } catch (e) {
            console.error(`[FileCache] Revalidation failed for ${path}`, e);
        }
    }

    private async updateCache(path: string) {
        try {
            const { content, rev } = await this.client.downloadFile(path);
            const key = `${this.tokenHash}:${path}`;
            await this.kv.put(key, JSON.stringify({ rev, content }));
        } catch (e) {
            console.error(`[FileCache] Update failed for ${path}`, e);
        }
    }
}
