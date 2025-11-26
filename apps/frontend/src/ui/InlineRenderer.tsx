import React from "react";
import type {
	OrgNode,
	OrgLinkNode,
	OrgCodeNode,
	OrgVerbatimNode,
	OrgImageNode,
} from "@orgdrop/domain";

interface InlineRendererProps {
	nodes?: OrgNode[];
	resolveImage?: (src: string) => string;
	onLinkClick?: (href: string) => void;
}

export const InlineRenderer: React.FC<InlineRendererProps> = ({
	nodes,
	resolveImage,
	onLinkClick,
}) => {
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
							target={onLinkClick ? undefined : "_blank"}
							rel={onLinkClick ? undefined : "noopener noreferrer"}
							className="text-blue-600 hover:underline"
							onClick={(e) => {
								e.stopPropagation();
								if (onLinkClick) {
									e.preventDefault();
									onLinkClick(linkNode.src);
								}
							}}
						>
							{linkNode.description || linkNode.src}
						</a>
					);
				}
				if (node.type === "image") {
					const imgNode = node as OrgImageNode;
					const src = resolveImage ? resolveImage(imgNode.src) : imgNode.src;
					return (
						<img
							key={index}
							src={src}
							alt={imgNode.alt}
							className="max-w-full h-auto my-2 rounded shadow"
						/>
					);
				}
				if (node.type === "code") {
					const codeNode = node as OrgCodeNode;
					return (
						<code
							key={index}
							className="bg-gray-100 px-1 rounded font-mono text-sm text-pink-600"
						>
							{codeNode.value}
						</code>
					);
				}
				if (node.type === "verbatim") {
					const verbatimNode = node as OrgVerbatimNode;
					return (
						<code
							key={index}
							className="bg-gray-100 px-1 rounded font-mono text-sm text-gray-800"
						>
							{verbatimNode.value}
						</code>
					);
				}
				return null;
			})}
		</span>
	);
};
