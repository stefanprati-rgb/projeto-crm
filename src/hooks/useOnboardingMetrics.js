import { useMemo, useState, useEffect } from 'react';
import { useClients } from '../stores/useStore';
import { differenceInDays } from 'date-fns';

/**
 * Hook customizado para calcular métricas do Dashboard de Onboarding
 */
export const useOnboardingMetrics = () => {
    const [loading, setLoading] = useState(true);
    const clients = useClients();

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    /**
     * Calcula KPIs de Onboarding
     */
    const kpis = useMemo(() => {
        const counts = {
            waiting_apportionment: 0,
            sent_to_apportionment: 0,
            apportionment_done: 0,
            waiting_compensation: 0,
            invoiced: 0,
            total: 0
        };

        const now = new Date();
        const alerts = {
            longWaitApportionment: 0, // > 30 dias sem rateio
            longWaitCompensation: 0   // > 60 dias sem compensação
        };

        clients.forEach(client => {
            const onboarding = client.onboarding || {};
            const status = onboarding.pipelineStatus || 'waiting_apportionment';

            if (counts.hasOwnProperty(status)) {
                counts[status]++;
                counts.total++;
            }

            // Lógica de Alertas
            const updatedAt = onboarding.updatedAt ? new Date(onboarding.updatedAt) : new Date(client.createdAt);
            const daysInStatus = differenceInDays(now, updatedAt);

            if (status === 'waiting_apportionment' && daysInStatus > 30) {
                alerts.longWaitApportionment++;
            }
            if (status === 'waiting_compensation' && daysInStatus > 60) {
                alerts.longWaitCompensation++;
            }
        });

        return { ...counts, ...alerts };
    }, [clients]);

    /**
     * Dados para o Gráfico de Funil
     */
    const funnelData = useMemo(() => {
        return [
            { name: 'Aguardando Rateio', value: kpis.waiting_apportionment, fill: '#9ca3af' },
            { name: 'Enviado p/ Rateio', value: kpis.sent_to_apportionment, fill: '#3b82f6' },
            { name: 'Rateio Cadastrado', value: kpis.apportionment_done, fill: '#a855f7' },
            { name: 'Aguardando Comp.', value: kpis.waiting_compensation, fill: '#eab308' },
            { name: 'Faturado', value: kpis.invoiced, fill: '#22c55e' },
        ].filter(item => item.value >= 0);
    }, [kpis]);

    /**
     * Previsão de Compensações Mensais
     */
    const compensationForecastData = useMemo(() => {
        const monthlyData = {};
        const now = new Date();

        clients.forEach(client => {
            const forecastDate = client.onboarding?.compensationForecastDate;
            if (forecastDate) {
                const date = new Date(forecastDate);
                // Apenas previsões futuras ou do mês atual
                if (date >= new Date(now.getFullYear(), now.getMonth(), 1)) {
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = { name: monthName, total: 0, date };
                    }
                    monthlyData[monthKey].total++;
                }
            }
        });

        return Object.values(monthlyData)
            .sort((a, b) => a.date - b.date)
            .slice(0, 6); // Próximos 6 meses
    }, [clients]);

    return {
        kpis,
        funnelData,
        compensationForecastData,
        loading
    };
};
