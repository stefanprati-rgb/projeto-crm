import { useState, useEffect } from 'react';
import { Plus, Search, Filter, TrendingUp, AlertCircle } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { TicketsList } from '../components/tickets/TicketsList';
import { TicketModal } from '../components/tickets/TicketModal';
import { TicketDetailsPanel } from '../components/tickets/TicketDetailsPanel';
import { Button, Spinner, Badge } from '../components';
import { cn } from '../utils/cn';

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
    const [showFilters, setShowFilters] = useState(false);

    // Listener em tempo real
    useEffect(() => {
        const unsubscribe = listenToTickets();
        return () => unsubscribe?.();
    }, [listenToTickets]);

    // Filtrar tickets
    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.protocol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading && tickets.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tickets</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Gerencie todos os tickets de suporte
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Novo Ticket
                </Button>
            </div>

            {/* Métricas */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

            {/* Busca e Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Busca */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por assunto, protocolo ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                {/* Filtro de Status */}
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input w-48"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="open">Abertos</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="resolved">Resolvidos</option>
                        <option value="closed">Fechados</option>
                    </select>

                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        className="hidden sm:flex"
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Erro */}
            {error && (
                <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
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

            {/* Conteúdo Principal */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Lista de Tickets */}
                <div className={cn('flex-1 min-w-0', selectedTicket && 'lg:flex-[2]')}>
                    <TicketsList
                        tickets={filteredTickets}
                        onSelectTicket={setSelectedTicket}
                        selectedTicketId={selectedTicket?.id}
                        className="h-full"
                    />
                </div>

                {/* Painel de Detalhes (Desktop) */}
                {selectedTicket && (
                    <div className="hidden lg:block lg:w-96 xl:w-[28rem]">
                        <TicketDetailsPanel
                            ticket={selectedTicket}
                            onUpdate={updateTicket}
                            onClose={() => setSelectedTicket(null)}
                            className="sticky top-0"
                        />
                    </div>
                )}
            </div>

            {/* Modal de Criação */}
            <TicketModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={createTicket}
            />

            {/* Modal de Detalhes (Mobile) */}
            {selectedTicket && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900">
                    <TicketDetailsPanel
                        ticket={selectedTicket}
                        onUpdate={updateTicket}
                        onClose={() => setSelectedTicket(null)}
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Card de métrica
 */
const MetricCard = ({ label, value, variant = 'default' }) => {
    const variants = {
        default: 'bg-gray-50 dark:bg-gray-800',
        info: 'bg-blue-50 dark:bg-blue-900/20',
        success: 'bg-green-50 dark:bg-green-900/20',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20',
        danger: 'bg-red-50 dark:bg-red-900/20',
    };

    return (
        <div className={cn('rounded-lg p-4', variants[variant])}>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
};
