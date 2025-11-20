export class DropboxClient {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    async listFiles(path: string = ''): Promise<string[]> {
        const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: path,
                recursive: true,
                include_media_info: false,
                include_deleted: false,
                include_has_explicit_shared_members: false,
                include_mounted_folders: true,
                limit: 1000
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Dropbox list_folder failed: ${error}`);
        }

        const data = await response.json() as any;
        // Filter for .org files
        return data.entries
            .filter((entry: any) => entry['.tag'] === 'file' && entry.name.endsWith('.org'))
            .map((entry: any) => entry.path_display);
    }

    async downloadFile(path: string): Promise<string> {
        const response = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({ path }),
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Dropbox download failed: ${error}`);
        }

        return await response.text();
    }

    async searchFiles(query: string): Promise<any[]> {
        const response = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                options: {
                    path: '',
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
}
