import type { OrgNode, OrgFile, OrgHeadingNode, OrgListNode, OrgListItemNode, OrgLinkNode, OrgImageNode } from './ast';

export class OrgParser {
    private todoKeywords: string[][] = [
        ['TODO', 'NEXT', '|', 'DONE'],
        ['WAITING', '|', 'CANCELED']
    ];

    constructor(todoKeywords?: string[][]) {
        if (todoKeywords) {
            this.todoKeywords = todoKeywords;
        }
    }

    parse(text: string): OrgFile {
        const lines = text.split(/\r?\n/);
        const nodes: OrgNode[] = [];
        let currentList: OrgListNode | null = null;
        const metadata: Record<string, any> = {};
        let inPropertiesDrawer = false;

        for (const line of lines) {
            const headingMatch = line.match(/^(\*+)\s+(.*)/);
            const listMatch = line.match(/^(\s*)([-+*]|\d+[.)])\s+(.*)/);
            const keywordMatch = line.match(/^#\+([a-zA-Z0-9_]+):\s*(.*)/);
            const drawerStartMatch = line.match(/^\s*:PROPERTIES:\s*$/);
            const drawerEndMatch = line.match(/^\s*:END:\s*$/);
            const propertyMatch = line.match(/^\s*:([a-zA-Z0-9_-]+):\s*(.*)/);

            if (inPropertiesDrawer) {
                if (drawerEndMatch) {
                    inPropertiesDrawer = false;
                    continue;
                }
                if (propertyMatch) {
                    const key = propertyMatch[1];
                    const value = propertyMatch[2].trim();

                    // Determine target: last heading or file metadata
                    const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;
                    if (lastNode && lastNode.type === 'heading') {
                        if (!lastNode.properties) {
                            lastNode.properties = {};
                        }
                        lastNode.properties[key] = value;
                    } else {
                        // Top-level property -> metadata
                        metadata[key.toLowerCase()] = value;
                    }
                }
                continue; // Skip other processing inside drawer
            }

            if (drawerStartMatch) {
                inPropertiesDrawer = true;
                continue;
            }

            if (keywordMatch) {
                const key = keywordMatch[1].toLowerCase();
                const value = keywordMatch[2].trim();
                metadata[key] = value;
                continue;
            }

            if (headingMatch) {
                currentList = null; // Break list on heading
                const level = headingMatch[1].length;
                const rawTitle = headingMatch[2];
                const { todoKeyword, priority, title, tags } = this.parseHeadingContent(rawTitle);

                const headingNode: OrgHeadingNode = {
                    type: 'heading',
                    level,
                    todoKeyword,
                    priority,
                    title,
                    tags,
                    children: this.parseInline(title) // Parse title for links/images too? Usually titles are plain text but can have links.
                };
                nodes.push(headingNode);
            } else if (listMatch) {
                const indent = listMatch[1].length;
                const bullet = listMatch[2];
                let content = listMatch[3];
                const ordered = /^\d+[.)]/.test(bullet);

                // Check for checkbox [ ] [X] [-]
                const checkboxMatch = content.match(/^\[([ X-])\]\s+(.*)/);
                let checked: boolean | undefined;
                if (checkboxMatch) {
                    checked = checkboxMatch[1] !== ' ';
                    content = checkboxMatch[2];
                }

                const listItem: OrgListItemNode = {
                    type: 'list_item',
                    indent,
                    bullet,
                    checked,
                    children: this.parseInline(content)
                };

                // Simple list handling: if currentList exists and matches type/indent, append.
                // Otherwise create new list.
                // Note: This is a simplified list parser. Nested lists need more complex stack logic.
                // For now, let's just group consecutive list items.

                if (!currentList || currentList.ordered !== ordered) {
                    currentList = {
                        type: 'list',
                        ordered,
                        indent,
                        children: [listItem]
                    };
                    nodes.push(currentList);
                } else {
                    currentList.children?.push(listItem);
                }

            } else {
                currentList = null; // Break list on non-list line

                // Check for planning line (SCHEDULED/DEADLINE)
                // It usually appears right after the heading, but we'll check if the last node is a heading.
                // Example: SCHEDULED: <2023-10-27 Fri> DEADLINE: <2023-10-28 Sat>
                const planningMatch = line.match(/(SCHEDULED|DEADLINE):\s*<([^>]+)>/);

                if (planningMatch) {
                    const lastNode = nodes[nodes.length - 1];
                    if (lastNode && lastNode.type === 'heading') {
                        const scheduledMatch = line.match(/SCHEDULED:\s*<([^>]+)>/);
                        const deadlineMatch = line.match(/DEADLINE:\s*<([^>]+)>/);

                        if (scheduledMatch) {
                            (lastNode as OrgHeadingNode).scheduled = scheduledMatch[1];
                        }
                        if (deadlineMatch) {
                            (lastNode as OrgHeadingNode).deadline = deadlineMatch[1];
                        }
                        continue; // Skip adding this line as a paragraph
                    }
                }

                // Treat as paragraph/text for now if not empty
                if (line.trim() !== '') {
                    nodes.push({
                        type: 'paragraph',
                        content: line,
                        children: this.parseInline(line)
                    });
                }
            }
        }

