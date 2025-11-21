import type { FileRepository } from '../repository/FileRepository';
import type { AgendaItem } from '../domain/agenda/AgendaItem';
import type { OrgHeadingNode } from '../domain/org/ast';

export class GetAgendaUseCase {
    private fileRepository: FileRepository;

    constructor(fileRepository: FileRepository) {
        this.fileRepository = fileRepository;
    }

    async execute(): Promise<AgendaItem[]> {
        const [files, appConfig] = await Promise.all([
            this.fileRepository.getFiles(),
            this.fileRepository.getConfig().catch(() => ({ rootPath: '', config: { agendaPaths: [] } }))
        ]);

        const agendaFiles = this.filterFiles(files, appConfig);
        const items: AgendaItem[] = [];

        for (const file of agendaFiles) {
            const orgFile = await this.fileRepository.readFile(file);
            this.extractTasks(orgFile.nodes, file, items);
        }

        return items;
    }

    private filterFiles(files: string[], appConfig: { rootPath: string, config: { agendaPaths: string[] } }): string[] {
        const { rootPath, config } = appConfig;
        if (!config.agendaPaths || config.agendaPaths.length === 0) {
            return files;
        }

        return files.filter(file => {
            return config.agendaPaths.some(agendaPath => {
                // Resolve agenda path to absolute path
                let resolvedPath = agendaPath;
                if (!agendaPath.startsWith('/')) {
                    resolvedPath = rootPath === '/' || rootPath === ''
                        ? `/${agendaPath}`
                        : `${rootPath}/${agendaPath}`;
                }

                // Handle special case for root files (*.org)
                if (agendaPath === '*.org') {
                    const root = rootPath === '/' ? '' : rootPath;
                    // Check if file starts with root
                    if (file.startsWith(root + '/')) {
                        const relative = file.substring(root.length + 1);
                        // If relative contains /, it's in a subdir, so exclude it
                        if (!relative.includes('/') && relative.endsWith('.org')) {
                            return true;
                        }
                    }
                    return false;
                }

                // Normalize paths to ensure consistent comparison
                // (Dropbox paths are usually lower case in some contexts, but let's assume case sensitive for now or match what API returns)
                // API returns display path which preserves case.

                // Check for exact match (file)
                if (file === resolvedPath) return true;

                // Check for directory match
                // If resolvedPath is a directory, file should start with it + '/'
                const dirPrefix = resolvedPath.endsWith('/') ? resolvedPath : `${resolvedPath}/`;
                if (file.startsWith(dirPrefix)) return true;

                return false;
            });
        });
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
