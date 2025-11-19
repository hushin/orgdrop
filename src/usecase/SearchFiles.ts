import type { FileRepository } from '../repository/FileRepository';
import type { SearchResult } from '../domain/search/SearchResult';

export class SearchFilesUseCase {
    constructor(private fileRepository: FileRepository) { }

    async execute(query: string): Promise<SearchResult[]> {
        if (!query.trim()) {
            return [];
        }
        return this.fileRepository.search(query);
    }
}
