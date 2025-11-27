import type {
	AgendaItem,
	AppConfig,
	OrgFile,
	SearchResult,
} from "@orgdrop/domain";

export interface FileRepository {
	getFiles(): Promise<string[]>;
	readFile(path: string): Promise<OrgFile>;
	search(query: string): Promise<SearchResult[]>;
	getConfig(): Promise<AppConfig>;
	getAgenda(): Promise<AgendaItem[]>;
}
