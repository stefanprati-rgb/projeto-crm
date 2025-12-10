import { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertCircle, TrendingUp } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { TicketsList } from '../components/tickets/TicketsList';
import { TicketModal } from '../components/tickets/TicketModal';
import { TicketDetailsDrawer } from '../components/tickets/TicketDetailsDrawer';
import { Button, Spinner, Badge } from '../components';

/**
 * Página de Tickets - Layout com lista full-width e Drawer lateral
 * 
 * A lista ocupa toda a largura disponível
 * O detalhe abre como overlay (drawer) de 1280px
 */
export const TicketsPage = () => {
    const {
        tickets,
        loading,
        error,
        metrics,
        createTicket,
        updateTicket,
        listenToTickets,
    } = useTickets();

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Listener em tempo real
    useEffect(() => {
        const unsubscribe = listenToTickets();
        return () => unsubscribe?.();
    }, [listenToTickets]);

    // Filtrar tickets
    const filteredTickets = tickets.filter((ticket) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchLower) ||
            ticket.protocol?.toLowerCase().includes(searchLower) ||
            ticket.description?.toLowerCase().includes(searchLower) ||
            ticket.clientName?.toLowerCase().includes(searchLower);

        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Handler de atualização do ticket
    const handleUpdateTicket = async (ticketId, clientId, updates) => {
        await updateTicket(ticketId, clientId, updates);
        // Atualiza o ticket selecionado se for o mesmo
        if (selectedTicket?.id === ticketId) {
            setSelectedTicket((prev) => ({ ...prev, ...updates }));
        }
    };

    if (loading && tickets.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Central de Atendimento
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Gerencie chamados e suporte técnico de O&M Solar
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Novo Ticket
                </Button>
            </div>

            {/* Métricas */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <MetricCard label="Total" value={metrics.total} />
                    <MetricCard label="Abertos" value={metrics.open} variant="info" />
                    <MetricCard label="Vencidos" value={metrics.overdue} variant="danger" />
                    <MetricCard label="Resolvidos" value={metrics.resolved} variant="success" />
                    <MetricCard
                        label="Tempo Médio"
                        value={`${metrics.avgResolutionHours}h`}
                        variant="default"
                    />
                    <MetricCard
                        label="SLA"
                        value={`${metrics.complianceRate}%`}
                        variant={metrics.complianceRate >= 80 ? 'success' : 'warning'}
                    />
                </div>
            )}

            {/* Barra de Ferramentas */}
            <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {/* Busca */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por assunto, protocolo, cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>

                {/* Filtro de Status */}
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input w-56"
                    >
                        <option value="all">Todos os Status</option>
                        <optgroup label="Básicos">
                            <option value="open">Abertos</option>
                            <option value="in_analysis">Em Análise</option>
                            <option value="waiting_client">Pendente Cliente</option>
                        </optgroup>
                        <optgroup label="Financeiros">
                            <option value="financial_validation">Validação Financeira</option>
                            <option value="pending_agreement">Pendente Acordo</option>
                            <option value="agreed">Acordado</option>
                        </optgroup>
                        <optgroup label="Regulatórios">
                            <option value="waiting_distributor">Aguard. Distribuidora</option>
                            <option value="regulatory_analysis">Análise Regulatória</option>
                        </optgroup>
                        <optgroup label="Encerramento">
                            <option value="monitoring">Em Monitoramento</option>
                            <option value="resolved">Resolvidos</option>
                            <option value="closed">Fechados</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* Erro */}
            {error && (
                <div className="mx-6 mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div className="flex-1">
                            <p className="font-medium text-red-900 dark:text-red-100">
                                Erro ao carregar tickets
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Tickets (Full Width) */}
            <div className="flex-1 overflow-hidden px-6 py-4 bg-gray-50 dark:bg-gray-900">
                <TicketsList
                    tickets={filteredTickets}
                    onSelectTicket={setSelectedTicket}
                    selectedTicketId={selectedTicket?.id}
                    className="h-full"
                />
            </div>

            {/* Modal de Criação */}
            <TicketModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={createTicket}
            />

            {/* Drawer de Detalhes (1280px max) */}
            <TicketDetailsDrawer
                isOpen={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                ticket={selectedTicket}
                onUpdate={handleUpdateTicket}
            />
        </div>
    );
};

/**
 * Card de métrica
 */
const MetricCard = ({ label, value, variant = 'default' }) => {
    const variants = {
        default: 'bg-white dark:bg-gray-800',
        info: 'bg-blue-50 dark:bg-blue-900/20',
        success: 'bg-green-50 dark:bg-green-900/20',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20',
        danger: 'bg-red-50 dark:bg-red-900/20',
    };

    return (
        <div className={`rounded-lg p-3 border border-gray-200 dark:border-gray-700 ${variants[variant]}`}>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
};
