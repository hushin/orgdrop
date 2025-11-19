import type { FileRepository } from './FileRepository';
import type { OrgFile } from '../domain/org/ast';
import type { SearchResult } from '../domain/search/SearchResult';
import { OrgParser } from '../domain/org/parser';

const DUMMY_FILES: Record<string, string> = {
    'example.org': `
* TODO Welcome to OrgDrop
** NEXT Features to implement
- [X] Org Parser
- [ ] File Repository
- [ ] UI Components
** [#A] Important Links
- [[https://github.com][GitHub]]
- [[https://google.com][Google]]

* Images
[[file:example.png]]
`,
    'todo.org': `
* Work
** TODO Finish report
** WAITING Email reply
* Personal
** TODO Buy milk
`
};

export class MockFileRepository implements FileRepository {
    private parser: OrgParser;

    constructor() {
        this.parser = new OrgParser();
    }

    async getFiles(): Promise<string[]> {
        return Object.keys(DUMMY_FILES);
    }

    async readFile(path: string): Promise<OrgFile> {
        const content = DUMMY_FILES[path];
        if (!content) {
            throw new Error(`File not found: ${path}`);
        }
        return this.parser.parse(content);
    }

    async search(query: string): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const lowerQuery = query.toLowerCase();

        for (const [path, content] of Object.entries(DUMMY_FILES)) {
            const lines = content.split(/\r?\n/);
            const matches = lines
                .map((line, index) => ({ line, index }))
                .filter(({ line }) => line.toLowerCase().includes(lowerQuery))
                .map(({ line, index }) => ({
                    lineNumber: index + 1,
                    lineContent: line.trim()
                }));

            if (matches.length > 0) {
                results.push({
                    filePath: path,
                    matches
                });
            }
        }

        return results;
    }
}
