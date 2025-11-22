import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgendaView } from '../ui/AgendaView';
import { GetAgendaUseCase } from '../usecase/GetAgenda';
import type { AgendaItem } from '@orgdrop/domain';
import type { RemoteFileRepository } from '../repository/RemoteFileRepository';

interface AgendaPageProps {
    repository: RemoteFileRepository;
}

export function AgendaPage({ repository }: AgendaPageProps) {
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const getAgenda = useMemo(() => new GetAgendaUseCase(repository), [repository]);

    useEffect(() => {
        const loadAgenda = async () => {
            setIsLoading(true);
            try {
                const items = await getAgenda.execute();
                setAgendaItems(items);
            } catch (e) {
                console.error('Failed to load agenda', e);
                // Handle error (maybe propagate to parent or show toast)
            } finally {
                setIsLoading(false);
            }
        };
        loadAgenda();
    }, [getAgenda]);

    const handleItemClick = (path: string) => {
        // Navigate to file view
        // Path might be relative or absolute, but our router will likely expect encoded path
        // If path is "projects/todo.org", we want "/file/projects%2Ftodo.org"
        navigate(`/file/${encodeURIComponent(path)}`);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full">Loading agenda...</div>;
    }

    return <AgendaView items={agendaItems} onItemClick={handleItemClick} />;
}
