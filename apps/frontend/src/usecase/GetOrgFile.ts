import type { OrgFile } from "@orgdrop/domain";
import type { FileRepository } from "../repository/FileRepository";

export class GetOrgFileUseCase {
	private fileRepository: FileRepository;

	constructor(fileRepository: FileRepository) {
		this.fileRepository = fileRepository;
	}

	async execute(path: string): Promise<OrgFile> {
		return this.fileRepository.readFile(path);
	}
}
