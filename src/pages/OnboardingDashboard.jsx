import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    RefreshCw
} from 'recharts';
import {
    Send,
    CheckCircle,
    Clock,
    DollarSign,
    AlertTriangle,
    TrendingUp,
    RefreshCcw,
    Database
} from 'lucide-react';
import { useOnboardingAggregations } from '../hooks/useOnboardingAggregations';
import { Spinner } from '../components';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
    </div>
);

export const OnboardingDashboard = () => {
    const { kpis, funnelData, forecast, loading, error, refresh, lastSync } = useOnboardingAggregations();

    if (loading && !lastSync) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Spinner size="lg" message="Calculando agregações escaláveis..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Erro ao carregar Dashboard</h2>
                <p className="text-gray-500 mt-2 max-w-md">{error}</p>
                <button
                    onClick={refresh}
                    className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Onboarding</h1>
                        <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            Hardened Aggregations
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Visão executiva escalável da esteira de ativação</p>
                </div>

                <div className="flex items-center gap-4">
                    {lastSync && (
                        <span className="text-xs text-gray-400">
                            Atualizado em: {format(lastSync, "HH:mm:ss", { locale: ptBR })}
                        </span>
                    )}
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${loading ? 'animate-spin' : ''}`}
                        title="Atualizar dados"
                    >
                        <RefreshCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Aguardando Rateio"
                    value={kpis.waiting_apportionment}
                    icon={Clock}
                    color="bg-gray-400"
                />
                <StatCard
                    title="Enviado p/ Rateio"
                    value={kpis.sent_to_apportionment}
                    icon={Send}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Rateio Concluído"
                    value={kpis.apportionment_done}
                    icon={CheckCircle}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Em Compensação"
                    value={kpis.waiting_compensation}
                    icon={TrendingUp}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Faturados"
                    value={kpis.invoiced}
                    icon={DollarSign}
                    color="bg-green-500"
                />
            </div>

            {/* Alertas Operacionais */}
            {(kpis.alerts?.longWaitApportionment > 0 || kpis.alerts?.longWaitCompensation > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kpis.alerts.longWaitApportionment > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-4">
                            <div className="bg-red-500 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-800 dark:text-red-400">Gargalo no Rateio</p>
                                <p className="text-xs text-red-700 dark:text-red-500">{kpis.alerts.longWaitApportionment} clientes aguardam rateio há mais de 30 dias.</p>
                            </div>
                        </div>
                    )}
                    {kpis.alerts.longWaitCompensation > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex items-center gap-4">
                            <div className="bg-amber-500 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Atraso na Compensação</p>
                                <p className="text-xs text-amber-700 dark:text-amber-500">{kpis.alerts.longWaitCompensation} clientes sem faturamento há mais de 60 dias.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funil Onboarding */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Funil de Onboarding</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={funnelData} margin={{ left: 40, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Previsão de Ativação */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Previsão de Ativações (UCs)</h3>
                    <div className="h-[300px]">
                        {forecast.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecast}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                Sem previsões cadastradas para os próximos meses
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
