import { useState, useEffect } from 'react';
import {
    X,
    Clock,
    User,
    Calendar,
    Tag,
    AlertCircle,
    UserCheck,
    ChevronDown,
    Sun,
    Zap,
    AlertTriangle,
    Wrench,
    Shield
} from 'lucide-react';
import { Button, Badge } from '../';
import { ticketService } from '../../services/ticketService';
import { TicketTimeline } from './TicketTimeline';
import { EQUIPMENT_TYPES, GENERATION_IMPACT } from './ProjectSelector';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';
import { auth } from '../../services/firebase';

const STATUS_OPTIONS = [
    { value: 'open', label: 'Aberto', color: 'blue' },
    { value: 'in_progress', label: 'Em Andamento', color: 'yellow' },
    { value: 'waiting_client', label: 'Pendente Cliente', color: 'orange' },
    { value: 'waiting_parts', label: 'Aguardando Peças', color: 'orange' },
    { value: 'scheduled', label: 'Visita Agendada', color: 'purple' },
    { value: 'monitoring', label: 'Em Monitoramento', color: 'indigo' },
    { value: 'resolved', label: 'Resolvido', color: 'green' },
    { value: 'closed', label: 'Fechado', color: 'gray' },
];

// Mock de usuários técnicos (substituir por busca real no futuro)
const MOCK_TECHNICIANS = [
    { id: 'tech1', name: 'Carlos Silva', email: 'carlos@empresa.com' },
    { id: 'tech2', name: 'Ana Oliveira', email: 'ana@empresa.com' },
    { id: 'tech3', name: 'João Santos', email: 'joao@empresa.com' },
];

