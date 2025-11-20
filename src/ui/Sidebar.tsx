import { useState, useMemo } from 'react';

interface SidebarProps {
    files: string[];
    onFileSelect: (path: string) => void;
    currentFile: string;
    viewMode: 'file' | 'agenda';
    onAgendaSelect: () => void;
}

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children: FileNode[];
}

const buildFileTree = (paths: string[]): FileNode[] => {
    const root: FileNode[] = [];
    if (paths.length === 0) return root;

    const splitPaths = paths.map((path) => path.split('/'));

    // Calculate common directory prefix
    // We only consider directory parts (all but the last part) for the prefix
    const dirPaths = splitPaths.map((parts) => parts.slice(0, -1));

    let commonPrefixLength = 0;
    if (dirPaths.length > 0) {
        const firstDir = dirPaths[0];
        for (let i = 0; i < firstDir.length; i++) {
            const part = firstDir[i];
            let allMatch = true;
            for (let j = 1; j < dirPaths.length; j++) {
                if (dirPaths[j].length <= i || dirPaths[j][i] !== part) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                commonPrefixLength++;
            } else {
                break;
            }
        }
    }

    splitPaths.forEach((parts) => {
        let currentLevel = root;

        parts.forEach((part, index) => {
            // Skip parts that are part of the common prefix
            if (index < commonPrefixLength) return;

            const isFile = index === parts.length - 1;
            // Reconstruct the full path for the node
            const currentPath = parts.slice(0, index + 1).join('/');

            // Check if we already have this node at this level
            let node = currentLevel.find((n) => n.name === part);

            if (!node) {
                node = {
                    name: part,
                    path: currentPath,
                    type: isFile ? 'file' : 'directory',
                    children: [],
                };
                currentLevel.push(node);
            }

            if (!isFile) {
                currentLevel = node.children;
            }
        });
    });

    // Sort: Directories first, then files. Alphabetical within groups.
    const sortNodes = (nodes: FileNode[]) => {
        nodes.sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type === 'directory' ? -1 : 1;
        });
        nodes.forEach((node) => sortNodes(node.children));
    };

    sortNodes(root);
    return root;
};

const FileTreeItem = ({
    node,
    level,
    onSelect,
    currentFile,
}: {
    node: FileNode;
    level: number;
    onSelect: (path: string) => void;
    currentFile: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const isSelected = node.type === 'file' && currentFile === node.path;

    const handleClick = () => {
        if (node.type === 'directory') {
            setIsOpen(!isOpen);
        } else {
            onSelect(node.path);
        }
    };

    return (
        <div>
            <div
                className={`flex items-center py-1 px-2 cursor-pointer text-sm hover:bg-gray-700 ${isSelected ? 'bg-gray-700 text-white font-medium' : 'text-gray-300'
                    }`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={handleClick}
            >
                <span className="mr-2 text-gray-500">
                    {node.type === 'directory' ? (
                        isOpen ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                </span>
                <span className="truncate">{node.name}</span>
            </div>
            {node.type === 'directory' && isOpen && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeItem
                            key={child.path}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            currentFile={currentFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const Sidebar = ({
    files,
    onFileSelect,
    currentFile,
    viewMode,
    onAgendaSelect,
}: SidebarProps) => {
    const fileTree = useMemo(() => buildFileTree(files), [files]);

    return (
        <div className="p-4 h-full bg-gray-800 text-white overflow-y-auto">
            <h1 className="text-xl font-bold mb-6">OrgDrop</h1>
            <nav className="space-y-2">
                <div className="mb-4">
                    <h2 className="text-xs uppercase text-gray-400 font-semibold mb-2">Views</h2>
                    <button
                        onClick={onAgendaSelect}
                        className={`w-full text-left px-4 py-2 rounded flex items-center ${viewMode === 'agenda' ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`}
                    >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Agenda
                    </button>
                </div>

                <div>
                    <h2 className="text-xs uppercase text-gray-400 font-semibold mb-2">Files</h2>
                    {files.length === 0 ? (
                        <div className="px-4 text-sm text-gray-500">No files found</div>
                    ) : (
                        <div className="mt-2">
                            {fileTree.map((node) => (
                                <FileTreeItem
                                    key={node.path}
                                    node={node}
                                    level={0}
                                    onSelect={onFileSelect}
                                    currentFile={currentFile}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};
