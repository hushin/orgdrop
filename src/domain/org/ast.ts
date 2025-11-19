export type OrgNode = {
    type: string;
    children?: OrgNode[];
    content?: string;
    properties?: Record<string, any>;
};

export type OrgFile = {
    nodes: OrgNode[];
    metadata: Record<string, any>;
};
