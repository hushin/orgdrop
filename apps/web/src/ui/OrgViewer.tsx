import React, { useState, useEffect, Suspense } from 'react';
import type { OrgFile, OrgNode, OrgHeadingNode, OrgListNode, OrgListItemNode, OrgLinkNode, OrgImageNode, OrgBlockNode, OrgTableNode } from '@orgdrop/domain';

const BlockRenderer = React.lazy(() => import('./BlockRenderer'));

interface OrgViewerProps {
    file: OrgFile;
    resolveImage?: (src: string) => string;
    onLinkClick?: (href: string) => void;
}

export const OrgViewer: React.FC<OrgViewerProps> = ({ file, resolveImage, onLinkClick }) => {
    const [collapsedIndices, setCollapsedIndices] = useState<Set<number>>(new Set());

    useEffect(() => {
        const newCollapsedIndices = new Set<number>();
        file.nodes.forEach((node, index) => {
            if (node.type === 'heading') {
                const heading = node as OrgHeadingNode;
                if (heading.tags?.includes('ARCHIVE')) {
                    newCollapsedIndices.add(index);
                }
            }
        });
        setCollapsedIndices(newCollapsedIndices);
    }, [file]);

    const toggleCollapse = (index: number) => {
        setCollapsedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    // Optimized visibility check and indentation calculation
    const getVisibleNodes = () => {
        let currentHeadingLevel = 0;

        return file.nodes.map((node, index) => {
            let hidden = false;
            let indentLevel = 0;

            if (node.type === 'heading') {
                const heading = node as OrgHeadingNode;
                currentHeadingLevel = heading.level;
                indentLevel = Math.max(0, heading.level - 1);
            } else {
                // Content inherits indentation from the current heading
                indentLevel = currentHeadingLevel;
            }

            // Visibility check (same as before)
            let currentLevel = Infinity;
            if (node.type === 'heading') {
                currentLevel = (node as OrgHeadingNode).level;
            }

            for (let i = index - 1; i >= 0; i--) {
                const prevNode = file.nodes[i];
                if (prevNode.type === 'heading') {
                    const prevHeading = prevNode as OrgHeadingNode;
                    if (prevHeading.level < currentLevel) {
                        if (collapsedIndices.has(i)) {
                            hidden = true;
                            break;
                        }
                        // Parent is expanded, so we climb up to check grandparent
                        currentLevel = prevHeading.level;
                    }
                }
            }

            return { node, index, hidden, indentLevel };
        });
    };

    const visibleNodes = getVisibleNodes();

    const { title, filetags, ...otherMetadata } = file.metadata;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm min-h-screen">
            {title && <h1 className="text-4xl font-bold mb-4 text-gray-900">{title}</h1>}

            {filetags && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {(filetags as string).split(':').filter(Boolean).map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {Object.keys(otherMetadata).length > 0 && (
                <PropertiesViewer properties={otherMetadata} />
            )}
            {visibleNodes.map(({ node, index, hidden, indentLevel }) => {
                if (hidden) return null;

                if (node.type === 'heading') {
                    return (
                        <NodeRenderer
                            key={index}
                            node={node}
                            resolveImage={resolveImage}
                            collapsed={collapsedIndices.has(index)}
                            onToggle={() => toggleCollapse(index)}
                            onLinkClick={onLinkClick}
                            indentLevel={indentLevel}
                        />
                    );
                }

                return <NodeRenderer key={index} node={node} resolveImage={resolveImage} onLinkClick={onLinkClick} indentLevel={indentLevel} />;
            })}
        </div>
    );
};

const PropertiesViewer: React.FC<{ properties: Record<string, any> }> = ({ properties }) => {
    return (
        <details className="mb-4 bg-gray-50 rounded border border-gray-200">
            <summary className="px-3 py-2 text-xs font-mono text-gray-500 cursor-pointer hover:bg-gray-100 select-none">
                :PROPERTIES:
            </summary>
            <div className="px-3 pb-2 text-xs font-mono text-gray-600 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
                {Object.entries(properties).map(([key, value]) => (
                    <React.Fragment key={key}>
                        <span className="text-gray-400 text-right">:{key}:</span>
                        <span className="break-all">{String(value)}</span>
                    </React.Fragment>
                ))}
            </div>
        </details>
    );
};

interface NodeRendererProps {
    node: OrgNode;
    resolveImage?: (src: string) => string;
    collapsed?: boolean;
    onToggle?: () => void;
    onLinkClick?: (href: string) => void;
    indentLevel?: number;
}

const NodeRenderer: React.FC<NodeRendererProps> = ({ node, resolveImage, collapsed, onToggle, onLinkClick, indentLevel = 0 }) => {
    const indentGuides = Array.from({ length: indentLevel }).map((_, i) => (
        <div
            key={i}
            className="w-5 flex-shrink-0"
        />
    ));

    const renderContent = () => {
        switch (node.type) {
            case 'heading':
                return <HeadingRenderer node={node as OrgHeadingNode} resolveImage={resolveImage} collapsed={collapsed} onToggle={onToggle} onLinkClick={onLinkClick} />;
            case 'paragraph':
                return <p className="mb-4 text-gray-800 leading-relaxed"><InlineRenderer nodes={node.children || []} resolveImage={resolveImage} onLinkClick={onLinkClick} /></p>;
            case 'list':
                return <ListRenderer node={node as OrgListNode} resolveImage={resolveImage} onLinkClick={onLinkClick} />;
            case 'block':
                return (
                    <Suspense fallback={<div className="p-4 bg-gray-100 rounded animate-pulse">Loading code...</div>}>
                        <BlockRenderer node={node as OrgBlockNode} />
                    </Suspense>
                );
            case 'table':
                return <TableRenderer node={node as OrgTableNode} resolveImage={resolveImage} onLinkClick={onLinkClick} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex">
            {indentGuides}
            <div className="flex-1 min-w-0">
                {renderContent()}
            </div>
        </div>
    );
};

interface HeadingRendererProps {
    node: OrgHeadingNode;
    resolveImage?: (src: string) => string;
    collapsed?: boolean;
    onToggle?: () => void;
    onLinkClick?: (href: string) => void;
}

const HeadingRenderer: React.FC<HeadingRendererProps> = ({ node, resolveImage, collapsed, onToggle, onLinkClick }) => {
    const Tag = `h${Math.min(node.level, 6)}` as React.ElementType;
    // Adjusted sizes for cleaner look in indent mode
    const sizeClasses = {
        1: 'text-2xl font-bold mt-4 mb-2 border-b border-gray-300 pb-1 leading-tight',
        2: 'text-xl font-bold mt-2 mb-1 leading-tight',
        3: 'text-lg font-bold mt-1.5 mb-1 leading-tight',
        4: 'text-base font-bold mt-1 mb-0.5 leading-tight',
        5: 'text-sm font-bold mt-1 mb-0.5 leading-tight',
        6: 'text-xs font-bold mt-1 mb-0.5 leading-tight',
    }[Math.min(node.level, 6)];

    return (
        <div className="group" id={node.properties?.['ID'] || node.properties?.['CUSTOM_ID']} data-title={node.title}>
            <Tag className={`text-gray-900 ${sizeClasses} flex items-center`}>
                {node.todoKeyword && (
                    <span className={`mr-2 px-2 py-0.5 rounded text-sm text-white ${node.todoKeyword === 'TODO' ? 'bg-red-500' :
                        node.todoKeyword === 'DONE' ? 'bg-green-500' :
                            node.todoKeyword === 'NEXT' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                        {node.todoKeyword}
                    </span>
                )}
                {node.priority && <span className="mr-2 text-yellow-600 font-mono">[#{node.priority}]</span>}
                <span>
                    <InlineRenderer nodes={node.children || []} resolveImage={resolveImage} onLinkClick={onLinkClick} />
                </span>
                {node.tags && node.tags.length > 0 && (
                    <span className="ml-4 text-sm text-gray-500 font-normal">
                        {node.tags.map(tag => `:${tag}:`).join('')}
                    </span>
                )}
                <span
                    className="flex-1 self-stretch cursor-pointer"
                    onClick={onToggle}
                />
                <span
                    onClick={onToggle}
                    className="ml-4 cursor-pointer text-gray-300 hover:text-gray-600 select-none w-6 inline-block text-center flex-shrink-0"
                >
                    {collapsed ? '▲' : '▼'}
                </span>
            </Tag>
            {/* Show properties only if not collapsed */}
            {!collapsed && node.properties && Object.keys(node.properties).length > 0 && (
                <div className="mb-2">
                    <PropertiesViewer properties={node.properties} />
                </div>
            )}
        </div>
    );
};

const ListRenderer: React.FC<{ node: OrgListNode; resolveImage?: (src: string) => string; onLinkClick?: (href: string) => void }> = ({ node, resolveImage, onLinkClick }) => {
    const Tag = node.ordered ? 'ol' : 'ul';
    return (
        <Tag className={`mb-4 pl-6 ${node.ordered ? 'list-decimal' : 'list-disc'}`}>
            {node.children?.map((child, index) => (
                <ListItemRenderer key={index} node={child as OrgListItemNode} resolveImage={resolveImage} onLinkClick={onLinkClick} />
            ))}
        </Tag>
    );
};

const ListItemRenderer: React.FC<{ node: OrgListItemNode; resolveImage?: (src: string) => string; onLinkClick?: (href: string) => void }> = ({ node, resolveImage, onLinkClick }) => {
    return (
        <li className="mb-1">
            {node.checked !== undefined && (
                <input type="checkbox" checked={node.checked} readOnly className="mr-2" />
            )}
            <InlineRenderer nodes={node.children || []} resolveImage={resolveImage} onLinkClick={onLinkClick} />
        </li>
    );
};

const InlineRenderer: React.FC<{ nodes: OrgNode[]; resolveImage?: (src: string) => string; onLinkClick?: (href: string) => void }> = ({ nodes, resolveImage, onLinkClick }) => {
    return (
        <>
            {nodes.map((node, index) => {
                if (node.type === 'text') return <span key={index}>{node.content}</span>;
                if (node.type === 'link') {
                    const linkNode = node as OrgLinkNode;
                    return (
                        <a
                            key={index}
                            href={linkNode.src}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => {
                                if (onLinkClick) {
                                    e.preventDefault();
                                    onLinkClick(linkNode.src);
                                }
                            }}
                            target={onLinkClick ? undefined : "_blank"}
                            rel={onLinkClick ? undefined : "noopener noreferrer"}
                        >
                            {linkNode.description}
                        </a>
                    );
                }
                if (node.type === 'image') {
                    const imgNode = node as OrgImageNode;
                    const src = resolveImage ? resolveImage(imgNode.src) : imgNode.src;
                    return <img key={index} src={src} alt={imgNode.alt} className="max-w-full h-auto my-2 rounded shadow" />;
                }
                return null;
            })}
        </>
    );
};

const TableRenderer: React.FC<{ node: OrgTableNode; resolveImage?: (src: string) => string; onLinkClick?: (href: string) => void }> = ({ node, resolveImage, onLinkClick }) => {
    return (
        <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300">
                <tbody>
                    {node.children.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.children.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                    <InlineRenderer nodes={cell.children || []} resolveImage={resolveImage} onLinkClick={onLinkClick} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
