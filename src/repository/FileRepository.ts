import type { OrgFile } from '../domain/org/ast';
import type { SearchResult } from '../domain/search/SearchResult';

export interface FileRepository {
    getFiles(): Promise<string[]>;
    readFile(path: string): Promise<OrgFile>;
    search(query: string): Promise<SearchResult[]>;
}
