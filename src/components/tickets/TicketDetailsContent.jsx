import { useState } from 'react';
import {
    Clock,
    User,
    Calendar,
    AlertCircle,
    UserCheck,
    ChevronDown,
    Zap,
    Shield,
    DollarSign,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { Button, Badge } from '../';
import { ticketService } from '../../services/ticketService';
import { TicketTimeline } from './TicketTimeline';
import { ActionChecklist } from './ActionChecklist';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

// ========================================
// CONSTANTES
// ========================================
// STATUS ALINHADOS COM GERAÇÃO DISTRIBUÍDA (GD)
// ========================================

const STATUS_OPTIONS = [
    // Status básicos
    { value: 'open', label: 'Aberto', color: 'blue', group: 'básico' },
    { value: 'in_analysis', label: 'Em Análise', color: 'yellow', group: 'básico' },
    { value: 'waiting_client', label: 'Pendente Cliente', color: 'orange', group: 'básico' },

    // Status financeiros (específicos GD)
    { value: 'financial_validation', label: 'Validação Financeira', color: 'amber', group: 'financeiro' },
    { value: 'pending_agreement', label: 'Pendente Acordo', color: 'orange', group: 'financeiro' },
    { value: 'agreed', label: 'Acordado', color: 'indigo', group: 'financeiro' },

    // Status regulatórios (específicos GD)
    { value: 'waiting_distributor', label: 'Aguard. Distribuidora', color: 'purple', group: 'regulatório' },
    { value: 'regulatory_analysis', label: 'Análise Regulatória', color: 'violet', group: 'regulatório' },

    // Status de monitoramento e encerramento
    { value: 'monitoring', label: 'Em Monitoramento', color: 'cyan', group: 'final' },
    { value: 'resolved', label: 'Resolvido', color: 'green', group: 'final' },
    { value: 'closed', label: 'Fechado', color: 'gray', group: 'final' },
];

// ========================================
// MÁQUINA DE ESTADOS - FLUXOS DE GD
// ========================================

const ALLOWED_TRANSITIONS = {
    // Aberto -> pode ir para análise, aguardar cliente ou fechar direto
    'open': ['in_analysis', 'waiting_client', 'financial_validation', 'closed'],

    // Em análise -> pode ir para qualquer status de trabalho
    'in_analysis': ['waiting_client', 'financial_validation', 'waiting_distributor', 'regulatory_analysis', 'monitoring', 'resolved'],

    // Pendente cliente -> volta para análise ou resolve
    'waiting_client': ['in_analysis', 'financial_validation', 'resolved', 'closed'],

    // Validação financeira -> pode ir para acordo ou resolver
    'financial_validation': ['in_analysis', 'pending_agreement', 'agreed', 'resolved'],

    // Pendente acordo -> aguarda assinatura
    'pending_agreement': ['agreed', 'in_analysis', 'closed'],

    // Acordado -> somente resolve ou reabre (importantíssimo para GD)
    'agreed': ['resolved', 'in_analysis'],

    // Aguardando distribuidora -> análise regulatória ou resolve
    'waiting_distributor': ['in_analysis', 'regulatory_analysis', 'resolved'],

    // Análise regulatória -> resolve ou volta para análise
    'regulatory_analysis': ['in_analysis', 'waiting_distributor', 'resolved'],

    // Monitoramento -> resolve ou volta para análise
    'monitoring': ['in_analysis', 'resolved'],

    // Resolvido -> pode fechar ou reabrir
    'resolved': ['closed', 'in_analysis'],

    // Fechado -> somente reabertura administrativa
    'closed': ['in_analysis'],

    // Legado (tickets antigos)
    'in_progress': ['in_analysis', 'waiting_client', 'resolved'],
    'waiting_parts': ['in_analysis', 'resolved'],
    'scheduled': ['in_analysis', 'resolved'],
};

// Mock de técnicos (substituir por busca real no futuro)
const MOCK_TECHNICIANS = [
    { id: 'tech1', name: 'Carlos Silva', email: 'carlos@empresa.com' },
    { id: 'tech2', name: 'Ana Oliveira', email: 'ana@empresa.com' },
    { id: 'tech3', name: 'João Santos', email: 'joao@empresa.com' },
];

/**
 * Conteúdo principal do Ticket em layout de 3 colunas
 * Coluna 1 (25%): Status, Prioridade, Responsável, Datas
 * Coluna 2 (45%): Descrição, Dados do Equipamento
 * Coluna 3 (30%): Timeline e Comentários
 */
export const TicketDetailsContent = ({ ticket, onUpdate }) => {
    const [updating, setUpdating] = useState(false);
    const [responsibleDropdownOpen, setResponsibleDropdownOpen] = useState(false);

    const statusFormat = ticketService.formatStatus(ticket.status);
    const priorityFormat = ticketService.formatPriority(ticket.priority);
    const isOverdue = ticket.overdue && !['resolved', 'closed'].includes(ticket.status);
    const isFinancialVisible = ['resolved', 'closed'].includes(ticket.status);

    // Verifica se transição é permitida
    const isTransitionAllowed = (newStatus) => {
        const allowed = ALLOWED_TRANSITIONS[ticket.status] || [];
        return allowed.includes(newStatus) || newStatus === ticket.status;
    };

    const handleStatusChange = async (newStatus) => {
        if (!isTransitionAllowed(newStatus)) {
            toast.error(`Transição de "${statusFormat.text}" para "${ticketService.formatStatus(newStatus).text}" não é permitida`);
            return;
        }

        setUpdating(true);
        try {
            await ticketService.updateStatus(ticket.clientId, ticket.id, newStatus);
            if (onUpdate) {
                await onUpdate(ticket.id, ticket.clientId, { status: newStatus });
            }
            toast.success('Status atualizado!');
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            toast.error('Erro ao atualizar status');
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
            toast.success('Responsável atribuído!');
        } catch (error) {
            console.error('Erro ao atribuir responsável:', error);
            toast.error('Erro ao atribuir responsável');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="h-full grid grid-cols-12 divide-x divide-gray-200 dark:divide-gray-700">

            {/* ========================================
                COLUNA 1: Status, Prioridade, Datas (25%)
                ======================================== */}
            <div className="col-span-3 overflow-y-auto p-5 space-y-5 bg-gray-50/50 dark:bg-gray-800/30">

                {/* Badges de Status */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Informações
                    </h4>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant={statusFormat.variant} className="text-sm">
                            {statusFormat.text}
                        </Badge>
                        <Badge variant={priorityFormat.variant} className="text-sm">
                            {priorityFormat.text}
                        </Badge>
                        {isOverdue && (
                            <Badge variant="danger" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Vencido
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Seletor de Status */}
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Alterar Status
                    </label>
                    <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updating || ticket.status === 'closed'}
                        className="input text-sm"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={!isTransitionAllowed(option.value)}
                            >
                                {option.label}
                                {!isTransitionAllowed(option.value) && option.value !== ticket.status ? ' (bloqueado)' : ''}
                            </option>
                        ))}
                    </select>
                    {ticket.status === 'closed' && (
                        <p className="text-xs text-gray-400">Ticket fechado não pode ser alterado</p>
                    )}
                </div>

                {/* Seletor de Responsável */}
                <div className="space-y-2 relative">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
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

                    {responsibleDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {MOCK_TECHNICIANS.map((tech) => (
                                <button
                                    key={tech.id}
                                    type="button"
                                    onClick={() => handleResponsibleChange(tech)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                                        'hover:bg-gray-100 dark:hover:bg-gray-700',
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

                {/* Datas e Informações */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Datas
                    </h4>

                    {ticket.createdAt && (
                        <InfoRow
                            icon={Calendar}
                            label="Criado em"
                            value={format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        />
                    )}

                    {ticket.openedByEmail && (
                        <InfoRow icon={User} label="Criado por" value={ticket.openedByEmail} />
                    )}

                    {ticket.dueDate && (
                        <InfoRow
                            icon={Clock}
                            label="Prazo SLA"
                            value={format(new Date(ticket.dueDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            highlight={isOverdue}
                        />
                    )}

                    {ticket.resolvedAt && (
                        <InfoRow
                            icon={CheckCircle2}
                            label="Resolvido em"
                            value={format(new Date(ticket.resolvedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            variant="success"
                        />
                    )}
                </div>

                {/* SLA Card */}
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
                            {isOverdue ? '⚠️ SLA Vencido' : '✓ SLA Ativo'}
                        </p>
                        <p className="text-xs opacity-80">
                            {isOverdue
                                ? 'Prazo ultrapassado!'
                                : 'Dentro do prazo.'}
                        </p>
                    </div>
                )}

                {/* Seção Financeira (visível apenas para resolved/closed) */}
                {isFinancialVisible && (
                    <FinancialSection ticket={ticket} onUpdate={onUpdate} />
                )}
            </div>

            {/* ========================================
                COLUNA 2: Descrição e Equipamento (45%)
                ======================================== */}
            <div className="col-span-5 overflow-y-auto p-5 space-y-5">

                {/* Descrição Completa */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Descrição do Chamado
                        </h4>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {ticket.description || 'Sem descrição adicional.'}
                        </p>
                    </div>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Categoria
                    </h4>
                    <Badge variant="default" className="capitalize text-sm">
                        {ticket.category || 'Outros'}
                    </Badge>
                </div>

                {/* Dados GD - UC/Faturamento */}
                {(ticket.ucNumber || ticket.referencePeriod || ticket.invoiceReference || ticket.disputedValue || ticket.distributorProtocol || ticket.distributor) && (
                    <GDDataSection ticket={ticket} />
                )}

                {/* Checklist de Ações (para tickets de GD) */}
                {['faturamento', 'compensacao', 'creditos', 'acordo', 'regulatorio', 'distribuidora', 'contratual', 'inadimplencia', 'cadastro', 'suporte'].includes(ticket.category) && (
                    <ActionChecklist ticket={ticket} onUpdate={onUpdate} />
                )}
            </div>

            {/* ========================================
                COLUNA 3: Timeline (30%)
                ======================================== */}
            <div className="col-span-4 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
                <TicketTimeline
                    ticketId={ticket.id}
                    clientId={ticket.clientId}
                    className="h-full"
                />
            </div>
        </div>
    );
};

// ========================================
// SUB-COMPONENTES
// ========================================

/**
 * Linha de informação
 */
const InfoRow = ({ icon: Icon, label, value, highlight = false, variant = 'default' }) => {
    return (
        <div className="flex items-start gap-2">
            <Icon
                className={cn(
                    'h-4 w-4 mt-0.5 flex-shrink-0',
                    highlight ? 'text-red-500' :
                        variant === 'success' ? 'text-green-500' : 'text-gray-400'
                )}
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p
                    className={cn(
                        'text-sm font-medium',
                        highlight ? 'text-red-600 dark:text-red-400' :
                            variant === 'success' ? 'text-green-600 dark:text-green-400' :
                                'text-gray-900 dark:text-gray-100'
                    )}
                >
                    {value}
                </p>
            </div>
        </div>
    );
};

/**
 * Seção de Dados GD - Unidade Consumidora e Faturamento
 */
const GDDataSection = ({ ticket }) => {
    // Mapeia tipo de compensação para label legível
    const COMPENSATION_TYPES = {
        'net_metering': 'Net Metering (Compensação)',
        'gross_metering': 'Gross Metering (Injeção Total)',
        'autoconsumo': 'Autoconsumo Remoto',
        'geracao_compartilhada': 'Geração Compartilhada',
        'consorcio': 'Consórcio/Cooperativa',
    };

    // Mapeia status do acordo para label e cor
    const AGREEMENT_STATUS = {
        'proposta_enviada': { label: 'Proposta Enviada', variant: 'info' },
        'em_negociacao': { label: 'Em Negociação', variant: 'warning' },
        'aguardando_assinatura': { label: 'Aguardando Assinatura', variant: 'warning' },
        'assinado': { label: 'Assinado', variant: 'success' },
        'parcelado': { label: 'Parcelado', variant: 'info' },
        'recusado': { label: 'Recusado', variant: 'danger' },
    };

    // Mapeia código da distribuidora para nome legível
    const DISTRIBUIDORAS = {
        'cemig': 'CEMIG',
        'cpfl_paulista': 'CPFL Paulista',
        'cpfl_piratininga': 'CPFL Piratininga',
        'enel_sp': 'Enel São Paulo',
        'elektro': 'Elektro',
        'light': 'Light',
        'enel_rj': 'Enel Rio',
        'energisa_mg': 'Energisa MG',
        'escelsa': 'EDP ES',
        'copel': 'COPEL',
        'celesc': 'CELESC',
        'rge': 'RGE',
        'ceee': 'CEEE',
        'coelba': 'Coelba',
        'celpe': 'Celpe',
        'cosern': 'Cosern',
        'energisa_pb': 'Energisa PB',
        'enel_ce': 'Enel Ceará',
        'equatorial_ma': 'Equatorial MA',
        'equatorial_pi': 'Equatorial PI',
        'equatorial_al': 'Equatorial AL',
        'energisa_se': 'Energisa SE',
        'enel_go': 'Enel Goiás',
        'energisa_mt': 'Energisa MT',
        'energisa_ms': 'Energisa MS',
        'ceb': 'CEB',
        'equatorial_pa': 'Equatorial PA',
        'equatorial_am': 'Equatorial AM',
        'energisa_to': 'Energisa TO',
        'energisa_ro': 'Energisa RO',
        'energisa_ac': 'Energisa AC',
        'roraima_energia': 'Roraima Energia',
        'cea': 'CEA',
        'outra': 'Outra',
    };

    const agreementInfo = ticket.agreementStatus ? AGREEMENT_STATUS[ticket.agreementStatus] : null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary-500" />
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dados de GD / Faturamento
                </h4>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-4">

                {/* Grid de dados principais */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Número da UC */}
                    {ticket.ucNumber && (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Nº da UC</p>
                            <p className="text-sm font-mono font-bold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-primary-200 dark:border-primary-800 inline-block">
                                {ticket.ucNumber}
                            </p>
                        </div>
                    )}

                    {/* Período de Referência */}
                    {ticket.referencePeriod && (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Período</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                📅 {ticket.referencePeriod}
                            </p>
                        </div>
                    )}
                </div>

                {/* Referência da Fatura */}
                {ticket.invoiceReference && (
                    <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Referência da Fatura</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ticket.invoiceReference}
                            </p>
                        </div>
                    </div>
                )}

                {/* Valor em Discussão */}
                {ticket.disputedValue && ticket.disputedValue > 0 && (
                    <div className="flex items-start gap-3">
                        <DollarSign className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Valor em Discussão</p>
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                R$ {ticket.disputedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tipo de Compensação */}
                {ticket.compensationType && (
                    <div className="flex items-start gap-3">
                        <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Tipo de Compensação</p>
                            <Badge variant="info" className="text-sm mt-1">
                                ⚡ {COMPENSATION_TYPES[ticket.compensationType] || ticket.compensationType}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Distribuidora */}
                {ticket.distributor && (
                    <div className="flex items-start gap-3">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Distribuidora</p>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                🏢 {DISTRIBUIDORAS[ticket.distributor] || ticket.distributor.toUpperCase()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Protocolo da Distribuidora */}
                {ticket.distributorProtocol && (
                    <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-purple-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Protocolo Distribuidora</p>
                            <p className="text-sm font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded inline-block">
                                🔌 {ticket.distributorProtocol}
                            </p>
                        </div>
                    </div>
                )}

                {/* Referência Regulatória */}
                {ticket.regulatoryReference && (
                    <div className="flex items-start gap-3">
                        <Shield className="h-4 w-4 text-indigo-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Referência ANEEL</p>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                ⚖️ {ticket.regulatoryReference}
                            </p>
                        </div>
                    </div>
                )}

                {/* Status do Acordo */}
                {ticket.agreementStatus && agreementInfo && (
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Status do Acordo</p>
                            <Badge
                                variant={agreementInfo.variant}
                                className="text-sm mt-1"
                            >
                                📝 {agreementInfo.label}
                            </Badge>
                            {ticket.agreementDueDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Vencimento: {new Date(ticket.agreementDueDate).toLocaleDateString('pt-BR')}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Seção Financeira (visível apenas para resolved/closed)
 */
const FinancialSection = ({ ticket, onUpdate }) => {
    const [costParts, setCostParts] = useState(ticket.costParts || 0);
    const [costService, setCostService] = useState(ticket.costService || 0);
    const [isBillable, setIsBillable] = useState(ticket.isBillable || false);
    const [saving, setSaving] = useState(false);

    const handleSaveFinancial = async () => {
        setSaving(true);
        try {
            await ticketService.update(ticket.clientId, ticket.id, {
                costParts,
                costService,
                isBillable,
            });

            // Adiciona na timeline
            const user = require('../../services/firebase').auth.currentUser;
            await ticketService.addTimelineItem(ticket.clientId, ticket.id, {
                type: 'financial_update',
                message: `Dados financeiros atualizados: Peças R$${costParts}, Serviço R$${costService}, Faturável: ${isBillable ? 'Sim' : 'Não'}`,
                authorId: user?.uid,
                authorName: user?.email || 'Sistema',
            });

            toast.success('Dados financeiros salvos!');
        } catch (error) {
            console.error('Erro ao salvar dados financeiros:', error);
            toast.error('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Financeiro
                </h4>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Custo de Peças (R$)</label>
                    <input
                        type="number"
                        value={costParts}
                        onChange={(e) => setCostParts(parseFloat(e.target.value) || 0)}
                        className="input text-sm"
                        min="0"
                        step="0.01"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">Valor do Serviço (R$)</label>
                    <input
                        type="number"
                        value={costService}
                        onChange={(e) => setCostService(parseFloat(e.target.value) || 0)}
                        className="input text-sm"
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isBillable"
                        checked={isBillable}
                        onChange={(e) => setIsBillable(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <label htmlFor="isBillable" className="text-sm text-gray-700 dark:text-gray-300">
                        Faturável
                    </label>
                </div>

                <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2">
                        Total: <span className="font-bold text-gray-900 dark:text-gray-100">
                            R$ {(costParts + costService).toFixed(2)}
                        </span>
                    </p>
                    <Button
                        size="sm"
                        onClick={handleSaveFinancial}
                        disabled={saving}
                        className="w-full"
                    >
                        {saving ? 'Salvando...' : 'Salvar Dados Financeiros'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
