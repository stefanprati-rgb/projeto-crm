import { useMemo, useState, useEffect } from 'react';
import { useClients, useTickets } from '../stores/useStore';

/**
 * Hook customizado para calcular métricas do dashboard
 * Centraliza a lógica de negócios e evita re-renderizações desnecessárias
 */
export const useDashboardMetrics = () => {
    const [loading, setLoading] = useState(true);
    const clients = useClients();
    const tickets = useTickets();

    // Simular loading inicial
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    /**
     * Calcula estatísticas principais do dashboard
     */
    const stats = useMemo(() => {
        // Total de clientes
        const totalClients = clients.length;

        // Clientes ativos (assumindo que clientes com status 'active' são ativos)
        const activeClients = clients.filter(
            (client) => client.status === 'active' || !client.status
        ).length;

        // Receita mensal (soma do campo 'monthlyRevenue' ou 'valor' dos clientes)
        const monthlyRevenue = clients.reduce((acc, client) => {
            const revenue = client.monthlyRevenue || client.valor || 0;
            return acc + (typeof revenue === 'number' ? revenue : parseFloat(revenue) || 0);
        }, 0);

        // Tickets abertos (status: 'open' ou 'pending')
        const openTickets = tickets.filter(
            (ticket) => ticket.status === 'open' || ticket.status === 'pending'
        ).length;

        // Tickets fechados
        const closedTickets = tickets.filter(
            (ticket) => ticket.status === 'closed' || ticket.status === 'resolved'
        ).length;

        // Total de tickets
        const totalTickets = tickets.length;

        // Taxa de conversão (tickets fechados / total de tickets)
        const conversionRate = totalTickets > 0
            ? ((closedTickets / totalTickets) * 100).toFixed(1)
            : 0;

        return {
            totalClients,
            activeClients,
            monthlyRevenue,
            openTickets,
            closedTickets,
            totalTickets,
            conversionRate,
        };
    }, [clients, tickets]);

    /**
     * Prepara dados para gráfico de clientes por mês
     */
    const clientsChartData = useMemo(() => {
        // Agrupar clientes por mês de criação
        const monthlyData = {};

        clients.forEach((client) => {
            if (client.createdAt) {
                const date = new Date(client.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        name: monthName,
                        clientes: 0,
                        date: date,
                    };
                }
                monthlyData[monthKey].clientes += 1;
            }
        });

        // Converter para array e ordenar por data
        return Object.values(monthlyData)
            .sort((a, b) => a.date - b.date)
            .slice(-6) // Últimos 6 meses
            .map(({ name, clientes }) => ({ name, clientes }));
    }, [clients]);

    /**
     * Prepara dados para gráfico de tickets por status
     */
    const ticketsStatusChartData = useMemo(() => {
        const statusCount = {
            open: 0,
            pending: 0,
            'in-progress': 0,
            resolved: 0,
            closed: 0,
        };

        tickets.forEach((ticket) => {
            const status = ticket.status || 'open';
            if (statusCount.hasOwnProperty(status)) {
                statusCount[status] += 1;
            } else {
                statusCount[status] = 1;
            }
        });

        // Mapear para formato do gráfico de pizza
        const statusLabels = {
            open: 'Aberto',
            pending: 'Pendente',
            'in-progress': 'Em Progresso',
            resolved: 'Resolvido',
            closed: 'Fechado',
        };

        return Object.entries(statusCount)
            .filter(([_, count]) => count > 0) // Apenas status com tickets
            .map(([status, count]) => ({
                name: statusLabels[status] || status,
                value: count,
            }));
    }, [tickets]);

    /**
     * Prepara dados para gráfico de receita mensal
     */
    const revenueChartData = useMemo(() => {
        // Agrupar receita por mês
        const monthlyRevenue = {};

        clients.forEach((client) => {
            if (client.createdAt) {
                const date = new Date(client.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

                const revenue = client.monthlyRevenue || client.valor || 0;
                const revenueValue = typeof revenue === 'number' ? revenue : parseFloat(revenue) || 0;

                if (!monthlyRevenue[monthKey]) {
                    monthlyRevenue[monthKey] = {
                        name: monthName,
                        receita: 0,
                        date: date,
                    };
                }
                monthlyRevenue[monthKey].receita += revenueValue;
            }
        });

        // Converter para array e ordenar por data
        return Object.values(monthlyRevenue)
            .sort((a, b) => a.date - b.date)
            .slice(-6) // Últimos 6 meses
            .map(({ name, receita }) => ({
                name,
                receita: parseFloat(receita.toFixed(2))
            }));
    }, [clients]);

    /**
     * Prepara dados para gráfico de tickets por mês
     */
    const ticketsChartData = useMemo(() => {
        // Agrupar tickets por mês de criação
        const monthlyData = {};

        tickets.forEach((ticket) => {
            if (ticket.createdAt) {
                const date = new Date(ticket.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        name: monthName,
                        abertos: 0,
                        fechados: 0,
                        date: date,
                    };
                }

                if (ticket.status === 'closed' || ticket.status === 'resolved') {
                    monthlyData[monthKey].fechados += 1;
                } else {
                    monthlyData[monthKey].abertos += 1;
                }
            }
        });

        // Converter para array e ordenar por data
        return Object.values(monthlyData)
            .sort((a, b) => a.date - b.date)
            .slice(-6) // Últimos 6 meses
            .map(({ name, abertos, fechados }) => ({ name, abertos, fechados }));
    }, [tickets]);

    /**
     * Dados consolidados para todos os gráficos
     */
    const chartData = useMemo(() => ({
        clients: clientsChartData,
        ticketsStatus: ticketsStatusChartData,
        revenue: revenueChartData,
        tickets: ticketsChartData,
    }), [clientsChartData, ticketsStatusChartData, revenueChartData, ticketsChartData]);

    return {
        stats,
        chartData,
        loading,
    };
};
