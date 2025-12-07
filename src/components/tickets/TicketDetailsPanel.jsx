import { useState } from 'react';
import { X, Clock, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import { Button, Badge } from '../';
import { ticketService } from '../../services/ticketService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';

const STATUS_OPTIONS = [
    { value: 'open', label: 'Aberto' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'resolved', label: 'Resolvido' },
    { value: 'closed', label: 'Fechado' },
];

export const TicketDetailsPanel = ({ ticket, onUpdate, onClose, className }) => {
    const [updating, setUpdating] = useState(false);

    if (!ticket) return null;

    const statusFormat = ticketService.formatStatus(ticket.status);
    const priorityFormat = ticketService.formatPriority(ticket.priority);
    const isOverdue = ticket.overdue && !['resolved', 'closed'].includes(ticket.status);

    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        try {
            await onUpdate(ticket.id, ticket.clientId, { status: newStatus });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className={cn('card h-full flex flex-col', className)}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {ticket.protocol}
                        </span>
                        {isOverdue && (
                            <Badge variant="danger" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Vencido
                            </Badge>
                        )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {ticket.subject}
                    </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                    </label>
                    <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updating}
                        className="input"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant={statusFormat.variant}>{statusFormat.text}</Badge>
                    <Badge variant={priorityFormat.variant}>{priorityFormat.text}</Badge>
                    {ticket.category && (
                        <Badge variant="default" className="capitalize">
                            {ticket.category}
                        </Badge>
                    )}
                </div>

                {/* Descrição */}
                {ticket.description && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descrição
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {ticket.description}
                        </p>
                    </div>
                )}

                {/* Informações */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    {/* Criado em */}
                    {ticket.createdAt && (
                        <InfoRow
                            icon={Calendar}
                            label="Criado em"
                            value={format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                            })}
                        />
                    )}

                    {/* Criado por */}
                    {ticket.openedByEmail && (
                        <InfoRow icon={User} label="Criado por" value={ticket.openedByEmail} />
                    )}

                    {/* Prazo */}
                    {ticket.dueDate && (
                        <InfoRow
                            icon={Clock}
                            label="Prazo"
                            value={format(new Date(ticket.dueDate), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                            })}
                            highlight={isOverdue}
                        />
                    )}

                    {/* Resolvido em */}
                    {ticket.resolvedAt && (
                        <InfoRow
                            icon={Calendar}
                            label="Resolvido em"
                            value={format(new Date(ticket.resolvedAt), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                            })}
                        />
                    )}

                    {/* Última atualização */}
                    {ticket.updatedAt && (
                        <InfoRow
                            icon={Calendar}
                            label="Atualizado em"
                            value={format(new Date(ticket.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                            })}
                        />
                    )}
                </div>

                {/* SLA Info */}
                {!['resolved', 'closed'].includes(ticket.status) && ticket.dueDate && (
                    <div
                        className={cn(
                            'rounded-lg p-4 text-sm',
                            isOverdue
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                        )}
                    >
                        <p className="font-medium mb-1">
                            {isOverdue ? '⚠️ SLA Vencido' : 'ℹ️ SLA Ativo'}
                        </p>
                        <p>
                            {isOverdue
                                ? 'Este ticket ultrapassou o prazo de resolução.'
                                : 'Este ticket está dentro do prazo de resolução.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Linha de informação
 */
const InfoRow = ({ icon: Icon, label, value, highlight = false }) => {
    return (
        <div className="flex items-start gap-3">
            <Icon
                className={cn(
                    'h-4 w-4 mt-0.5 flex-shrink-0',
                    highlight ? 'text-red-600' : 'text-gray-400'
                )}
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p
                    className={cn(
                        'text-sm font-medium',
                        highlight
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-gray-100'
                    )}
                >
                    {value}
                </p>
            </div>
        </div>
    );
};
