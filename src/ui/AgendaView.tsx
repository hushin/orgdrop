import React from 'react';
import type { AgendaItem } from '../domain/agenda/AgendaItem';

interface AgendaViewProps {
    items: AgendaItem[];
    onItemClick: (file: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ items, onItemClick }) => {
    const groupedItems = items.reduce((acc, item) => {
        const keyword = item.heading.todoKeyword || 'UNKNOWN';
        if (!acc[keyword]) {
            acc[keyword] = [];
        }
        acc[keyword].push(item);
        return acc;
    }, {} as Record<string, AgendaItem[]>);

    const order = ['TODO', 'NEXT', 'WAITING', 'UNKNOWN'];
    const sortedKeys = Object.keys(groupedItems).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Agenda</h2>
            {sortedKeys.map(keyword => (
                <div key={keyword} className="mb-8">
                    <h3 className={`text-lg font-bold mb-4 pb-2 border-b ${keyword === 'TODO' ? 'text-red-600 border-red-200' :
                            keyword === 'NEXT' ? 'text-blue-600 border-blue-200' :
                                keyword === 'WAITING' ? 'text-yellow-600 border-yellow-200' :
                                    'text-gray-600 border-gray-200'
                        }`}>
                        {keyword}
                    </h3>
                    <ul className="space-y-3">
                        {groupedItems[keyword].map((item, index) => (
                            <li key={index} className="flex items-start group cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => onItemClick(item.file)}>
                                <span className="text-xs font-mono text-gray-400 mt-1 w-24 flex-shrink-0">{item.file}</span>
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        {item.heading.priority && (
                                            <span className="text-yellow-600 font-mono text-sm mr-2 font-bold">[#{item.heading.priority}]</span>
                                        )}
                                        <span className="text-gray-900 font-medium">{item.heading.title}</span>
                                        {item.heading.tags && item.heading.tags.length > 0 && (
                                            <span className="ml-auto text-xs text-gray-400">
                                                {item.heading.tags.map(tag => `:${tag}:`).join('')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            {items.length === 0 && (
                <p className="text-gray-500 text-center py-8">No tasks found.</p>
            )}
        </div>
    );
};
