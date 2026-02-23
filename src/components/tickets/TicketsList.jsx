import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Clock, AlertCircle, User, Building2 } from 'lucide-react';
import { Badge } from '../Badge';
import { cn } from '../../utils/cn';
import { ticketService } from '../../services/ticketService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Lista virtualizada de tickets com cards enriquecidos
 * Mostra cliente, responsável, badges e tempo
 */
export const TicketsList = ({ tickets, onSelectTicket, selectedTicketId, className }) => {
    const parentRef = useRef();

    const virtualizer = useVirtualizer({
        count: tickets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140, // Aumentado para acomodar novos campos
        overscan: 5,
    });

    if (tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum ticket encontrado</p>
                <p className="text-sm">Ajuste os filtros ou crie um novo ticket.</p>
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
                {virtualizer.getVirtualItems().map((virtualItem) => {
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
                                    'cursor-pointer transition-all duration-200 p-4 rounded-lg border bg-white dark:bg-gray-800',
                                    'hover:shadow-md',
                                    isSelected
                                        ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                                )}
                            >
                                <div className="flex flex-col gap-2">
                                    {/* Linha 1: Cliente e Protocolo */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Building2 className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
                                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 truncate uppercase tracking-wide">
                                                {ticket.clientName || 'Cliente Desconhecido'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                            {ticket.protocol}
                                        </span>
                                    </div>

                                    {/* Linha 2: Assunto */}
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                        {ticket.subject}
                                    </h3>

                                    {/* Linha 3: Badges e Categoria */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={statusFormat.variant} className="text-[10px] px-1.5 py-0">
                                            {statusFormat.text}
                                        </Badge>
                                        <Badge variant={priorityFormat.variant} className="text-[10px] px-1.5 py-0">
                                            {priorityFormat.text}
                                        </Badge>
                                        {ticket.category && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                • {ticket.category}
                                            </span>
                                        )}
                                        {ticket.category === 'inadimplencia' && (
                                            <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                                                🔴 Inadimplência
                                            </Badge>
                                        )}
                                        {ticket.disputedValue && ticket.disputedValue > 0 && (
                                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                                                💰 R$ {ticket.disputedValue.toLocaleString('pt-BR')}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Linha 4: Rodapé (Responsável e Tempo/SLA) */}
                                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        {/* Responsável */}
                                        <div className="flex items-center gap-1.5">
                                            {ticket.responsibleName ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                                        {ticket.responsibleName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                                        {ticket.responsibleName.split(' ')[0]}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                        <User className="h-3 w-3 text-gray-400" />
                                                    </div>
                                                    <span className="text-xs text-gray-400 italic">
                                                        Não atribuído
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Tempo / SLA */}
                                        <div className="flex items-center gap-2">
                                            {isOverdue ? (
                                                <Badge variant="danger" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    SLA Vencido
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {ticket.createdAt && formatDistanceToNow(new Date(ticket.createdAt), {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
