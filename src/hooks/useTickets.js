import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '../services/ticketService';
import useStore, { useCurrentBase, useTickets as useTicketsStore } from '../stores/useStore';
import toast from 'react-hot-toast';

/**
 * Hook para gerenciar tickets
 * Integra com Zustand store e Firebase
 */
export const useTickets = (clientId = null) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);

    const currentBase = useCurrentBase();
    const tickets = useTicketsStore();
    const { setTickets, addTicket, updateTicket, removeTicket } = useStore();

    /**
     * Busca tickets (todos ou de um cliente específico)
     */
    const fetchTickets = useCallback(
        async (options = {}) => {
            setLoading(true);
            setError(null);

            try {
                const result = clientId
                    ? await ticketService.getByClient(clientId, options)
                    : await ticketService.getAll(options);

                setTickets(result.tickets);

                // Calcular métricas
                const ticketMetrics = ticketService.getMetrics(result.tickets);
                setMetrics(ticketMetrics);

                // Verificar SLA em background
                if (result.tickets.length > 0) {
                    ticketService.checkSLAEnforcement(result.tickets).catch(console.error);
                }

                return result;
            } catch (err) {
                console.error('Erro ao buscar tickets:', err);
                setError(err.message);
                toast.error('Erro ao carregar tickets');
                return { tickets: [], hasMore: false };
            } finally {
                setLoading(false);
            }
        },
        [clientId, setTickets]
    );

    /**
     * Listener em tempo real
     */
    const listenToTickets = useCallback(() => {
        const handleData = (data) => {
            setTickets(data);
            const ticketMetrics = ticketService.getMetrics(data);
            setMetrics(ticketMetrics);

            // Verificar SLA em background
            if (data.length > 0) {
                ticketService.checkSLAEnforcement(data).catch(console.error);
            }
        };

        const handleError = (err) => {
            console.error('Erro no listener de tickets:', err);
            setError(err.message);
        };

        const unsubscribe = clientId
            ? ticketService.listenToClient(clientId, handleData, handleError)
            : ticketService.listen(handleData, handleError);

        return unsubscribe;
    }, [clientId, setTickets]);

    /**
     * Criar ticket
     */
    const createTicket = async (ticketData) => {
        if (!clientId && !ticketData.clientId) {
            toast.error('Cliente não especificado');
            return { success: false, error: 'Cliente obrigatório' };
        }

        const targetClientId = clientId || ticketData.clientId;

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticTicket = {
            id: tempId,
            clientId: targetClientId,
            protocol: ticketService.generateProtocol(),
            ...ticketData,
            status: 'open',
            createdAt: new Date().toISOString(),
            pending: true,
        };

        addTicket(optimisticTicket);

        try {
            const newTicket = await ticketService.create(targetClientId, ticketData);

            // Substituir ticket temporário pelo real
            updateTicket(tempId, { ...newTicket, pending: false });

            toast.success('Ticket criado com sucesso!');
            return { success: true, data: newTicket };
        } catch (err) {
            console.error('Erro ao criar ticket:', err);

            // Rollback: remover ticket temporário
            removeTicket(tempId);

            toast.error('Erro ao criar ticket');
            return { success: false, error: err.message };
        }
    };

    /**
     * Atualizar ticket
     */
    const updateTicketData = async (ticketId, ticketClientId, updates) => {
        const targetClientId = ticketClientId || clientId;

        if (!targetClientId) {
            toast.error('Cliente não especificado');
            return { success: false, error: 'Cliente obrigatório' };
        }

        // Buscar ticket original para rollback
        const originalTicket = tickets.find((t) => t.id === ticketId);

        // Optimistic update
        updateTicket(ticketId, { ...updates, pending: true });

        try {
            const updated = await ticketService.update(targetClientId, ticketId, updates);

            // Confirmar update
            updateTicket(ticketId, { ...updated, pending: false });

            toast.success('Ticket atualizado com sucesso!');
            return { success: true, data: updated };
        } catch (err) {
            console.error('Erro ao atualizar ticket:', err);

            // Rollback
            if (originalTicket) {
                updateTicket(ticketId, originalTicket);
            }

            toast.error('Erro ao atualizar ticket');
            return { success: false, error: err.message };
        }
    };

    /**
     * Atualizar status do ticket
     */
    const updateStatus = async (ticketId, ticketClientId, newStatus) => {
        return updateTicketData(ticketId, ticketClientId, { status: newStatus });
    };

    /**
     * Deletar ticket
     */
    const deleteTicket = async (ticketId, ticketClientId) => {
        const targetClientId = ticketClientId || clientId;

        if (!targetClientId) {
            toast.error('Cliente não especificado');
            return { success: false, error: 'Cliente obrigatório' };
        }

        // Buscar ticket original para rollback
        const originalTicket = tickets.find((t) => t.id === ticketId);

        // Optimistic update
        removeTicket(ticketId);

        try {
            await ticketService.delete(targetClientId, ticketId);

            toast.success('Ticket removido com sucesso!');
            return { success: true };
        } catch (err) {
            console.error('Erro ao deletar ticket:', err);

            // Rollback
            if (originalTicket) {
                addTicket(originalTicket);
            }

            toast.error('Erro ao remover ticket');
            return { success: false, error: err.message };
        }
    };

    /**
     * Buscar tickets automaticamente quando o componente monta
     */
    useEffect(() => {
        if (currentBase || clientId) {
            fetchTickets();
        }
    }, [currentBase, clientId, fetchTickets]);

    return {
        tickets,
        loading,
        error,
        metrics,
        fetchTickets,
        listenToTickets,
        createTicket,
        updateTicket: updateTicketData,
        updateStatus,
        deleteTicket,
    };
};
