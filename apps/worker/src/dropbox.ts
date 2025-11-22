export class DropboxClient {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    async listFiles(path: string = ''): Promise<string[]> {
        let allEntries: any[] = [];
        let hasMore = true;
        let cursor: string | null = null;

        while (hasMore) {
            const url = cursor
                ? 'https://api.dropboxapi.com/2/files/list_folder/continue'
                : 'https://api.dropboxapi.com/2/files/list_folder';

            const body = cursor
                ? JSON.stringify({ cursor })
                : JSON.stringify({
                    path: path,
                    recursive: true,
                    include_media_info: false,
                    include_deleted: false,
                    include_has_explicit_shared_members: false,
                    include_mounted_folders: true,
                    limit: 2000 // Max limit
                });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Dropbox list_folder failed: ${error}`);
            }

            const data = await response.json() as any;

            allEntries = allEntries.concat(data.entries);
            hasMore = data.has_more;
            cursor = data.cursor;
        }

        // Filter for .org files and exclude hidden/lock files
        const files = allEntries
            .filter((entry: any) => {
                const isFile = entry['.tag'] === 'file';
                const isOrg = entry.name.endsWith('.org');
                const isHidden = entry.name.startsWith('.'); // Exclude .#gtd.org etc.

                return isFile && isOrg && !isHidden;
            })
            .map((entry: any) => entry.path_display);

        return files;
    }

    async downloadFile(path: string): Promise<{ content: string; rev: string }> {
        const response = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({ path }).replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)),
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Dropbox download failed: ${error}`);
        }

        const resultHeader = response.headers.get('dropbox-api-result');
        if (!resultHeader) {
            throw new Error('Missing dropbox-api-result header');
        }
        const metadata = JSON.parse(resultHeader);
        const content = await response.text();

        return { content, rev: metadata.rev };
    }

    async getMetadata(path: string): Promise<{ rev: string }> {
        const response = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path,
                include_media_info: false,
                include_deleted: false,
                include_has_explicit_shared_members: false,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Dropbox get_metadata failed: ${error}`);
        }

        const data = await response.json() as any;
        return { rev: data.rev };
    }

    async searchFiles(query: string, rootPath: string = ''): Promise<any[]> {
        const response = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                options: {
                    path: rootPath === '/' ? '' : rootPath, // Dropbox API expects empty string for root, or valid path
                    file_categories: ['document'],
                    filename_only: false
                }
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Dropbox search failed: ${error}`);
        }

        const data = await response.json() as any;
        return data.matches.map((match: any) => ({
            path: match.metadata.metadata.path_display,
            name: match.metadata.metadata.name
        }));
    }
    async getTemporaryLink(path: string): Promise<string> {
        const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Dropbox get_temporary_link failed: ${error}`);
        }

        const data = await response.json() as any;
        return data.link;
    }
}
