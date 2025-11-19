import { describe, it, expect } from 'vitest';
import { OrgParser } from './parser';

describe('OrgParser', () => {
    it('should parse empty string', () => {
        const parser = new OrgParser();
        const result = parser.parse('');
        expect(result).toEqual({
            nodes: [],
            metadata: {},
        });
    });
});
