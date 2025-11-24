import { describe, it, expect } from 'vitest';
import { OrgParser } from './parser';
import { OrgHeadingNode } from './ast';

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
        // Should not have paragraph nodes for properties
        expect(result.nodes.length).toBe(0);
    });
});
