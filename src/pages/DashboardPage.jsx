import { useEffect } from 'react';
import { Users, Ticket, TrendingUp, DollarSign } from 'lucide-react';
import { useDashboard } from '../stores/useStore';
import { Spinner } from '../components';

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
    const dashboard = useDashboard();

    useEffect(() => {
        // TODO: Buscar dados do dashboard
        // Exemplo: fetchDashboardStats();
    }, []);

    if (dashboard.loading) {
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
                    value="1,234"
                    icon={Users}
                    trend="+12% este mês"
                    color="primary"
                />
                <StatCard
                    title="Tickets Abertos"
                    value="56"
                    icon={Ticket}
                    trend="+8% esta semana"
                    color="warning"
                />
                <StatCard
                    title="Taxa de Conversão"
                    value="68%"
                    icon={TrendingUp}
                    trend="+5% este mês"
                    color="success"
                />
                <StatCard
                    title="Receita Mensal"
                    value="R$ 45.2K"
                    icon={DollarSign}
                    trend="+18% este mês"
                    color="success"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Vendas por Mês
                    </h2>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Gráfico em desenvolvimento
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Tickets por Status
                    </h2>
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Gráfico em desenvolvimento
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Atividades Recentes
                </h2>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div
                            key={item}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Novo cliente cadastrado
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Há 2 horas
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
