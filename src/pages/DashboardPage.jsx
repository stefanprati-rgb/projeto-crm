import { useEffect } from 'react';
import { Users, Ticket, TrendingUp, DollarSign } from 'lucide-react';
import useStore from '../stores/useStore';
import { Spinner } from '../components';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { TrendChart, PieChartComponent, MultiLineChart, BarChartComponent } from '../components/charts/Charts';
import { useClients } from '../hooks/useClients';
import { useTickets } from '../hooks/useTickets';

const StatCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
    const colorClasses = {
        primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600',
        success: 'bg-green-50 dark:bg-green-900/20 text-green-600',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
        danger: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {value}
                    </p>
                    {trend && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`rounded-full p-3 ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};

export const DashboardPage = () => {
    const { stats, chartData, loading } = useDashboardMetrics();
    const { setDashboardStats, setDashboardLoading } = useStore();
    const { listenToClients } = useClients();
    const { listenToTickets } = useTickets();

    // ✅ SOLUÇÃO P0-3: Listener em tempo real para clientes
    useEffect(() => {
        const unsubscribe = listenToClients();
        return () => unsubscribe?.();
    }, [listenToClients]);

    // ✅ SOLUÇÃO P0-3: Listener em tempo real para tickets
    useEffect(() => {
        const unsubscribe = listenToTickets();
        return () => unsubscribe?.();
    }, [listenToTickets]);

    // Sincronizar métricas com a store
    useEffect(() => {
        if (stats) {
            setDashboardStats(stats);
        }
    }, [stats, setDashboardStats]);

    // Sincronizar loading state
    useEffect(() => {
        setDashboardLoading(loading);
    }, [loading, setDashboardLoading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }

    // Formatar valores para exibição
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Dashboard
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Visão geral do seu negócio
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Clientes"
                    value={formatNumber(stats.totalClients)}
                    icon={Users}
                    color="primary"
                />
                <StatCard
                    title="Clientes Ativos"
                    value={formatNumber(stats.activeClients)}
                    icon={Users}
                    color="success"
                />
                <StatCard
                    title="Tickets Abertos"
                    value={formatNumber(stats.openTickets)}
                    icon={Ticket}
                    color="warning"
                />
                <StatCard
                    title="Receita Mensal"
                    value={formatCurrency(stats.monthlyRevenue)}
                    icon={DollarSign}
                    color="success"
                />
            </div>

            {/* Charts Section - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrendChart
                    data={chartData.clients}
                    dataKey="clientes"
                    xKey="name"
                    title="Clientes por Mês"
                />
                <PieChartComponent
                    data={chartData.ticketsStatus}
                    dataKey="value"
                    nameKey="name"
                    title="Tickets por Status"
                />
            </div>

            {/* Charts Section - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartComponent
                    data={chartData.revenue}
                    dataKey="receita"
                    xKey="name"
                    title="Receita por Mês"
                />
                <MultiLineChart
                    data={chartData.tickets}
                    lines={[
                        { dataKey: 'abertos', name: 'Abertos' },
                        { dataKey: 'fechados', name: 'Fechados' },
                    ]}
                    xKey="name"
                    title="Tickets por Mês"
                />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Total de Tickets
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatNumber(stats.totalTickets)}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Tickets Fechados
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatNumber(stats.closedTickets)}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Taxa de Conversão
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stats.conversionRate}%
                    </p>
                </div>
            </div>
        </div>
    );
};
