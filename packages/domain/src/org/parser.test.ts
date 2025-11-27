import { describe, expect, it } from "vitest";
import {
	type OrgBlockNode,
	OrgCodeNode,
	type OrgHeadingNode,
	OrgVerbatimNode,
} from "./ast";
import { OrgParser } from "./parser";

describe("OrgParser Extension", () => {
	const parser = new OrgParser();

	it("should parse file-level keywords", () => {
		const text = `
#+TITLE: My Org File
#+FILETAGS: :draft:work:
* Heading 1
`;
		const result = parser.parse(text);
		expect(result.metadata.title).toBe("My Org File");
		expect(result.metadata.filetags).toBe(":draft:work:");
	});

	it("should parse top-level PROPERTIES drawer", () => {
		const text = `
:PROPERTIES:
:ID:       12345
:mtime:    20251122
:END:
#+TITLE: Test
* Heading 1
`;
		const result = parser.parse(text);
		expect(result.metadata.id).toBe("12345");
		expect(result.metadata.mtime).toBe("20251122");
		expect(result.metadata.title).toBe("Test");
	});

	it("should parse heading-level PROPERTIES drawer", () => {
		const text = `
* Heading 1
:PROPERTIES:
:ID:       heading-id-1
:CUSTOM_ID: my-custom-id
:END:
Content
`;
		const result = parser.parse(text);
		const heading = result.nodes[0] as OrgHeadingNode;
		expect(heading.type).toBe("heading");
		expect(heading.properties).toBeDefined();
		expect(heading.properties?.ID).toBe("heading-id-1");
		expect(heading.properties?.CUSTOM_ID).toBe("my-custom-id");
	});

	it("should handle mixed properties", () => {
		const text = `
:PROPERTIES:
:ROOT_PROP: root
:END:
#+AUTHOR: Me
* Heading 1
:PROPERTIES:
:HEAD_PROP: head
:END:
`;
		const result = parser.parse(text);
		expect(result.metadata.root_prop).toBe("root");
		expect(result.metadata.author).toBe("Me");

		const heading = result.nodes[0] as OrgHeadingNode;
		expect(heading.properties?.HEAD_PROP).toBe("head");
	});

	it("should handle file starting with BOM", () => {
		const text = "\uFEFF:PROPERTIES:\n:ID: 123\n:END:\n#+TITLE: BOM Test";
		const result = parser.parse(text);
		expect(result.metadata.id).toBe("123");
		expect(result.metadata.title).toBe("BOM Test");
	});

	it("should parse code blocks", () => {
		const text = `
* Heading
#+BEGIN_SRC typescript
const a = 1;
console.log(a);
#+END_SRC
`;
		const parser = new OrgParser();
		const result = parser.parse(text);
		const heading = result.nodes[0] as OrgHeadingNode;
		expect(heading.type).toBe("heading");

		const block = result.nodes[1] as OrgBlockNode;
		expect(block.type).toBe("block");
		expect(block.name).toBe("SRC");
		expect(block.params).toBe("typescript");
		expect(block.value).toBe("const a = 1;\nconsole.log(a);");
	});

	it("should parse raw URLs as links", () => {
		const text = "Visit https://example.com for more info.";
		const parser = new OrgParser();
		const result = parser.parse(text);

		const paragraph = result.nodes[0];
		expect(paragraph.type).toBe("paragraph");
		expect(paragraph.children).toHaveLength(3);
		expect(paragraph.children![0]).toEqual({ type: "text", content: "Visit " });
		expect(paragraph.children![1]).toEqual({
			type: "link",
			src: "https://example.com",
			description: "https://example.com",
		});
		expect(paragraph.children![2]).toEqual({
			type: "text",
			content: " for more info.",
		});
	});

	it("should parse tables", () => {
		const text = `
| Name  | Age |
|-------+-----|
| Alice | 20  |
| Bob   | 30  |
`;
		const parser = new OrgParser();
		const result = parser.parse(text);

		// Assuming the parser will ignore the separator line and return a table with 3 rows
		const table = result.nodes[0] as any; // Cast to any until AST is updated
		expect(table.type).toBe("table");
		expect(table.children).toHaveLength(3);

		const row1 = table.children[0];
		expect(row1.type).toBe("table_row");
		expect(row1.children[0].children[0].content).toBe("Name");
		expect(row1.children[1].children[0].content).toBe("Age");

		const row2 = table.children[1];
		expect(row2.children[0].children[0].content).toBe("Alice");
		expect(row2.children[1].children[0].content).toBe("20");
	});

	it("should parse links in headings", () => {
		const text = "* TODO Check [[https://google.com][Google]]";
		const parser = new OrgParser();
		const result = parser.parse(text);
		const heading = result.nodes[0] as OrgHeadingNode;

		expect(heading.type).toBe("heading");
		expect(heading.title).toBe("Check [[https://google.com][Google]]"); // Title string remains raw for now if that's how it works, or maybe it should be stripped?
		// Actually, let's check children
		expect(heading.children).toBeDefined();
		expect(heading.children).toHaveLength(2);
		expect(heading.children![0]).toEqual({ type: "text", content: "Check " });
		expect(heading.children![1]).toEqual({
			type: "link",
			src: "https://google.com",
			description: "Google",
		});
	});

	it("should merge consecutive lines into a single paragraph", () => {
		const text = `Line 1
Line 2`;
		const parser = new OrgParser();
		const result = parser.parse(text);
		expect(result.nodes).toHaveLength(1);
		expect(result.nodes[0].type).toBe("paragraph");
		expect(result.nodes[0].content).toBe("Line 1\nLine 2");
	});

	it("should separate paragraphs with empty lines", () => {
		const text = `Line 1

Line 2`;
		const parser = new OrgParser();
		const result = parser.parse(text);
		expect(result.nodes).toHaveLength(2);
		expect(result.nodes[0].type).toBe("paragraph");
		expect(result.nodes[0].content).toBe("Line 1");
		expect(result.nodes[1].type).toBe("paragraph");
		expect(result.nodes[1].content).toBe("Line 2");
	});

	it("should handle multiple empty lines as paragraph separator", () => {
		const text = `Line 1


Line 2`;
		const parser = new OrgParser();
		const result = parser.parse(text);
		expect(result.nodes).toHaveLength(2);
		expect(result.nodes[0].type).toBe("paragraph");
		expect(result.nodes[0].content).toBe("Line 1");
		expect(result.nodes[1].type).toBe("paragraph");
		expect(result.nodes[1].content).toBe("Line 2");
	});

	it("should not merge block with text", () => {
		const text = `
#+BEGIN_SRC
code
#+END_SRC
Text
`;
		const parser = new OrgParser();
		const result = parser.parse(text);

		const nodes = result.nodes;
		const blockIndex = nodes.findIndex((n) => n.type === "block");
		expect(blockIndex).toBeGreaterThanOrEqual(0);

		// The text after block should be a new paragraph
		const textNode = nodes[blockIndex + 1];
		expect(textNode).toBeDefined();
		expect(textNode.type).toBe("paragraph");
		expect(textNode.content).toBe("Text");
	});
});

