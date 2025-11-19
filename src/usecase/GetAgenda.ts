import type { FileRepository } from '../repository/FileRepository';
import type { AgendaItem } from '../domain/agenda/AgendaItem';
import type { OrgHeadingNode } from '../domain/org/ast';

export class GetAgendaUseCase {
    constructor(private fileRepository: FileRepository) { }

    async execute(): Promise<AgendaItem[]> {
        const files = await this.fileRepository.getFiles();
        const items: AgendaItem[] = [];

        for (const file of files) {
            const orgFile = await this.fileRepository.readFile(file);
            this.extractTasks(orgFile.nodes, file, items);
        }

        return items;
    }

    private extractTasks(nodes: any[], file: string, items: AgendaItem[]) {
        for (const node of nodes) {
            if (node.type === 'heading') {
                const heading = node as OrgHeadingNode;
                if (heading.todoKeyword && heading.todoKeyword !== 'DONE' && heading.todoKeyword !== 'CANCELED') {
                    items.push({ file, heading });
                }
            }
            if (node.children) {
                this.extractTasks(node.children, file, items);
            }
        }
    }
}