        return {
            nodes,
            metadata,
        };
    }

    private parseInline(text: string): OrgNode[] {
        const nodes: OrgNode[] = [];
        // Regex for links: [[src][desc]] or [[src]]
        // Regex for images: file:path.png or [[file:path.png]] (handled by link regex usually, but we need to distinguish)
        // Simplified inline parser: split by links

        const linkRegex = /\[\[(.*?)\](?:\[(.*?)\])?\]/g;
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                nodes.push({ type: 'text', content: text.substring(lastIndex, match.index) });
            }

            const src = match[1];
            const desc = match[2];

            // Check if image
            if (this.isImage(src)) {
                nodes.push({
                    type: 'image',
                    src: src,
                    alt: desc
                } as OrgImageNode);
            } else {
                nodes.push({
                    type: 'link',
                    src: src,
                    description: desc || src
                } as OrgLinkNode);
            }

            lastIndex = linkRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            nodes.push({ type: 'text', content: text.substring(lastIndex) });
        }

        return nodes;
    }

    private isImage(src: string): boolean {
        return /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(src);
    }

    private parseHeadingContent(rawTitle: string): { todoKeyword?: string, priority?: string, title: string, tags?: string[] } {
        let title = rawTitle;
        let todoKeyword: string | undefined;
        let priority: string | undefined;
        let tags: string[] | undefined;

        // 1. Parse TODO Keyword
        const words = title.split(/\s+/);
        if (words.length > 0) {
            const firstWord = words[0];
            if (this.isTodoKeyword(firstWord)) {
                todoKeyword = firstWord;
                title = words.slice(1).join(' ');
            }
        }

        // 2. Parse Priority [\#A]
        const priorityMatch = title.match(/^\[#([A-Z])\]\s+(.*)/);
        if (priorityMatch) {
            priority = priorityMatch[1];
            title = priorityMatch[2];
        }

        // 3. Parse Tags :tag1:tag2:
        const tagsMatch = title.match(/(.*?)\s+:([a-zA-Z0-9_@%:]+):\s*$/);
        if (tagsMatch) {
            title = tagsMatch[1];
            tags = tagsMatch[2].split(':').filter(t => t !== '');
        }

        return { todoKeyword, priority, title, tags };
    }

    private isTodoKeyword(word: string): boolean {
        const cleanWord = word.replace(/\(.\)$/, ''); // Remove access key like TODO(t)
        for (const sequence of this.todoKeywords) {
            for (const keyword of sequence) {
                if (keyword === '|') continue;
                const cleanKeyword = keyword.replace(/\(.\)$/, '').replace('(!)', '').replace('(@)', '');
                // Simple check for now, can be improved to handle complex config
                if (cleanKeyword === cleanWord) return true;
            }
        }
        return false;
    }
}
