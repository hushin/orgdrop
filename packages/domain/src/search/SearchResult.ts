export interface SearchMatch {
	lineNumber: number;
	lineContent: string;
}

export interface SearchResult {
	filePath: string;
	matches: SearchMatch[];
}
