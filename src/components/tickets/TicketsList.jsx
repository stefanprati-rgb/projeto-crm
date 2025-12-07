import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Clock, AlertCircle } from 'lucide-react';
import { Badge } from '../Badge';
import { cn } from '../../utils/cn';
import { ticketService } from '../../services/ticketService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TicketsList = ({ tickets, onSelectTicket, selectedTicketId, className }) => {
    const parentRef = useRef();

    // Virtualização para performance com listas grandes
    const virtualizer = useVirtualizer({
        count: tickets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 5,
    });

    const virtualItems = virtualizer.getVirtualItems();

    if (tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Nenhum ticket encontrado</p>
                <p className="text-sm">Crie um novo ticket para começar</p>
            </div>
        );
    }

    return (
        <div ref={parentRef} className={cn('h-full overflow-auto', className)}>
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const ticket = tickets[virtualItem.index];
                    const statusFormat = ticketService.formatStatus(ticket.status);
                    const priorityFormat = ticketService.formatPriority(ticket.priority);
                    const isSelected = ticket.id === selectedTicketId;
                    const isOverdue = ticket.overdue && !['resolved', 'closed'].includes(ticket.status);

                    return (
                        <div
                            key={ticket.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className="px-2 py-1"
                        >
                            <div
                                onClick={() => onSelectTicket(ticket)}
                                className={cn(
                                    'card cursor-pointer transition-all duration-200 h-full',
                                    isSelected
                                        ? 'ring-2 ring-primary-500 shadow-lg'
                                        : 'hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800',
                                    ticket.pending && 'opacity-60'
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    {/* Conteúdo Principal */}
                                    <div className="flex-1 min-w-0">
                                        {/* Protocolo e Badges */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                {ticket.protocol}
                                            </span>
                                            <Badge variant={statusFormat.variant}>
                                                {statusFormat.text}
                                            </Badge>
                                            <Badge variant={priorityFormat.variant}>
                                                {priorityFormat.text}
                                            </Badge>
                                            {isOverdue && (
                                                <Badge variant="danger" className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Vencido
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Assunto */}
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                                            {ticket.subject}
                                        </h3>

                                        {/* Descrição */}
                                        {ticket.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {ticket.description}
                                            </p>
                                        )}

                                        {/* Metadata */}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>
                                                {ticket.createdAt &&
                                                    formatDistanceToNow(new Date(ticket.createdAt), {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                            </span>
                                            {ticket.category && (
                                                <>
                                                    <span>•</span>
                                                    <span className="capitalize">{ticket.category}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* SLA Indicator */}
                                    {ticket.dueDate && !['resolved', 'closed'].includes(ticket.status) && (
                                        <div className="flex-shrink-0">
                                            <DueDateIndicator dueDate={ticket.dueDate} overdue={ticket.overdue} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Indicador visual de prazo (SLA)
 */
const DueDateIndicator = ({ dueDate, overdue }) => {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursRemaining = Math.floor((due - now) / (1000 * 60 * 60));

    let color = 'text-green-600 bg-green-50 dark:bg-green-900/20';
    let text = `${hoursRemaining}h`;

    if (overdue) {
        color = 'text-red-600 bg-red-50 dark:bg-red-900/20';
        text = 'Vencido';
    } else if (hoursRemaining < 2) {
        color = 'text-red-600 bg-red-50 dark:bg-red-900/20';
    } else if (hoursRemaining < 6) {
        color = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    }

    return (
        <div className={cn('rounded-lg px-2 py-1 text-xs font-medium', color)}>
            <Clock className="h-3 w-3 inline mr-1" />
            {text}
        </div>
    );
};
