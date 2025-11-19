import React from 'react';
import type { OrgFile, OrgNode, OrgHeadingNode, OrgListNode, OrgListItemNode, OrgLinkNode, OrgImageNode } from '../domain/org/ast';

interface OrgViewerProps {
    file: OrgFile;
}

export const OrgViewer: React.FC<OrgViewerProps> = ({ file }) => {
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm min-h-screen">
            {file.nodes.map((node, index) => (
                <NodeRenderer key={index} node={node} />
            ))}
        </div>
    );
};

const NodeRenderer: React.FC<{ node: OrgNode }> = ({ node }) => {
    switch (node.type) {
        case 'heading':
            return <HeadingRenderer node={node as OrgHeadingNode} />;
        case 'paragraph':
            return <p className="mb-4 text-gray-800 leading-relaxed"><InlineRenderer nodes={node.children || []} /></p>;
        case 'list':
            return <ListRenderer node={node as OrgListNode} />;
        default:
            return null;
    }
};

const HeadingRenderer: React.FC<{ node: OrgHeadingNode }> = ({ node }) => {
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
            {node.title}
            {node.tags && node.tags.length > 0 && (
                <span className="ml-4 text-sm text-gray-500 font-normal">
                    {node.tags.map(tag => `:${tag}:`).join('')}
                </span>
            )}
        </Tag>
    );
};

const ListRenderer: React.FC<{ node: OrgListNode }> = ({ node }) => {
    const Tag = node.ordered ? 'ol' : 'ul';
    return (
        <Tag className={`mb-4 pl-6 ${node.ordered ? 'list-decimal' : 'list-disc'}`}>
            {node.children?.map((child, index) => (
                <ListItemRenderer key={index} node={child as OrgListItemNode} />
            ))}
        </Tag>
    );
};

const ListItemRenderer: React.FC<{ node: OrgListItemNode }> = ({ node }) => {
    return (
        <li className="mb-1">
            {node.checked !== undefined && (
                <input type="checkbox" checked={node.checked} readOnly className="mr-2" />
            )}
            <InlineRenderer nodes={node.children || []} />
        </li>
    );
};

const InlineRenderer: React.FC<{ nodes: OrgNode[] }> = ({ nodes }) => {
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
                    return <img key={index} src={imgNode.src} alt={imgNode.alt} className="max-w-full h-auto my-2 rounded shadow" />;
                }
                return null;
            })}
        </>
    );
};
