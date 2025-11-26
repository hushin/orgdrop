import { describe, it, expect } from 'vitest';
import { OrgParser } from './parser';
import { OrgHeadingNode, OrgBlockNode } from './ast';

describe('OrgParser Extension', () => {
    const parser = new OrgParser();

    it('should parse file-level keywords', () => {
        const text = `
#+TITLE: My Org File
#+FILETAGS: :draft:work:
* Heading 1
`;
        const result = parser.parse(text);
        expect(result.metadata.title).toBe('My Org File');
        expect(result.metadata.filetags).toBe(':draft:work:');
    });

    it('should parse top-level PROPERTIES drawer', () => {
        const text = `
:PROPERTIES:
:ID:       12345
:mtime:    20251122
:END:
#+TITLE: Test
* Heading 1
`;
        const result = parser.parse(text);
        expect(result.metadata.id).toBe('12345');
        expect(result.metadata.mtime).toBe('20251122');
        expect(result.metadata.title).toBe('Test');
    });

    it('should parse heading-level PROPERTIES drawer', () => {
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
        expect(heading.type).toBe('heading');
        expect(heading.properties).toBeDefined();
        expect(heading.properties?.ID).toBe('heading-id-1');
        expect(heading.properties?.CUSTOM_ID).toBe('my-custom-id');
    });

    it('should handle mixed properties', () => {
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
        expect(result.metadata.root_prop).toBe('root');
        expect(result.metadata.author).toBe('Me');

        const heading = result.nodes[0] as OrgHeadingNode;
        expect(heading.properties?.HEAD_PROP).toBe('head');
    });

    it('should handle file starting with BOM', () => {
        const text = '\uFEFF:PROPERTIES:\n:ID: 123\n:END:\n#+TITLE: BOM Test';
        const result = parser.parse(text);
        expect(result.metadata.id).toBe('123');
        expect(result.metadata.title).toBe('BOM Test');
    });

    it('should parse code blocks', () => {
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
        expect(heading.type).toBe('heading');

        const block = result.nodes[1] as OrgBlockNode;
        expect(block.type).toBe('block');
        expect(block.name).toBe('SRC');
        expect(block.params).toBe('typescript');
        expect(block.value).toBe('const a = 1;\nconsole.log(a);');
    });

    it('should parse raw URLs as links', () => {
        const text = 'Visit https://example.com for more info.';
        const parser = new OrgParser();
        const result = parser.parse(text);

        const paragraph = result.nodes[0];
        expect(paragraph.type).toBe('paragraph');
        expect(paragraph.children).toHaveLength(3);
        expect(paragraph.children![0]).toEqual({ type: 'text', content: 'Visit ' });
        expect(paragraph.children![1]).toEqual({
            type: 'link',
            src: 'https://example.com',
            description: 'https://example.com'
        });
        expect(paragraph.children![2]).toEqual({ type: 'text', content: ' for more info.' });
    });

    it('should parse tables', () => {
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
        expect(table.type).toBe('table');
        expect(table.children).toHaveLength(3);

        const row1 = table.children[0];
        expect(row1.type).toBe('table_row');
        expect(row1.children[0].children[0].content).toBe('Name');
        expect(row1.children[1].children[0].content).toBe('Age');

        const row2 = table.children[1];
        expect(row2.children[0].children[0].content).toBe('Alice');
        expect(row2.children[1].children[0].content).toBe('20');
    });

    it('should parse links in headings', () => {
        const text = '* TODO Check [[https://google.com][Google]]';
        const parser = new OrgParser();
        const result = parser.parse(text);
        const heading = result.nodes[0] as OrgHeadingNode;

        expect(heading.type).toBe('heading');
        expect(heading.title).toBe('Check [[https://google.com][Google]]'); // Title string remains raw for now if that's how it works, or maybe it should be stripped?
        // Actually, let's check children
        expect(heading.children).toBeDefined();
        expect(heading.children).toHaveLength(2);
        expect(heading.children![0]).toEqual({ type: 'text', content: 'Check ' });
        expect(heading.children![1]).toEqual({
            type: 'link',
            src: 'https://google.com',
            description: 'Google'
        });
    });
});
