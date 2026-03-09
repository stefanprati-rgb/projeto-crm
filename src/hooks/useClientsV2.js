import { useState, useCallback } from 'react';
import { clientServiceV2 } from '../services/clientServiceV2';
import { useCurrentBase } from '../stores/useStore';
import toast from 'react-hot-toast';

/**
 * Hook V2 focado na nova estrutura relacional (Clientes + Instalações).
 */
export const useClientsV2 = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [instalacoesPipeline, setInstalacoesPipeline] = useState([]);

    // Opcional: Manter estado local de clientes gerais. Se necessário integrar com Zustand no futuro, adaptar aqui.
    const [clientes, setClientes] = useState([]);
    const currentBase = useCurrentBase();

    /**
     * Busca clientes (Tabela "clientes" - PII/Root object)
     */
    const fetchClientes = useCallback(async (options = {}) => {
        if (!currentBase?.id) return { clientes: [], lastDoc: null };
        setLoading(true);
        setError(null);
        try {
            const result = await clientServiceV2.getClientes({
                baseFilter: currentBase.id,
                ...options
            });
            setClientes(result.clientes);
            return result;
        } catch (err) {
            console.error('Erro ao buscar clientes V2:', err);
            setError(err.message);
            toast.error('Erro ao carregar clientes');
            return { clientes: [], lastDoc: null };
        } finally {
            setLoading(false);
        }
    }, [currentBase]);

    /**
     * Busca as Instalações (UCs) projetadas para o Pipeline do Kanban
     */
    const fetchPipelineInstalacoes = useCallback(async (options = {}) => {
        if (!currentBase?.id) return { instalacoes: [], lastDoc: null };
        setLoading(true);
        setError(null);
        try {
            const result = await clientServiceV2.getPipelineInstalacoes({
                baseFilter: currentBase.id,
                ...options
            });
            setInstalacoesPipeline(result.instalacoes);
            return result;
        } catch (err) {
            console.error('Erro ao buscar pipeline de instalações V2:', err);
            setError(err.message);
            toast.error('Erro ao listar itens do funil');
            return { instalacoes: [], lastDoc: null };
        } finally {
            setLoading(false);
        }
    }, [currentBase]);

    /**
     * Atualiza o objeto onboarding dentro de uma instalação específica
     */
    const updateInstalacaoStatus = async (instalacaoId, updates) => {
        try {
            await clientServiceV2.updateInstalacaoOnboarding(instalacaoId, updates);
            toast.success('Status da instalação atualizado com sucesso!');

            // Opcionalmente atualiza o state local se mantiver cache rigoroso, 
            // mas num Kanban real costuma-se fazer refetch ou update simples:
            setInstalacoesPipeline(prev =>
                prev.map(inst => inst.id === instalacaoId
                    ? { ...inst, onboarding: { ...inst.onboarding, ...updates } }
                    : inst
                )
            );
            return { success: true };
        } catch (err) {
            console.error('Erro ao atualizar status da instalação V2:', err);
            toast.error('Erro ao atualizar instalação');
            return { success: false, error: err.message };
        }
    };

    /**
     * Captura o log de rateios de uma instalação específica.
     */
    const fetchHistoricoRateio = async (instalacaoId) => {
        try {
            const logs = await clientServiceV2.getRateiosByInstalacao(instalacaoId);
            return logs;
        } catch (err) {
            console.error('Erro ao ler rateios da instalação:', err);
            toast.error('Não foi possível carregar o histórico de rateio.');
            return [];
        }
    }

    /**
     * Verifica restrições financeiras
     */
    const checkPendenciasFinanceiras = async (clienteId) => {
        try {
            return await clientServiceV2.hasPendingCobrancas(clienteId);
        } catch (err) {
            console.error('Erro ao verificar cobranças:', err);
            return false; // Em caso de erro, permitir fluxo, ou bloquear (depende da doc, default false)
        }
    };

    /**
     * CRUD de Clientes
     */
    const createCliente = async (data) => {
        try {
            const result = await clientServiceV2.createCliente(data);
            toast.success('Cliente criado com sucesso!');
            await fetchClientes(); // Recarrega
            return result;
        } catch (err) {
            toast.error('Erro ao criar cliente');
            return { success: false, error: err.message };
        }
    };

    const updateCliente = async (id, data) => {
        try {
            const result = await clientServiceV2.updateCliente(id, data);
            toast.success('Cliente atualizado com sucesso!');
            await fetchClientes(); // Recarrega
            return result;
        } catch (err) {
            toast.error('Erro ao atualizar cliente');
            return { success: false, error: err.message };
        }
    };

    const deleteCliente = async (id) => {
        try {
            await clientServiceV2.deleteCliente(id);
            toast.success('Cliente excluído com sucesso!');
            await fetchClientes(); // Recarrega
            return { success: true };
        } catch (err) {
            toast.error('Erro ao excluir cliente');
            return { success: false, error: err.message };
        }
    };

    return {
        clientes,
        instalacoesPipeline,
        loading,
        error,
        fetchClientes,
        fetchPipelineInstalacoes,
        updateInstalacaoStatus,
        fetchHistoricoRateio,
        checkPendenciasFinanceiras,
        createCliente,
        updateCliente,
        deleteCliente
    };
};
