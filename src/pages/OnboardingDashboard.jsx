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
    PieChart,
    Pie,
    Legend
} from 'recharts';
import {
    Users,
    Send,
    CheckCircle,
    Clock,
    DollarSign,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { useOnboardingMetrics } from '../hooks/useOnboardingMetrics';
import { Spinner, Badge } from '../components';

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
    const { kpis, funnelData, compensationForecastData, loading } = useOnboardingMetrics();

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Spinner size="lg" message="Calculando métricas da esteira..." />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Onboarding</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Visão executiva da esteira de ativação de clientes</p>
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
            {(kpis.longWaitApportionment > 0 || kpis.longWaitCompensation > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kpis.longWaitApportionment > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-4">
                            <div className="bg-red-500 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-800 dark:text-red-400">Gargalo no Rateio</p>
                                <p className="text-xs text-red-700 dark:text-red-500">{kpis.longWaitApportionment} clientes aguardam rateio há mais de 30 dias.</p>
                            </div>
                        </div>
                    )}
                    {kpis.longWaitCompensation > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex items-center gap-4">
                            <div className="bg-amber-500 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Atraso na Compensação</p>
                                <p className="text-xs text-amber-700 dark:text-amber-500">{kpis.longWaitCompensation} clientes sem faturamento há mais de 60 dias.</p>
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
                        {compensationForecastData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={compensationForecastData}>
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
