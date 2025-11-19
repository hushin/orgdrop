import type { OrgFile } from '../domain/org/ast';

export interface FileRepository {
    getFiles(): Promise<string[]>;
    readFile(path: string): Promise<OrgFile>;
}
