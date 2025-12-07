import { useState, useEffect, useCallback } from 'react';
import { clientService } from '../services/clientService';
import useStore, { useCurrentBase, useClients as useClientsStore } from '../stores/useStore';
import toast from 'react-hot-toast';

/**
 * Hook para gerenciar clientes
 * Integra com Zustand store e Firebase
 */
export const useClients = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const currentBase = useCurrentBase();
    const clients = useClientsStore();
    const { setClients, addClient, updateClient, removeClient } = useStore();

    /**
     * Busca clientes com paginação
     */
    const fetchClients = useCallback(
        async (options = {}) => {
            setLoading(true);
            setError(null);

            try {
                const result = await clientService.getAll({
                    baseFilter: currentBase?.id,
                    ...options,
                });

                setClients(result.clients);

                // Calcular métricas
                const clientMetrics = clientService.getMetrics(result.clients);
                setMetrics(clientMetrics);

                return result;
            } catch (err) {
                console.error('Erro ao buscar clientes:', err);
                setError(err.message);
                toast.error('Erro ao carregar clientes');
                return { clients: [], hasMore: false };
            } finally {
                setLoading(false);
            }
        },
        [currentBase, setClients]
    );

    /**
     * Listener em tempo real
     */
    const listenToClients = useCallback(() => {
        const handleData = (data) => {
            setClients(data);
            const clientMetrics = clientService.getMetrics(data);
            setMetrics(clientMetrics);
        };

        const handleError = (err) => {
            console.error('Erro no listener de clientes:', err);
            setError(err.message);
        };

        const unsubscribe = clientService.listen(handleData, handleError, currentBase?.id);

        return unsubscribe;
    }, [currentBase, setClients]);

    /**
     * Criar cliente
     */
    const createClient = async (clientData) => {
        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticClient = {
            id: tempId,
            ...clientData,
            database: currentBase?.id || clientData.database,
            createdAt: new Date().toISOString(),
            pending: true,
        };

        addClient(optimisticClient);

        try {
            const newClient = await clientService.create({
                ...clientData,
                database: currentBase?.id || clientData.database,
            });

            // Substituir cliente temporário pelo real
            updateClient(tempId, { ...newClient, pending: false });

            toast.success('Cliente criado com sucesso!');
            return { success: true, data: newClient };
        } catch (err) {
            console.error('Erro ao criar cliente:', err);

            // Rollback: remover cliente temporário
            removeClient(tempId);

            toast.error('Erro ao criar cliente');
            return { success: false, error: err.message };
        }
    };

    /**
     * Atualizar cliente
     */
    const updateClientData = async (clientId, updates) => {
        // Buscar cliente original para rollback
        const originalClient = clients.find((c) => c.id === clientId);

        // Optimistic update
        updateClient(clientId, { ...updates, pending: true });

        try {
            const updated = await clientService.update(clientId, updates);

            // Confirmar update
            updateClient(clientId, { ...updated, pending: false });

            toast.success('Cliente atualizado com sucesso!');
            return { success: true, data: updated };
        } catch (err) {
            console.error('Erro ao atualizar cliente:', err);

            // Rollback
            if (originalClient) {
                updateClient(clientId, originalClient);
            }

            toast.error('Erro ao atualizar cliente');
            return { success: false, error: err.message };
        }
    };

    /**
     * Deletar cliente
     */
    const deleteClient = async (clientId) => {
        // Buscar cliente original para rollback
        const originalClient = clients.find((c) => c.id === clientId);

        // Optimistic update
        removeClient(clientId);

        try {
            await clientService.delete(clientId);

            toast.success('Cliente removido com sucesso!');
            return { success: true };
        } catch (err) {
            console.error('Erro ao deletar cliente:', err);

            // Rollback
            if (originalClient) {
                addClient(originalClient);
            }

            toast.error('Erro ao remover cliente');
            return { success: false, error: err.message };
        }
    };

    /**
     * Buscar clientes
     */
    const searchClients = async (term) => {
        setSearchTerm(term);

        if (!term) {
            fetchClients();
            return;
        }

        setLoading(true);
        try {
            const results = await clientService.search(term, currentBase?.id);
            setClients(results);
            const clientMetrics = clientService.getMetrics(results);
            setMetrics(clientMetrics);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            toast.error('Erro na busca');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Buscar clientes automaticamente quando o componente monta
     */
    useEffect(() => {
        if (currentBase) {
            fetchClients();
        }
    }, [currentBase, fetchClients]);

    return {
        clients,
        loading,
        error,
        metrics,
        searchTerm,
        fetchClients,
        listenToClients,
        createClient,
        updateClient: updateClientData,
        deleteClient,
        searchClients,
    };
};
