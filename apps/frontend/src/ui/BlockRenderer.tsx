import React from "react";
import type { OrgBlockNode } from "@orgdrop/domain";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const BlockRenderer: React.FC<{ node: OrgBlockNode }> = ({ node }) => {
	if (node.name === "SRC") {
		const language = node.params?.trim() || "text";
		return (
			<div className="mb-4 rounded overflow-hidden text-sm">
				<SyntaxHighlighter
					language={language}
					style={vscDarkPlus}
					customStyle={{ margin: 0, padding: "1rem" }}
				>
					{node.value}
				</SyntaxHighlighter>
			</div>
		);
	}
	return (
		<pre className="mb-4 p-4 bg-gray-100 rounded text-sm overflow-x-auto font-mono text-gray-800">
			{node.value}
		</pre>
	);
};

export default BlockRenderer;
