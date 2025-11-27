import type { SearchResult } from "@orgdrop/domain";
import type { FileRepository } from "../repository/FileRepository";

export class SearchFilesUseCase {
	private fileRepository: FileRepository;

	constructor(fileRepository: FileRepository) {
		this.fileRepository = fileRepository;
	}

	async execute(query: string): Promise<SearchResult[]> {
		if (!query.trim()) {
			return [];
		}
		return this.fileRepository.search(query);
	}
}
