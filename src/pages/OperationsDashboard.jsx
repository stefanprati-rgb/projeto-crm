import { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, Factory, TrendingUp, FileText, Users } from 'lucide-react';
import { clientService } from '../services/clientService';
import { plantService } from '../services/plantService';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { OperationsDashboardSkeleton } from '../components/OperationsDashboardSkeleton';
import { EmptyState } from '../components/EmptyState';

/**
 * Dashboard Operacional - Hub de Operação GD
 * Visão consolidada de faturas, inadimplência e performance por usina
 */
export const OperationsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [plants, setPlants] = useState([]);
    const [metrics, setMetrics] = useState({
        totalOpen: 0,
        totalOverdue: 0,
        totalPaid: 0,
        clientsWithInvoices: 0,
        overdueByPlant: {},
        openByPlant: {},
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Carrega clientes e usinas
            const [clientsData, plantsData] = await Promise.all([
                clientService.getAllForDashboard(null, 2000),
                plantService.getAll(),
            ]);

            setClients(clientsData);
            setPlants(plantsData);

            // Calcula métricas
            const calculatedMetrics = calculateMetrics(clientsData);
            setMetrics(calculatedMetrics);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (clientsData) => {
        let totalOpen = 0;
        let totalOverdue = 0;
        let totalPaid = 0;
        let clientsWithInvoices = 0;
        const overdueByPlant = {};
        const openByPlant = {};

        clientsData.forEach((client) => {
            if (client.invoices && client.invoices.length > 0) {
                clientsWithInvoices++;

                client.invoices.forEach((invoice) => {
                    const amount = parseFloat(invoice.amount) || 0;
                    const plantName = client.plantName || 'Sem Usina';

                    if (invoice.status === 'paid') {
                        totalPaid += amount;
                    } else if (invoice.status === 'overdue') {
                        totalOverdue += amount;
                        overdueByPlant[plantName] = (overdueByPlant[plantName] || 0) + amount;
                    } else {
                        totalOpen += amount;
                        openByPlant[plantName] = (openByPlant[plantName] || 0) + amount;
                    }
                });
            }
        });

        return {
            totalOpen,
            totalOverdue,
            totalPaid,
            clientsWithInvoices,
            overdueByPlant,
            openByPlant,
        };
    };

    if (loading) {
        return <OperationsDashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Dashboard Operacional
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Visão consolidada de faturas e inadimplência
                </p>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total em Aberto"
                    value={formatCurrency(metrics.totalOpen)}
                    icon={DollarSign}
                    color="blue"
                />
                <MetricCard
                    title="Total Vencido"
                    value={formatCurrency(metrics.totalOverdue)}
                    icon={AlertTriangle}
                    color="red"
                />
                <MetricCard
                    title="Total Pago"
                    value={formatCurrency(metrics.totalPaid)}
                    icon={TrendingUp}
                    color="green"
                />
                <MetricCard
                    title="Clientes com Faturas"
                    value={metrics.clientsWithInvoices}
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Inadimplência por Usina */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vencidas por Usina */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Inadimplência por Usina
                        </h2>
                    </div>

                    {Object.keys(metrics.overdueByPlant).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(metrics.overdueByPlant)
                                .sort((a, b) => b[1] - a[1])
                                .map(([plantName, amount]) => (
                                    <PlantRow
                                        key={plantName}
                                        plantName={plantName}
                                        amount={amount}
                                        color="red"
                                    />
                                ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={AlertTriangle}
                            title="Nenhuma inadimplência"
                            message="Não há faturas vencidas no momento. Parabéns!"
                        />
                    )}
                </div>

                {/* Em Aberto por Usina */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Em Aberto por Usina
                        </h2>
                    </div>

                    {Object.keys(metrics.openByPlant).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(metrics.openByPlant)
                                .sort((a, b) => b[1] - a[1])
                                .map(([plantName, amount]) => (
                                    <PlantRow
                                        key={plantName}
                                        plantName={plantName}
                                        amount={amount}
                                        color="blue"
                                    />
                                ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={FileText}
                            title="Nenhuma fatura em aberto"
                            message="Não há faturas pendentes de pagamento."
                        />
                    )}
                </div>
            </div>

            {/* Lista de Usinas */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <Factory className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Usinas Cadastradas
                    </h2>
                </div>

                {plants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {plants.map((plant) => (
                            <div
                                key={plant.id}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-2">
                                    <Factory className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {plant.name}
                                    </span>
                                </div>
                                {plant.operator && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Operador: {plant.operator}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Factory}
                        title="Nenhuma usina cadastrada"
                        message="Importe a base de clientes para criar usinas automaticamente."
                    />
                )}
            </div>
        </div>
    );
};

/**
 * Card de Métrica
 */
const MetricCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
                <div className={cn('p-3 rounded-lg', colorClasses[color])}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};

/**
 * Linha de Usina com Valor
 */
const PlantRow = ({ plantName, amount, color = 'blue' }) => {
    const total = amount;
    const maxAmount = 2000; // Para calcular a barra de progresso

    const colorClasses = {
        blue: 'bg-blue-600',
        red: 'bg-red-600',
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {plantName}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(total)}
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className={cn('h-2 rounded-full transition-all', colorClasses[color])}
                    style={{ width: `${Math.min((total / maxAmount) * 100, 100)}%` }}
                />
            </div>
        </div>
    );
};
