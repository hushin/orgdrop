import type { FileRepository } from '../repository/FileRepository';
import type { OrgFile } from '../domain/org/ast';

export class GetOrgFileUseCase {
    private fileRepository: FileRepository;

    constructor(fileRepository: FileRepository) {
        this.fileRepository = fileRepository;
    }

    async execute(path: string): Promise<OrgFile> {
        return this.fileRepository.readFile(path);
    }
}
