import type { OrgFile, AgendaItem } from '@orgdrop/domain';
import type { SearchResult } from '@orgdrop/domain';
import type { AppConfig } from '@orgdrop/domain';

export interface FileRepository {
    getFiles(): Promise<string[]>;
    readFile(path: string): Promise<OrgFile>;
    search(query: string): Promise<SearchResult[]>;
    getConfig(): Promise<AppConfig>;
    getAgenda(): Promise<AgendaItem[]>;
}
