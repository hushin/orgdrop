import type { FileRepository } from './FileRepository';
import type { OrgFile } from '../domain/org/ast';
import type { SearchResult } from '../domain/search/SearchResult';
import type { AppConfig } from '../domain/config/AppConfig';
import { OrgParser } from '../domain/org/parser';

export class RemoteFileRepository implements FileRepository {
    private parser: OrgParser;
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.parser = new OrgParser();
        this.baseUrl = baseUrl;
    }

    async getFiles(): Promise<string[]> {
        const response = await fetch(`${this.baseUrl}/api/files`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error('Failed to fetch file list');
        }
        return response.json();
    }

    async readFile(path: string): Promise<OrgFile> {
        const response = await fetch(`${this.baseUrl}/api/files/${encodeURIComponent(path)}`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Failed to read file: ${path}`);
        }
        const content = await response.text();
        return this.parser.parse(content);
    }

    async search(query: string): Promise<SearchResult[]> {
        const response = await fetch(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error('Failed to search');
        }
        return response.json();
    }

    async getConfig(): Promise<AppConfig> {
        const response = await fetch(`${this.baseUrl}/api/config`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error('Failed to fetch config');
        }
        return response.json();
    }
}
