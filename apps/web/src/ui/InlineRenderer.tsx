import React from "react";
import type { OrgNode, OrgLinkNode } from "@orgdrop/domain";

interface InlineRendererProps {
	nodes?: OrgNode[];
}

export const InlineRenderer: React.FC<InlineRendererProps> = ({ nodes }) => {
	if (!nodes || nodes.length === 0) return null;

	return (
		<span>
			{nodes.map((node, index) => {
				if (node.type === "text") {
					return <span key={index}>{node.content}</span>;
				}
				if (node.type === "link") {
					const linkNode = node as OrgLinkNode;
					return (
						<a
							key={index}
							href={linkNode.src}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							{linkNode.description || linkNode.src}
						</a>
					);
				}
				return null;
			})}
		</span>
	);
};
