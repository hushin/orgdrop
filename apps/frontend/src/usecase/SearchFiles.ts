import type { FileRepository } from "../repository/FileRepository";
import type { SearchResult } from "@orgdrop/domain";

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
