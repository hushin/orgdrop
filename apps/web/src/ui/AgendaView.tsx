import React from 'react';
import type { AgendaItem } from '@orgdrop/domain';

interface AgendaViewProps {
    items: AgendaItem[];
    onItemClick: (file: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ items, onItemClick }) => {
    // Helper functions
    const parseDate = (dateStr?: string): Date | null => {
        if (!dateStr) return null;
        const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return null;
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 8); // +1d + 7 days

    const isSameDay = (d1: Date, d2: Date) => d1.getTime() === d2.getTime();
    const isPast = (d: Date) => d < today;

    const getCategory = (item: AgendaItem) => item.file.replace(/\.org$/, '');

    // 1. NEXT
    const nextItems = items.filter(i => i.heading.todoKeyword === 'NEXT');

    // 2. Agenda (Today)
    const todayItems = items.filter(item => {
        const scheduled = parseDate(item.heading.scheduled);
        const deadline = parseDate(item.heading.deadline);

        const isScheduledToday = scheduled && isSameDay(scheduled, today);
        const isDeadlineToday = deadline && isSameDay(deadline, today);
        const isOverdue = deadline && isPast(deadline);
        const isReschedule = scheduled && isPast(scheduled);

        return isScheduledToday || isDeadlineToday || isOverdue || isReschedule;
    });

    const overdueItems = todayItems.filter(i => i.heading.deadline && isPast(parseDate(i.heading.deadline)!));
    const rescheduleItems = todayItems.filter(i => i.heading.scheduled && isPast(parseDate(i.heading.scheduled)!));
    const todayDueItems = todayItems.filter(i => {
        const s = parseDate(i.heading.scheduled);
        const d = parseDate(i.heading.deadline);
        return (s && isSameDay(s, today)) || (d && isSameDay(d, today));
    });

    // 3. Agenda (Next 7 days)
    const upcomingItems = items.filter(item => {
        const scheduled = parseDate(item.heading.scheduled);
        const deadline = parseDate(item.heading.deadline);

        const sValid = scheduled && scheduled >= tomorrow && scheduled < nextWeek;
        const dValid = deadline && deadline >= tomorrow && deadline < nextWeek;
        return sValid || dValid;
    });

    // Group upcoming by day
    const upcomingByDay = new Map<string, AgendaItem[]>();
    for (let d = new Date(tomorrow); d < nextWeek; d.setDate(d.getDate() + 1)) {
        upcomingByDay.set(d.toDateString(), []);
    }
    upcomingItems.forEach(item => {
        const s = parseDate(item.heading.scheduled);
        const d = parseDate(item.heading.deadline);
        if (s && s >= tomorrow && s < nextWeek) {
            upcomingByDay.get(s.toDateString())?.push(item);
        } else if (d && d >= tomorrow && d < nextWeek) {
            upcomingByDay.get(d.toDateString())?.push(item);
        }
    });

    // 4. WAITING
    const waitingItems = items.filter(i => i.heading.todoKeyword === 'WAITING');

    // 5. Tasks (All TODOs)
    const activeTodos = items.filter(i =>
        i.heading.todoKeyword &&
        !['DONE', 'CANCELED', 'NEXT', 'WAITING'].includes(i.heading.todoKeyword)
    );

    const importantItems = activeTodos.filter(i =>
        i.heading.priority === 'A' || i.heading.tags?.includes('Important')
    );
    const nextActionItems = activeTodos.filter(i =>
        !importantItems.includes(i) && (i.heading.priority === 'B' || getCategory(i) === 'Next Action')
    );
    const shoppingItems = activeTodos.filter(i =>
        !importantItems.includes(i) && !nextActionItems.includes(i) && getCategory(i) === 'Shopping'
    );
    const inboxItems = activeTodos.filter(i =>
        !importantItems.includes(i) && !nextActionItems.includes(i) && !shoppingItems.includes(i) && getCategory(i) === 'Inbox'
    );
    const otherItems = activeTodos.filter(i =>
        !importantItems.includes(i) && !nextActionItems.includes(i) && !shoppingItems.includes(i) && !inboxItems.includes(i)
    );

    const renderItem = (item: AgendaItem, showFile = true) => (
        <li key={item.heading.title + Math.random()} className="flex items-start group cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => onItemClick(item.file)}>
            {showFile && <span className="text-xs font-mono text-gray-400 mt-1 w-20 flex-shrink-0 truncate mr-2">{getCategory(item)}</span>}
            <div className="flex-1">
                <div className="flex items-center flex-wrap">
                    {item.heading.todoKeyword && (
                        <span className={`text-xs font-bold mr-2 px-1 rounded ${item.heading.todoKeyword === 'TODO' ? 'bg-red-100 text-red-700' :
                            item.heading.todoKeyword === 'NEXT' ? 'bg-blue-100 text-blue-700' :
                                item.heading.todoKeyword === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                            }`}>
                            {item.heading.todoKeyword}
                        </span>
                    )}
                    {item.heading.priority && (
                        <span className="text-yellow-600 font-mono text-sm mr-1 font-bold">[#{item.heading.priority}]</span>
                    )}
                    <span className="text-gray-900 font-medium mr-2">{item.heading.title}</span>
                    {item.heading.tags && item.heading.tags.length > 0 && (
                        <span className="text-xs text-gray-400 mr-2">
                            {item.heading.tags.map(tag => `:${tag}:`).join('')}
                        </span>
                    )}
                </div>
                <div className="flex space-x-4 text-xs text-gray-500 font-mono">
                    {item.heading.scheduled && (
                        <span className="flex items-center text-green-600">
                            <span className="mr-1">SCH:</span>
                            {item.heading.scheduled}
                        </span>
                    )}
                    {item.heading.deadline && (
                        <span className="flex items-center text-red-600">
                            <span className="mr-1">DL:</span>
                            {item.heading.deadline}
                        </span>
                    )}
                </div>
            </div>
        </li>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Agenda</h2>

            {/* 1. NEXT */}
            {nextItems.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-2 text-blue-700 border-b border-blue-200 pb-1">NEXT</h3>
                    <ul className="space-y-1">{nextItems.map(i => renderItem(i))}</ul>
                </div>
            )}

            {/* 2. Agenda (Today) */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 text-gray-700 border-b border-gray-200 pb-1">Today {today.toLocaleDateString()}</h3>
                <div className="space-y-4">
                    {overdueItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-red-600 mb-1">Overdue</h4>
                            <ul className="space-y-1">{overdueItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                    {rescheduleItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-orange-600 mb-1">Reschedule</h4>
                            <ul className="space-y-1">{rescheduleItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                    {todayDueItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-green-600 mb-1">Today</h4>
                            <ul className="space-y-1">{todayDueItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                    {todayItems.length === 0 && <p className="text-sm text-gray-400 italic">No tasks for today.</p>}
                </div>
            </div>

            {/* 3. Upcoming Week */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 text-gray-700 border-b border-gray-200 pb-1">Upcoming Week</h3>
                <div className="space-y-4">
                    {Array.from(upcomingByDay.entries()).map(([dateStr, dayItems]) => (
                        dayItems.length > 0 && (
                            <div key={dateStr}>
                                <h4 className="text-sm font-semibold text-gray-600 mb-1">{new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                                <ul className="space-y-1">{dayItems.map(i => renderItem(i))}</ul>
                            </div>
                        )
                    ))}
                    {upcomingItems.length === 0 && <p className="text-sm text-gray-400 italic">No upcoming tasks.</p>}
                </div>
            </div>

            {/* 4. WAITING */}
            {waitingItems.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-2 text-yellow-700 border-b border-yellow-200 pb-1">WAITING</h3>
                    <ul className="space-y-1">{waitingItems.map(i => renderItem(i))}</ul>
                </div>
            )}

            {/* 5. Tasks */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 text-gray-700 border-b border-gray-200 pb-1">Tasks</h3>
                <div className="space-y-4">
                    {importantItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-purple-600 mb-1">Important</h4>
                            <ul className="space-y-1">{importantItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                    {nextActionItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-blue-600 mb-1">Next Action</h4>
                            <ul className="space-y-1">{nextActionItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                    {shoppingItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-pink-600 mb-1">Shopping</h4>
                            <ul className="space-y-1">{shoppingItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                    {inboxItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-1">Inbox</h4>
                            <ul className="space-y-1">{inboxItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                    {otherItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-1">Others</h4>
                            <ul className="space-y-1">{otherItems.map(i => renderItem(i))}</ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
