import type { OrgHeadingNode } from '../org/ast';

export interface AgendaItem {
    file: string;
    heading: OrgHeadingNode;
}

export type AgendaGroup = {
    todoKeyword: string;
    items: AgendaItem[];
};