export const TicketDetailsPanel = ({ ticket, onUpdate, onClose, className }) => {
    const [updating, setUpdating] = useState(false);
    const [responsibleDropdownOpen, setResponsibleDropdownOpen] = useState(false);

    if (!ticket) return null;

    const statusFormat = ticketService.formatStatus(ticket.status);
    const priorityFormat = ticketService.formatPriority(ticket.priority);
    const isOverdue = ticket.overdue && !['resolved', 'closed'].includes(ticket.status);

    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        try {
            await ticketService.updateStatus(ticket.clientId, ticket.id, newStatus);
            if (onUpdate) {
                await onUpdate(ticket.id, ticket.clientId, { status: newStatus });
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleResponsibleChange = async (technician) => {
        setResponsibleDropdownOpen(false);
        setUpdating(true);
        try {
            await ticketService.assignResponsible(
                ticket.clientId,
                ticket.id,
                technician.id,
                technician.name
            );
            if (onUpdate) {
                await onUpdate(ticket.id, ticket.clientId, {
                    responsibleId: technician.id,
                    responsibleName: technician.name
                });
            }
        } catch (error) {
            console.error('Erro ao atribuir responsável:', error);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className={cn('card h-full flex flex-col overflow-hidden', className)}>
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                            {ticket.protocol}
                        </span>
                        {isOverdue && (
                            <Badge variant="danger" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Vencido
                            </Badge>
                        )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {ticket.subject}
                    </h2>

                    {/* Badges de Status/Prioridade/Categoria */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={statusFormat.variant}>{statusFormat.text}</Badge>
                        <Badge variant={priorityFormat.variant}>{priorityFormat.text}</Badge>
                        {ticket.category && (
                            <Badge variant="default" className="capitalize">
                                {ticket.category}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0 ml-2">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Grid de 2 colunas */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 min-h-0 overflow-hidden">

                {/* Coluna Esquerda: Detalhes (40%) */}
                <div className="lg:col-span-2 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-4 space-y-4">

                    {/* Seletor de Status */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Status
                        </label>
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updating}
                            className="input text-sm"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Seletor de Responsável */}
                    <div className="relative">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Responsável
                        </label>
                        <button
                            type="button"
                            onClick={() => setResponsibleDropdownOpen(!responsibleDropdownOpen)}
                            disabled={updating}
                            className={cn(
                                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm text-left',
                                'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
                                'hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <UserCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className={cn(
                                    'truncate',
                                    ticket.responsibleName
                                        ? 'text-gray-900 dark:text-gray-100'
                                        : 'text-gray-400'
                                )}>
                                    {ticket.responsibleName || 'Não atribuído'}
                                </span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </button>

                        {/* Dropdown de técnicos */}
                        {responsibleDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                {MOCK_TECHNICIANS.map((tech) => (
                                    <button
                                        key={tech.id}
                                        type="button"
                                        onClick={() => handleResponsibleChange(tech)}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                                            'hover:bg-gray-100 dark:hover:bg-gray-700',
                                            'first:rounded-t-lg last:rounded-b-lg',
                                            ticket.responsibleId === tech.id && 'bg-primary-50 dark:bg-primary-900/20'
                                        )}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400">
                                            {tech.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {tech.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{tech.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Descrição */}
                    {ticket.description && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                Descrição
                            </label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                {ticket.description}
                            </p>
                        </div>
                    )}

                    {/* Card de Dados do Equipamento (GD) */}
                    {(ticket.projectId || ticket.equipmentType || ticket.errorCode || ticket.generationImpact) && (
                        <EquipmentCard ticket={ticket} />
                    )}

                    {/* Informações */}
                    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                        {ticket.createdAt && (
                            <InfoRow
                                icon={Calendar}
                                label="Criado em"
                                value={format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                })}
                            />
                        )}

                        {ticket.openedByEmail && (
                            <InfoRow icon={User} label="Criado por" value={ticket.openedByEmail} />
                        )}

                        {ticket.dueDate && (
                            <InfoRow
                                icon={Clock}
                                label="Prazo SLA"
                                value={format(new Date(ticket.dueDate), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                })}
                                highlight={isOverdue}
                            />
                        )}

                        {ticket.resolvedAt && (
                            <InfoRow
                                icon={Calendar}
                                label="Resolvido em"
                                value={format(new Date(ticket.resolvedAt), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                })}
                            />
                        )}
                    </div>

                    {/* SLA Info Card */}
                    {!['resolved', 'closed'].includes(ticket.status) && ticket.dueDate && (
                        <div
                            className={cn(
                                'rounded-lg p-3 text-sm',
                                isOverdue
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                            )}
                        >
                            <p className="font-medium mb-0.5">
                                {isOverdue ? '⚠️ SLA Vencido' : 'ℹ️ SLA Ativo'}
                            </p>
                            <p className="text-xs opacity-80">
                                {isOverdue
                                    ? 'Este ticket ultrapassou o prazo de resolução.'
                                    : 'Este ticket está dentro do prazo.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Coluna Direita: Timeline (60%) */}
                <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-900">
                    <TicketTimeline
                        ticketId={ticket.id}
                        clientId={ticket.clientId}
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * Linha de informação
 */
const InfoRow = ({ icon: Icon, label, value, highlight = false }) => {
    return (
        <div className="flex items-start gap-2">
            <Icon
                className={cn(
                    'h-4 w-4 mt-0.5 flex-shrink-0',
                    highlight ? 'text-red-500' : 'text-gray-400'
                )}
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p
                    className={cn(
                        'text-sm font-medium truncate',
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

/**
 * Card de Dados do Equipamento (GD - Geração Distribuída)
 */
const EquipmentCard = ({ ticket }) => {
    // Busca labels dos tipos
    const equipmentTypeLabel = EQUIPMENT_TYPES.find(t => t.value === ticket.equipmentType)?.label || ticket.equipmentType;
    const impactInfo = GENERATION_IMPACT.find(i => i.value === ticket.generationImpact);

    return (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10 p-3">
            <div className="flex items-center gap-2 mb-3">
                <Sun className="h-4 w-4 text-yellow-500" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Dados do Equipamento
                </h4>
            </div>

            <div className="space-y-2.5">
                {/* Projeto/Usina */}
                {(ticket.projectId || ticket.projectName) && (
                    <div className="flex items-start gap-2">
                        <Sun className="h-3.5 w-3.5 mt-0.5 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Projeto/Usina</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {ticket.projectName || 'Projeto vinculado'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tipo de Equipamento */}
                {ticket.equipmentType && (
                    <div className="flex items-start gap-2">
                        <Wrench className="h-3.5 w-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Equipamento</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {equipmentTypeLabel}
                                {ticket.equipmentModel && (
                                    <span className="text-gray-500 font-normal"> - {ticket.equipmentModel}</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Código de Erro */}
                {ticket.errorCode && (
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Código de Erro</p>
                            <p className="text-sm font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded inline-block">
                                {ticket.errorCode}
                            </p>
                        </div>
                    </div>
                )}

                {/* Impacto na Geração */}
                {ticket.generationImpact && impactInfo && (
                    <div className="flex items-start gap-2">
                        <Zap className="h-3.5 w-3.5 mt-0.5 text-yellow-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Impacto na Geração</p>
                            <Badge
                                variant={
                                    ticket.generationImpact === 'parada_total' ? 'danger' :
                                        ticket.generationImpact === 'parada_parcial' ? 'warning' :
                                            ticket.generationImpact === 'degradacao' ? 'warning' :
                                                'success'
                                }
                                className="text-xs"
                            >
                                {impactInfo.icon} {impactInfo.label}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Badge de Garantia (placeholder - futuro: calcular baseado na data de instalação) */}
                {ticket.projectId && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                        <Shield className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Verificar status de garantia
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
