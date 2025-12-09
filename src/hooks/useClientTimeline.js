import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../services/eventService';

/**
 * Hook para gerenciar a timeline unificada do cliente
 * Combina faturas e eventos em uma única timeline ordenada
 */
export const useClientTimeline = (client) => {
    const [timelineItems, setTimelineItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Carrega eventos e mescla com faturas
    const loadTimeline = useCallback(async () => {
        if (!client?.id) {
            setTimelineItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Busca eventos do cliente
            const events = await eventService.getEvents(client.id);

            // Converte eventos para formato de timeline
            const eventItems = events.map((event) => ({
                id: `event-${event.id}`,
                type: 'event',
                eventType: event.type,
                description: event.description,
                metaData: event.metaData,
                createdAt: event.createdAt,
                createdBy: event.createdByEmail,
                date: new Date(event.createdAt),
            }));

            // Converte faturas para formato de timeline
            const invoiceItems = (client.invoices || []).map((invoice, index) => {
                // Determina o tipo de evento baseado no status
                let eventType = 'invoice_open';
                let description = `Fatura de ${formatCurrency(invoice.amount)} - Vencimento: ${formatDate(invoice.dueDate)}`;

                if (invoice.status === 'overdue') {
                    eventType = 'invoice_overdue';
                    description = `⚠️ Fatura VENCIDA de ${formatCurrency(invoice.amount)} - Venceu em: ${formatDate(invoice.dueDate)}`;
                } else if (invoice.status === 'paid') {
                    eventType = 'invoice_paid';
                    description = `✅ Fatura PAGA de ${formatCurrency(invoice.amount)}`;
                }

                return {
                    id: `invoice-${index}`,
                    type: 'invoice',
                    eventType,
                    description,
                    invoice,
                    createdAt: invoice.createdAt || invoice.dueDate,
                    date: new Date(invoice.dueDate || invoice.createdAt || Date.now()),
                };
            });

            // Mescla e ordena por data (mais recente primeiro)
            const merged = [...eventItems, ...invoiceItems].sort(
                (a, b) => b.date.getTime() - a.date.getTime()
            );

            setTimelineItems(merged);
        } catch (err) {
            console.error('Erro ao carregar timeline:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [client]);

    // Carrega timeline quando o cliente muda
    useEffect(() => {
        loadTimeline();
    }, [loadTimeline]);

    // Adiciona novo evento e recarrega timeline
    const addEvent = useCallback(
        async (type, description, metaData = {}) => {
            if (!client?.id) return;

            try {
                await eventService.addEvent(client.id, type, description, metaData);
                // Recarrega timeline para incluir o novo evento
                await loadTimeline();
            } catch (err) {
                console.error('Erro ao adicionar evento:', err);
                throw err;
            }
        },
        [client, loadTimeline]
    );

    return {
        timelineItems,
        loading,
        error,
        addEvent,
        reload: loadTimeline,
    };
};

// Helpers de formatação
const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    } catch {
        return dateStr;
    }
};