describe("OrgParser Inline Formatting", () => {
	const parser = new OrgParser();

	it("should parse inline code", () => {
		const text = "This is ~code~.";
		const result = parser.parse(text);
		const paragraph = result.nodes[0];
		expect(paragraph.children).toHaveLength(3);
		expect(paragraph.children![0]).toEqual({
			type: "text",
			content: "This is ",
		});
		expect(paragraph.children![1]).toEqual({ type: "code", value: "code" });
		expect(paragraph.children![2]).toEqual({ type: "text", content: "." });
	});

	it("should parse inline verbatim", () => {
		const text = "This is =verbatim=.";
		const result = parser.parse(text);
		const paragraph = result.nodes[0];
		expect(paragraph.children).toHaveLength(3);
		expect(paragraph.children![0]).toEqual({
			type: "text",
			content: "This is ",
		});
		expect(paragraph.children![1]).toEqual({
			type: "verbatim",
			value: "verbatim",
		});
		expect(paragraph.children![2]).toEqual({ type: "text", content: "." });
	});

	it("should parse mixed inline formatting", () => {
		const text =
			"Check ~code~ and =verbatim= and [[https://example.com][link]].";
		const result = parser.parse(text);
		const paragraph = result.nodes[0];

		expect(paragraph.children).toHaveLength(7);
		expect(paragraph.children![1]).toEqual({ type: "code", value: "code" });
		expect(paragraph.children![3]).toEqual({
			type: "verbatim",
			value: "verbatim",
		});
		expect(paragraph.children![5].type).toBe("link");
	});

	it("should prioritize code over verbatim if nested", () => {
		const text = "~code =verbatim=~";
		const result = parser.parse(text);
		const paragraph = result.nodes[0];
		expect(paragraph.children).toHaveLength(1);
		expect(paragraph.children![0]).toEqual({
			type: "code",
			value: "code =verbatim=",
		});
	});

	it("should handle code inside text with URLs", () => {
		const text = "Click ~http://example.com~";
		const result = parser.parse(text);
		const paragraph = result.nodes[0];
		expect(paragraph.children).toHaveLength(2);
		expect(paragraph.children![0]).toEqual({ type: "text", content: "Click " });
		expect(paragraph.children![1]).toEqual({
			type: "code",
			value: "http://example.com",
		});
	});
});

