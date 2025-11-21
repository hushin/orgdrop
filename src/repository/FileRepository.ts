import type { OrgFile } from '../domain/org/ast';
import type { SearchResult } from '../domain/search/SearchResult';
import type { AppConfig } from '../domain/config/AppConfig';

export interface FileRepository {
    getFiles(): Promise<string[]>;
    readFile(path: string): Promise<OrgFile>;
    search(query: string): Promise<SearchResult[]>;
    getConfig(): Promise<AppConfig>;
}
