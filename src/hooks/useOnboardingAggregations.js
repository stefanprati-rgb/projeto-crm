import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useCurrentBase } from '../stores/useStore';
import { subDays, startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Hook de Hardening para Dashboard de Onboarding
 * Utiliza agregadores Firestore para escalabilidade infinita (sem limite de 500 registros)
 * Não carrega documentos inteiros para o cliente.
 */
export const useOnboardingAggregations = () => {
    const currentBase = useCurrentBase();
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState(null);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        kpis: {
            waiting_apportionment: 0,
            sent_to_apportionment: 0,
            apportionment_done: 0,
            waiting_compensation: 0,
            invoiced: 0,
            total: 0
        },
        alerts: {
            longWaitApportionment: 0,
            longWaitCompensation: 0
        },
        forecast: [],
        funnelData: []
    });

    const fetchAggregations = useCallback(async () => {
        if (!currentBase) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const clientsRef = collection(db, 'clients');

            // 1. KPIs de Status (Agregadores Natos)
            const statuses = [
                { id: 'waiting_apportionment', label: 'Aguardando Rateio', fill: '#9ca3af' },
                { id: 'sent_to_apportionment', label: 'Enviado p/ Rateio', fill: '#3b82f6' },
                { id: 'apportionment_done', label: 'Rateio Cadastrado', fill: '#a855f7' },
                { id: 'waiting_compensation', label: 'Aguardando Comp.', fill: '#eab308' },
                { id: 'invoiced', label: 'Faturado', fill: '#22c55e' }
            ];

            const kpiPromises = statuses.map(s =>
                getCountFromServer(query(
                    clientsRef,
                    where('database', '==', currentBase),
                    where('onboarding.pipelineStatus', '==', s.id)
                ))
            );

            // 2. Alertas (Agregadores Condicionais)
            const now = new Date();
            const date30d = subDays(now, 30).toISOString();
            const date60d = subDays(now, 60).toISOString();

            const alert30Promise = getCountFromServer(query(
                clientsRef,
                where('database', '==', currentBase),
                where('onboarding.pipelineStatus', '==', 'waiting_apportionment'),
                where('onboarding.updatedAt', '<', date30d)
            ));

            const alert60Promise = getCountFromServer(query(
                clientsRef,
                where('database', '==', currentBase),
                where('onboarding.pipelineStatus', '==', 'waiting_compensation'),
                where('onboarding.updatedAt', '<', date60d)
            ));

            // 3. Forecast de Ativação (6 meses de agregação temporal)
            const forecastPromises = [];
            for (let i = 0; i < 6; i++) {
                const targetMonth = addMonths(now, i);
                const start = startOfMonth(targetMonth).toISOString();
                const end = endOfMonth(targetMonth).toISOString();

                forecastPromises.push(
                    getCountFromServer(query(
                        clientsRef,
                        where('database', '==', currentBase),
                        where('onboarding.compensationForecastDate', '>=', start),
                        where('onboarding.compensationForecastDate', '<=', end)
                    )).then(snapshot => ({
                        name: format(targetMonth, 'MMM/yy', { locale: ptBR }),
                        total: snapshot.data().count,
                        date: targetMonth
                    }))
                );
            }

            // Execução Paralela
            const results = await Promise.all([
                ...kpiPromises,
                alert30Promise,
                alert60Promise,
                ...forecastPromises
            ]);

            // Processamento dos Resultados
            const kpiResults = results.slice(0, statuses.length);
            const alertResults = results.slice(statuses.length, statuses.length + 2);
            const forecastResults = results.slice(statuses.length + 2);

            const newKpis = {};
            let total = 0;
            const funnelData = [];

            statuses.forEach((s, idx) => {
                const count = kpiResults[idx].data().count;
                newKpis[s.id] = count;
                total += count;
                funnelData.push({ name: s.label, value: count, fill: s.fill });
            });

            setData({
                kpis: { ...newKpis, total },
                alerts: {
                    longWaitApportionment: alertResults[0].data().count,
                    longWaitCompensation: alertResults[1].data().count
                },
                forecast: forecastResults,
                funnelData
            });

            setLastSync(new Date());
        } catch (err) {
            console.error('Erro no Onboarding Hardening:', err);
            setError('Falha ao carregar agregações do dashboard.');
        } finally {
            setLoading(false);
        }
    }, [currentBase]);

    useEffect(() => {
        fetchAggregations();
    }, [fetchAggregations]);

    return {
        ...data,
        loading,
        error,
        refresh: fetchAggregations,
        lastSync
    };
};
