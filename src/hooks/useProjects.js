import { useState, useEffect } from 'react';
import { projectManagementService } from '../services/projectManagementService';
import useStore from '../stores/useStore';
import toast from 'react-hot-toast';

/**
 * Hook para gerenciar projetos
 */
export const useProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { currentBase, setCurrentBase } = useStore();

    /**
     * Carrega todos os projetos
     */
    const fetchProjects = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await projectManagementService.getAll();
            setProjects(data);

            // Se não há projeto selecionado, seleciona o primeiro ativo
            if (!currentBase && data.length > 0) {
                const firstActive = data.find((p) => p.active) || data[0];
                setCurrentBase(firstActive);
            }

            return data;
        } catch (err) {
            console.error('Erro ao buscar projetos:', err);
            setError(err.message);
            toast.error('Erro ao carregar projetos');
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Listener em tempo real
     */
    const listenToProjects = () => {
        const handleData = (data) => {
            setProjects(data);

            // Se não há projeto selecionado, seleciona o primeiro ativo
            if (!currentBase && data.length > 0) {
                const firstActive = data.find((p) => p.active) || data[0];
                setCurrentBase(firstActive);
            }
        };

        const handleError = (err) => {
            console.error('Erro no listener de projetos:', err);
            setError(err.message);
        };

        return projectManagementService.listen(handleData, handleError);
    };

    /**
     * Criar projeto
     */
    const createProject = async (projectData) => {
        try {
            const newProject = await projectManagementService.create(projectData);
            toast.success('Projeto criado com sucesso!');
            return { success: true, data: newProject };
        } catch (err) {
            console.error('Erro ao criar projeto:', err);
            toast.error('Erro ao criar projeto');
            return { success: false, error: err.message };
        }
    };

    /**
     * Atualizar projeto
     */
    const updateProject = async (projectId, updates) => {
        try {
            const updated = await projectManagementService.update(projectId, updates);
            toast.success('Projeto atualizado com sucesso!');
            return { success: true, data: updated };
        } catch (err) {
            console.error('Erro ao atualizar projeto:', err);
            toast.error('Erro ao atualizar projeto');
            return { success: false, error: err.message };
        }
    };

    /**
     * Deletar projeto
     */
    const deleteProject = async (projectId) => {
        try {
            await projectManagementService.delete(projectId);
            toast.success('Projeto removido com sucesso!');
            return { success: true };
        } catch (err) {
            console.error('Erro ao deletar projeto:', err);
            toast.error('Erro ao remover projeto');
            return { success: false, error: err.message };
        }
    };

    /**
     * Inicializar projetos padrão
     */
    const initializeDefaultProjects = async () => {
        try {
            const defaultProjects = await projectManagementService.initializeDefaultProjects();
            toast.success('Projetos padrão inicializados!');
            return { success: true, data: defaultProjects };
        } catch (err) {
            console.error('Erro ao inicializar projetos padrão:', err);
            toast.error('Erro ao inicializar projetos');
            return { success: false, error: err.message };
        }
    };

    // Carregar projetos ao montar
    useEffect(() => {
        fetchProjects();
    }, []);

    return {
        projects,
        loading,
        error,
        currentBase,
        setCurrentBase,
        fetchProjects,
        listenToProjects,
        createProject,
        updateProject,
        deleteProject,
        initializeDefaultProjects,
    };
};
