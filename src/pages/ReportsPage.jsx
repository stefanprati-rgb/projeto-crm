import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { useClients } from '../hooks/useClients';
import { Button, Spinner } from '../components';
import {
    TrendChart,
    BarChartComponent,
    PieChartComponent,
    MultiLineChart,
} from '../components/charts/Charts';
import {
    exportToExcel,
    exportToCSV,
    exportToJSON,
    formatClientsForExport,
    formatTicketsForExport,
} from '../utils/exportUtils';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ReportsPage = () => {
    const { tickets, loading: ticketsLoading, metrics: ticketMetrics } = useTickets();
    const { clients, loading: clientsLoading, metrics: clientMetrics } = useClients();

    const [ticketsTrend, setTicketsTrend] = useState([]);
    const [ticketsByStatus, setTicketsByStatus] = useState([]);
    const [ticketsByPriority, setTicketsByPriority] = useState([]);
    const [clientsByBase, setClientsByBase] = useState([]);

    // Processar dados para gráficos
    useEffect(() => {
        if (tickets.length > 0) {
            // Tendência de tickets nos últimos 7 dias
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i);
                const dateStr = format(date, 'dd/MM');
                const count = tickets.filter((t) => {
                    const createdDate = startOfDay(new Date(t.createdAt));
                    return createdDate.getTime() === startOfDay(date).getTime();
                }).length;

                last7Days.push({ name: dateStr, tickets: count });
            }
            setTicketsTrend(last7Days);

            // Tickets por status
            const statusData = [
                { name: 'Abertos', value: tickets.filter((t) => t.status === 'open').length },
                { name: 'Em Andamento', value: tickets.filter((t) => t.status === 'in_progress').length },
                { name: 'Resolvidos', value: tickets.filter((t) => t.status === 'resolved').length },
                { name: 'Fechados', value: tickets.filter((t) => t.status === 'closed').length },
            ].filter((item) => item.value > 0);
            setTicketsByStatus(statusData);

            // Tickets por prioridade
            const priorityData = [
                { name: 'Alta', value: tickets.filter((t) => t.priority === 'high').length },
                { name: 'Média', value: tickets.filter((t) => t.priority === 'medium').length },
                { name: 'Baixa', value: tickets.filter((t) => t.priority === 'low').length },
            ].filter((item) => item.value > 0);
            setTicketsByPriority(priorityData);
        }
    }, [tickets]);

    useEffect(() => {
        if (clients.length > 0 && clientMetrics) {
            // Clientes por base
            const baseData = Object.entries(clientMetrics.byDatabase).map(([name, value]) => ({
                name,
                value,
            }));
            setClientsByBase(baseData);
        }
    }, [clients, clientMetrics]);

    const handleExportTickets = (format) => {
        const formattedData = formatTicketsForExport(tickets);

        let result;
        switch (format) {
            case 'excel':
                result = exportToExcel(formattedData, `tickets_${format(new Date(), 'yyyy-MM-dd')}`);
                break;
            case 'csv':
                result = exportToCSV(formattedData, `tickets_${format(new Date(), 'yyyy-MM-dd')}`);
                break;
            case 'json':
                result = exportToJSON(tickets, `tickets_${format(new Date(), 'yyyy-MM-dd')}`);
                break;
        }

        if (result.success) {
            toast.success('Relatório exportado com sucesso!');
        } else {
            toast.error('Erro ao exportar relatório');
        }
    };

    const handleExportClients = (format) => {
        const formattedData = formatClientsForExport(clients);

        let result;
        switch (format) {
            case 'excel':
                result = exportToExcel(formattedData, `clientes_${format(new Date(), 'yyyy-MM-dd')}`);
                break;
            case 'csv':
                result = exportToCSV(formattedData, `clientes_${format(new Date(), 'yyyy-MM-dd')}`);
                break;
            case 'json':
                result = exportToJSON(clients, `clientes_${format(new Date(), 'yyyy-MM-dd')}`);
                break;
        }

        if (result.success) {
            toast.success('Relatório exportado com sucesso!');
        } else {
            toast.error('Erro ao exportar relatório');
        }
    };

    if (ticketsLoading || clientsLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                    Visualize e exporte dados do sistema
                </p>
            </div>

            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total de Tickets"
                    value={ticketMetrics?.total || 0}
                    subtitle={`${ticketMetrics?.open || 0} abertos`}
                />
                <SummaryCard
                    title="SLA Compliance"
                    value={`${ticketMetrics?.complianceRate || 0}%`}
                    subtitle={`${ticketMetrics?.overdue || 0} vencidos`}
                />
                <SummaryCard
                    title="Total de Clientes"
                    value={clientMetrics?.total || 0}
                    subtitle={`${clientMetrics?.active || 0} ativos`}
                />
                <SummaryCard
                    title="Tempo Médio"
                    value={`${ticketMetrics?.avgResolutionHours || 0}h`}
                    subtitle="de resolução"
                />
            </div>

            {/* Gráficos de Tickets */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Análise de Tickets
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendChart
                        data={ticketsTrend}
                        dataKey="tickets"
                        xKey="name"
                        title="Tickets Criados (Últimos 7 dias)"
                    />
                    <PieChartComponent
                        data={ticketsByStatus}
                        dataKey="value"
                        nameKey="name"
                        title="Tickets por Status"
                    />
                    <BarChartComponent
                        data={ticketsByPriority}
                        dataKey="value"
                        xKey="name"
                        title="Tickets por Prioridade"
                    />
                    {clientsByBase.length > 0 && (
                        <PieChartComponent
                            data={clientsByBase}
                            dataKey="value"
                            nameKey="name"
                            title="Clientes por Base"
                        />
                    )}
                </div>
            </div>

            {/* Exportação de Dados */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Exportar Dados
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Exportar Tickets */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Exportar Tickets
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Exporte todos os tickets em diferentes formatos
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => handleExportTickets('excel')}
                                className="flex-1 sm:flex-none"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleExportTickets('csv')}
                                className="flex-1 sm:flex-none"
                            >
                                <FileText className="h-4 w-4" />
                                CSV
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleExportTickets('json')}
                                className="flex-1 sm:flex-none"
                            >
                                <FileJson className="h-4 w-4" />
                                JSON
                            </Button>
                        </div>
                    </div>

                    {/* Exportar Clientes */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Exportar Clientes
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Exporte todos os clientes em diferentes formatos
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => handleExportClients('excel')}
                                className="flex-1 sm:flex-none"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleExportClients('csv')}
                                className="flex-1 sm:flex-none"
                            >
                                <FileText className="h-4 w-4" />
                                CSV
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleExportClients('json')}
                                className="flex-1 sm:flex-none"
                            >
                                <FileJson className="h-4 w-4" />
                                JSON
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Card de resumo
 */
const SummaryCard = ({ title, value, subtitle }) => {
    return (
        <div className="card">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
        </div>
    );
};