describe("OrgParser Nested Lists", () => {
	const parser = new OrgParser();

	it("should parse nested unordered lists", () => {
		const text = `- Item 1
  - Nested 1
  - Nested 2
- Item 2`;
		const result = parser.parse(text);

		expect(result.nodes).toHaveLength(1);
		const list = result.nodes[0] as any;
		expect(list.type).toBe("list");
		expect(list.ordered).toBe(false);
		expect(list.children).toHaveLength(2);

		// Item 1 should have nested list in children
		const item1 = list.children[0];
		expect(item1.type).toBe("list_item");
		// Item 1 children: [text node, nested list]
		expect(item1.children.length).toBeGreaterThanOrEqual(2);
		const nestedList = item1.children.find((c: any) => c.type === "list");
		expect(nestedList).toBeDefined();
		expect(nestedList.children).toHaveLength(2);
		expect(nestedList.children[0].type).toBe("list_item");

		// Item 2 should not have nested list
		const item2 = list.children[1];
		expect(item2.type).toBe("list_item");
	});

	it("should parse deeply nested lists", () => {
		const text = `- Level 1
  - Level 2
    - Level 3`;
		const result = parser.parse(text);

		const list = result.nodes[0] as any;
		expect(list.type).toBe("list");

		const level1Item = list.children[0];
		const level2List = level1Item.children.find((c: any) => c.type === "list");
		expect(level2List).toBeDefined();

		const level2Item = level2List.children[0];
		const level3List = level2Item.children.find((c: any) => c.type === "list");
		expect(level3List).toBeDefined();
		expect(level3List.children[0].type).toBe("list_item");
	});

	it("should parse nested ordered lists", () => {
		const text = `1. First
   1. Sub first
   2. Sub second
2. Second`;
		const result = parser.parse(text);

		const list = result.nodes[0] as any;
		expect(list.type).toBe("list");
		expect(list.ordered).toBe(true);
		expect(list.children).toHaveLength(2);

		const item1 = list.children[0];
		const nestedList = item1.children.find((c: any) => c.type === "list");
		expect(nestedList).toBeDefined();
		expect(nestedList.ordered).toBe(true);
		expect(nestedList.children).toHaveLength(2);
	});

	it("should parse mixed ordered and unordered nested lists", () => {
		const text = `- Unordered
  1. Ordered nested
  2. Ordered nested 2
- Unordered 2`;
		const result = parser.parse(text);

		const list = result.nodes[0] as any;
		expect(list.ordered).toBe(false);

		const item1 = list.children[0];
		const nestedList = item1.children.find((c: any) => c.type === "list");
		expect(nestedList).toBeDefined();
		expect(nestedList.ordered).toBe(true);
	});

	it("should handle returning to parent level", () => {
		const text = `- Item 1
  - Nested
- Item 2
  - Nested 2`;
		const result = parser.parse(text);

		const list = result.nodes[0] as any;
		expect(list.children).toHaveLength(2);

		const item1 = list.children[0];
		const nested1 = item1.children.find((c: any) => c.type === "list");
		expect(nested1.children).toHaveLength(1);

		const item2 = list.children[1];
		const nested2 = item2.children.find((c: any) => c.type === "list");
		expect(nested2.children).toHaveLength(1);
	});
});
