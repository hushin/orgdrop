import React from 'react';
import type { OrgFile, OrgNode, OrgHeadingNode, OrgListNode, OrgListItemNode, OrgLinkNode, OrgImageNode } from '@orgdrop/domain';

interface OrgViewerProps {
    file: OrgFile;
    resolveImage?: (src: string) => string;
}

export const OrgViewer: React.FC<OrgViewerProps> = ({ file, resolveImage }) => {
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm min-h-screen">
            {Object.keys(file.metadata).length > 0 && (
                <PropertiesViewer properties={file.metadata} />
            )}
            {file.nodes.map((node, index) => (
                <NodeRenderer key={index} node={node} resolveImage={resolveImage} />
            ))}
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

const NodeRenderer: React.FC<{ node: OrgNode; resolveImage?: (src: string) => string }> = ({ node, resolveImage }) => {
    switch (node.type) {
        case 'heading':
            return <HeadingRenderer node={node as OrgHeadingNode} resolveImage={resolveImage} />;
        case 'paragraph':
            return <p className="mb-4 text-gray-800 leading-relaxed"><InlineRenderer nodes={node.children || []} resolveImage={resolveImage} /></p>;
        case 'list':
            return <ListRenderer node={node as OrgListNode} resolveImage={resolveImage} />;
        default:
            return null;
    }
};

const HeadingRenderer: React.FC<{ node: OrgHeadingNode; resolveImage?: (src: string) => string }> = ({ node, resolveImage }) => {
    const Tag = `h${Math.min(node.level, 6)}` as React.ElementType;
    const sizeClasses = {
        1: 'text-3xl border-b pb-2 mt-8 mb-4',
        2: 'text-2xl mt-6 mb-3',
        3: 'text-xl mt-4 mb-2',
        4: 'text-lg mt-3 mb-2',
        5: 'text-base font-bold mt-2 mb-1',
        6: 'text-sm font-bold mt-2 mb-1',
    }[Math.min(node.level, 6)];

    return (
        <div className="group">
            <Tag className={`font-bold text-gray-900 ${sizeClasses}`}>
                {node.todoKeyword && (
                    <span className={`mr-2 px-2 py-0.5 rounded text-sm text-white ${node.todoKeyword === 'TODO' ? 'bg-red-500' :
                        node.todoKeyword === 'DONE' ? 'bg-green-500' :
                            node.todoKeyword === 'NEXT' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                        {node.todoKeyword}
                    </span>
                )}
                {node.priority && <span className="mr-2 text-yellow-600 font-mono">[#{node.priority}]</span>}
                <InlineRenderer nodes={node.children || []} resolveImage={resolveImage} />
                {node.tags && node.tags.length > 0 && (
                    <span className="ml-4 text-sm text-gray-500 font-normal">
                        {node.tags.map(tag => `:${tag}:`).join('')}
                    </span>
                )}
            </Tag>
            {node.properties && Object.keys(node.properties).length > 0 && (
                <div className="ml-2 mb-2">
                    <PropertiesViewer properties={node.properties} />
                </div>
            )}
        </div>
    );
};

const ListRenderer: React.FC<{ node: OrgListNode; resolveImage?: (src: string) => string }> = ({ node, resolveImage }) => {
    const Tag = node.ordered ? 'ol' : 'ul';
    return (
        <Tag className={`mb-4 pl-6 ${node.ordered ? 'list-decimal' : 'list-disc'}`}>
            {node.children?.map((child, index) => (
                <ListItemRenderer key={index} node={child as OrgListItemNode} resolveImage={resolveImage} />
            ))}
        </Tag>
    );
};

const ListItemRenderer: React.FC<{ node: OrgListItemNode; resolveImage?: (src: string) => string }> = ({ node, resolveImage }) => {
    return (
        <li className="mb-1">
            {node.checked !== undefined && (
                <input type="checkbox" checked={node.checked} readOnly className="mr-2" />
            )}
            <InlineRenderer nodes={node.children || []} resolveImage={resolveImage} />
        </li>
    );
};

const InlineRenderer: React.FC<{ nodes: OrgNode[]; resolveImage?: (src: string) => string }> = ({ nodes, resolveImage }) => {
    return (
        <>
            {nodes.map((node, index) => {
                if (node.type === 'text') return <span key={index}>{node.content}</span>;
                if (node.type === 'link') {
                    const linkNode = node as OrgLinkNode;
                    return <a key={index} href={linkNode.src} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{linkNode.description}</a>;
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
