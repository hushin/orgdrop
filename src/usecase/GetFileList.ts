import type { FileRepository } from '../repository/FileRepository';

export class GetFileListUseCase {
    private fileRepository: FileRepository;

    constructor(fileRepository: FileRepository) {
        this.fileRepository = fileRepository;
    }

    async execute(): Promise<string[]> {
        return this.fileRepository.getFiles();
    }
}
