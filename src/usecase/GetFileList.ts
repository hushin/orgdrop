import type { FileRepository } from '../repository/FileRepository';

export class GetFileListUseCase {
    constructor(private fileRepository: FileRepository) { }

    async execute(): Promise<string[]> {
        return this.fileRepository.getFiles();
    }
}
