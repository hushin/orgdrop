import type { AgendaItem } from "@orgdrop/domain";
import type { FileRepository } from "../repository/FileRepository";

export class GetAgendaUseCase {
	private fileRepository: FileRepository;

	constructor(fileRepository: FileRepository) {
		this.fileRepository = fileRepository;
	}

	async execute(): Promise<AgendaItem[]> {
		return this.fileRepository.getAgenda();
	}
}
