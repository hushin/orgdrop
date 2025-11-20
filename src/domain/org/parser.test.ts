import { describe, it, expect } from 'vitest';
import { OrgParser } from './parser';
import type { OrgHeadingNode } from './ast';

describe('OrgParser', () => {
    it('should parse empty string', () => {
        const parser = new OrgParser();
        const result = parser.parse('');
        expect(result).toEqual({
            nodes: [],
            metadata: {},
        });
    });

    it('should parse simple heading', () => {
        const parser = new OrgParser();
        const result = parser.parse('* Hello World');
        expect(result.nodes).toHaveLength(1);
        const node = result.nodes[0] as OrgHeadingNode;
        expect(node.type).toBe('heading');
        expect(node.level).toBe(1);
        expect(node.title).toBe('Hello World');
    });

    it('should parse TODO heading', () => {
        const parser = new OrgParser();
        const result = parser.parse('** TODO Fix bugs');
        const node = result.nodes[0] as OrgHeadingNode;
        expect(node.todoKeyword).toBe('TODO');
        expect(node.title).toBe('Fix bugs');
        expect(node.level).toBe(2);
    });

    it('should parse heading with tags', () => {
        const parser = new OrgParser();
        const result = parser.parse('* Meeting :work:urgent:');
        const node = result.nodes[0] as OrgHeadingNode;
        expect(node.title).toBe('Meeting');
        expect(node.tags).toEqual(['work', 'urgent']);
    });

    it('should parse heading with priority', () => {
        const parser = new OrgParser();
        const result = parser.parse('* [#A] High priority');
        const node = result.nodes[0] as OrgHeadingNode;
        expect(node.priority).toBe('A');
        expect(node.title).toBe('High priority');
    });

    it('should parse complex heading', () => {
        const parser = new OrgParser();
        const result = parser.parse('*** NEXT [#B] Complex Task :dev:');
        const node = result.nodes[0] as OrgHeadingNode;
        expect(node.level).toBe(3);
        expect(node.todoKeyword).toBe('NEXT');
        expect(node.priority).toBe('B');
        expect(node.title).toBe('Complex Task');
        expect(node.tags).toEqual(['dev']);
    });

    it('should parse simple list', () => {
        const parser = new OrgParser();
        const result = parser.parse('- Item 1\n- Item 2');
        expect(result.nodes).toHaveLength(1);
        const list = result.nodes[0] as any;
        expect(list.type).toBe('list');
        expect(list.ordered).toBe(false);
        expect(list.children).toHaveLength(2);
        expect(list.children[0].children[0].content).toBe('Item 1');
    });

    it('should parse checkbox list', () => {
        const parser = new OrgParser();
        const result = parser.parse('- [ ] Todo\n- [X] Done');
        const list = result.nodes[0] as any;
        expect(list.children[0].checked).toBe(false);
        expect(list.children[1].checked).toBe(true);
    });

    it('should parse links', () => {
        const parser = new OrgParser();
        const result = parser.parse('Check [[https://google.com][Google]]');
        const paragraph = result.nodes[0];
        expect(paragraph.children).toHaveLength(2);
        expect(paragraph.children![0].content).toBe('Check ');
        expect(paragraph.children![1].type).toBe('link');
        expect((paragraph.children![1] as any).src).toBe('https://google.com');
        expect((paragraph.children![1] as any).description).toBe('Google');
    });

    it('should parse images', () => {
        const parser = new OrgParser();
        const result = parser.parse('[[file:image.png]]');
        const paragraph = result.nodes[0];
        expect(paragraph.children![0].type).toBe('image');
        expect((paragraph.children![0] as any).src).toBe('file:image.png');
    });

    it('should parse SCHEDULED and DEADLINE', () => {
        const parser = new OrgParser();
        const result = parser.parse('* Task\nSCHEDULED: <2023-10-27 Fri> DEADLINE: <2023-10-28 Sat>');
        const node = result.nodes[0] as OrgHeadingNode;
        expect(node.scheduled).toBe('2023-10-27 Fri');
        expect(node.deadline).toBe('2023-10-28 Sat');
    });
});
