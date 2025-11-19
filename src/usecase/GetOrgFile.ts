import type { FileRepository } from '../repository/FileRepository';
import type { OrgFile } from '../domain/org/ast';

export class GetOrgFileUseCase {
    constructor(private fileRepository: FileRepository) { }

    async execute(path: string): Promise<OrgFile> {
        return this.fileRepository.readFile(path);
    }
}
