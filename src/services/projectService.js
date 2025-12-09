/**
 * Serviço de Projetos de Geração Distribuída
 * 
 * Gerencia CRUD de projetos vinculados a clientes.
 * Projetos são armazenados como subcoleção: clients/{clientId}/projects
 */

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    collectionGroup,
    getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ProjectStatus } from '../types/client.types';

export const projectService = {
    /**
     * Criar novo projeto para um cliente
     * @param {string} clientId - ID do cliente
     * @param {object} projectData - Dados do projeto
     * @returns {Promise<string>} ID do projeto criado
     */
    async create(clientId, projectData) {
        if (!clientId) throw new Error('Client ID is required');

        const user = auth.currentUser;
        const projectRef = await addDoc(
            collection(db, `clients/${clientId}/projects`),
            {
                ...projectData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user?.uid || 'system',
                createdByEmail: user?.email || 'system',
                updatedBy: user?.uid || 'system',
                updatedByEmail: user?.email || 'system'
            }
        );

        console.log(`✅ Projeto criado: ${projectRef.id} para cliente ${clientId}`);
        return projectRef.id;
    },

    /**
     * Atualizar projeto existente
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     * @param {object} updates - Campos a atualizar
     */
    async update(clientId, projectId, updates) {
        if (!clientId) throw new Error('Client ID is required');
        if (!projectId) throw new Error('Project ID is required');

        const user = auth.currentUser;
        const projectRef = doc(db, `clients/${clientId}/projects`, projectId);

        await updateDoc(projectRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || 'system',
            updatedByEmail: user?.email || 'system'
        });

        console.log(`✅ Projeto atualizado: ${projectId}`);
    },

    /**
     * Deletar projeto
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     */
    async delete(clientId, projectId) {
        if (!clientId) throw new Error('Client ID is required');
        if (!projectId) throw new Error('Project ID is required');

        const projectRef = doc(db, `clients/${clientId}/projects`, projectId);
        await deleteDoc(projectRef);

        console.log(`✅ Projeto deletado: ${projectId}`);
    },

    /**
     * Buscar projeto específico
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     * @returns {Promise<object|null>} Dados do projeto ou null
     */
    async getById(clientId, projectId) {
        if (!clientId) throw new Error('Client ID is required');
        if (!projectId) throw new Error('Project ID is required');

        const projectRef = doc(db, `clients/${clientId}/projects`, projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
            return {
                id: projectSnap.id,
                ...projectSnap.data()
            };
        }

        return null;
    },

    /**
     * Listar projetos de um cliente em tempo real
     * @param {string} clientId - ID do cliente
     * @param {function} onData - Callback com array de projetos
     * @param {function} onError - Callback de erro
     * @returns {function} Unsubscribe function
     */
    listen(clientId, onData, onError) {
        if (!clientId) {
            console.warn('⚠️ Client ID não fornecido para listener de projetos');
            return () => { };
        }

        const q = query(
            collection(db, `clients/${clientId}/projects`),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const projects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                onData(projects);
            },
            (error) => {
                console.error('❌ Erro ao escutar projetos:', error);
                if (onError) onError(error);
            }
        );
    },

    /**
     * Buscar todos os projetos por status (em todos os clientes)
     * @param {string} status - Status do projeto
     * @returns {Promise<array>} Array de projetos
     */
    async getByStatus(status) {
        const q = query(
            collectionGroup(db, 'projects'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id, // ID do cliente pai
            ...doc.data()
        }));
    },

    /**
     * Buscar projetos ativos (em todos os clientes)
     * @returns {Promise<array>} Array de projetos ativos
     */
    async getActive() {
        return this.getByStatus(ProjectStatus.ATIVO);
    },

    /**
     * Buscar projetos em construção (em todos os clientes)
     * @returns {Promise<array>} Array de projetos em construção
     */
    async getInConstruction() {
        return this.getByStatus(ProjectStatus.EM_CONSTRUCAO);
    },

    /**
     * Buscar projetos por código
     * @param {string} codigo - Código do projeto (ex: GD-SP-001)
     * @returns {Promise<object|null>} Projeto encontrado ou null
     */
    async getByCode(codigo) {
        const q = query(
            collectionGroup(db, 'projects'),
            where('codigo', '==', codigo)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data()
        };
    },

    /**
     * Buscar projetos por usina
     * @param {string} usinaId - ID da usina
     * @returns {Promise<array>} Array de projetos
     */
    async getByPlant(usinaId) {
        const q = query(
            collectionGroup(db, 'projects'),
            where('usinas', 'array-contains', usinaId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data()
        }));
    },

    /**
     * Atualizar status do projeto
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     * @param {string} newStatus - Novo status
     */
    async updateStatus(clientId, projectId, newStatus) {
        await this.update(clientId, projectId, { status: newStatus });
    },

    /**
     * Ativar projeto (mudar status para ATIVO e registrar data)
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     */
    async activate(clientId, projectId) {
        await this.update(clientId, projectId, {
            status: ProjectStatus.ATIVO,
            dataAtivacao: new Date().toISOString()
        });
    },

    /**
     * Suspender projeto
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     * @param {string} motivo - Motivo da suspensão
     */
    async suspend(clientId, projectId, motivo) {
        await this.update(clientId, projectId, {
            status: ProjectStatus.SUSPENSO,
            motivoSuspensao: motivo,
            dataSuspensao: new Date().toISOString()
        });
    },

    /**
     * Cancelar projeto
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     * @param {string} motivo - Motivo do cancelamento
     */
    async cancel(clientId, projectId, motivo) {
        await this.update(clientId, projectId, {
            status: ProjectStatus.CANCELADO,
            motivoCancelamento: motivo,
            dataCancelamento: new Date().toISOString()
        });
    },

    /**
     * Concluir projeto
     * @param {string} clientId - ID do cliente
     * @param {string} projectId - ID do projeto
     */
    async complete(clientId, projectId) {
        await this.update(clientId, projectId, {
            status: ProjectStatus.CONCLUIDO,
            dataConclusao: new Date().toISOString()
        });
    },

    /**
     * Calcular métricas de projetos
     * @param {array} projects - Array de projetos
     * @returns {object} Métricas calculadas
     */
    calculateMetrics(projects) {
        const total = projects.length;
        const ativos = projects.filter(p => p.status === ProjectStatus.ATIVO).length;
        const emConstrucao = projects.filter(p => p.status === ProjectStatus.EM_CONSTRUCAO).length;
        const emAnalise = projects.filter(p => p.status === ProjectStatus.EM_ANALISE).length;
        const cancelados = projects.filter(p => p.status === ProjectStatus.CANCELADO).length;

        const potenciaTotal = projects.reduce((sum, p) => sum + (p.potencia || 0), 0);
        const valorTotal = projects.reduce((sum, p) => sum + (p.valorInvestimento || 0), 0);
        const receitaMensal = projects
            .filter(p => p.status === ProjectStatus.ATIVO)
            .reduce((sum, p) => sum + (p.valorMensalEstimado || 0), 0);

        return {
            total,
            ativos,
            emConstrucao,
            emAnalise,
            cancelados,
            potenciaTotal,
            valorTotal,
            receitaMensal
        };
    },

    /**
     * Gerar próximo código de projeto
     * @param {string} prefix - Prefixo (ex: GD-SP)
     * @returns {Promise<string>} Próximo código disponível
     */
    async generateNextCode(prefix = 'GD') {
        const q = query(
            collectionGroup(db, 'projects'),
            where('codigo', '>=', prefix),
            where('codigo', '<', prefix + '\uf8ff'),
            orderBy('codigo', 'desc')
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return `${prefix}-001`;
        }

        const lastCode = snapshot.docs[0].data().codigo;
        const match = lastCode.match(/(\d+)$/);

        if (!match) {
            return `${prefix}-001`;
        }

        const nextNumber = parseInt(match[1]) + 1;
        return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
    }
};
