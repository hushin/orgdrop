export type OrgNodeType = 'root' | 'heading' | 'paragraph' | 'text' | 'list' | 'list_item' | 'link' | 'image' | 'block' | 'table' | 'table_row' | 'table_cell';

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
    scheduled?: string;
    deadline?: string;
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

export interface OrgBlockNode extends OrgNode {
    type: 'block';
    name: string;
    params?: string;
    value: string;
}

export interface OrgTableNode extends OrgNode {
    type: 'table';
    children: OrgTableRowNode[];
}

export interface OrgTableRowNode extends OrgNode {
    type: 'table_row';
    children: OrgTableCellNode[];
}

export interface OrgTableCellNode extends OrgNode {
    type: 'table_cell';
    children: OrgNode[];
}

export interface OrgFile {
    nodes: OrgNode[];
    metadata: Record<string, any>;
}
