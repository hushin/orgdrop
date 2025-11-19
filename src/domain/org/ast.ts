export type OrgNodeType = 'root' | 'heading' | 'paragraph' | 'text' | 'list' | 'list_item' | 'link' | 'image';

export interface OrgNode {
    type: OrgNodeType;
    children?: OrgNode[];
    content?: string;
    properties?: Record<string, any>;
}

export interface OrgHeadingNode extends OrgNode {
    type: 'heading';
    level: number;
    todoKeyword?: string;
    priority?: string;
    tags?: string[];
    title: string;
}

export interface OrgListNode extends OrgNode {
    type: 'list';
    ordered: boolean;
    indent: number;
}

export interface OrgListItemNode extends OrgNode {
    type: 'list_item';
    indent: number;
    bullet: string;
    checked?: boolean; // for checkboxes [ ] [X] [-]
}

export interface OrgLinkNode extends OrgNode {
    type: 'link';
    src: string;
    description?: string;
}

export interface OrgImageNode extends OrgNode {
    type: 'image';
    src: string;
    alt?: string;
}

export interface OrgFile {
    nodes: OrgNode[];
    metadata: Record<string, any>;
}
