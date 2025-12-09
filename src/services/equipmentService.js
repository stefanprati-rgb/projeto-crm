/**
 * Serviço de Equipamentos
 * 
 * Gerencia CRUD de equipamentos vinculados a clientes.
 * Equipamentos são armazenados como subcoleção: clients/{clientId}/equipments
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
import { EquipmentStatus, EquipmentType } from '../types/client.types';

export const equipmentService = {
    /**
     * Criar novo equipamento para um cliente
     * @param {string} clientId - ID do cliente
     * @param {object} equipmentData - Dados do equipamento
     * @returns {Promise<string>} ID do equipamento criado
     */
    async create(clientId, equipmentData) {
        if (!clientId) throw new Error('Client ID is required');

        const user = auth.currentUser;
        const equipRef = await addDoc(
            collection(db, `clients/${clientId}/equipments`),
            {
                ...equipmentData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user?.uid || 'system',
                createdByEmail: user?.email || 'system',
                updatedBy: user?.uid || 'system',
                updatedByEmail: user?.email || 'system'
            }
        );

        console.log(`✅ Equipamento criado: ${equipRef.id} para cliente ${clientId}`);
        return equipRef.id;
    },

    /**
     * Atualizar equipamento existente
     * @param {string} clientId - ID do cliente
     * @param {string} equipmentId - ID do equipamento
     * @param {object} updates - Campos a atualizar
     */
    async update(clientId, equipmentId, updates) {
        if (!clientId) throw new Error('Client ID is required');
        if (!equipmentId) throw new Error('Equipment ID is required');

        const user = auth.currentUser;
        const equipRef = doc(db, `clients/${clientId}/equipments`, equipmentId);

        await updateDoc(equipRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || 'system',
            updatedByEmail: user?.email || 'system'
        });

        console.log(`✅ Equipamento atualizado: ${equipmentId}`);
    },

    /**
     * Deletar equipamento
     * @param {string} clientId - ID do cliente
     * @param {string} equipmentId - ID do equipamento
     */
    async delete(clientId, equipmentId) {
        if (!clientId) throw new Error('Client ID is required');
        if (!equipmentId) throw new Error('Equipment ID is required');

        const equipRef = doc(db, `clients/${clientId}/equipments`, equipmentId);
        await deleteDoc(equipRef);

        console.log(`✅ Equipamento deletado: ${equipmentId}`);
    },

    /**
     * Buscar equipamento específico
     * @param {string} clientId - ID do cliente
     * @param {string} equipmentId - ID do equipamento
     * @returns {Promise<object|null>} Dados do equipamento ou null
     */
    async getById(clientId, equipmentId) {
        if (!clientId) throw new Error('Client ID is required');
        if (!equipmentId) throw new Error('Equipment ID is required');

        const equipRef = doc(db, `clients/${clientId}/equipments`, equipmentId);
        const equipSnap = await getDoc(equipRef);

        if (equipSnap.exists()) {
            return {
                id: equipSnap.id,
                ...equipSnap.data()
            };
        }

        return null;
    },

    /**
     * Listar equipamentos de um cliente em tempo real
     * @param {string} clientId - ID do cliente
     * @param {function} onData - Callback com array de equipamentos
     * @param {function} onError - Callback de erro
     * @returns {function} Unsubscribe function
     */
    listen(clientId, onData, onError) {
        if (!clientId) {
            console.warn('⚠️ Client ID não fornecido para listener de equipamentos');
            return () => { };
        }

        const q = query(
            collection(db, `clients/${clientId}/equipments`),
            orderBy('dataInstalacao', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const equipments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                onData(equipments);
            },
            (error) => {
                console.error('❌ Erro ao escutar equipamentos:', error);
                if (onError) onError(error);
            }
        );
    },

    /**
     * Buscar equipamentos por tipo
     * @param {string} tipo - Tipo do equipamento
     * @returns {Promise<array>} Array de equipamentos
     */
    async getByType(tipo) {
        const q = query(
            collectionGroup(db, 'equipments'),
            where('tipo', '==', tipo),
            orderBy('dataInstalacao', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data()
        }));
    },

    /**
     * Buscar equipamentos por status
     * @param {string} status - Status do equipamento
     * @returns {Promise<array>} Array de equipamentos
     */
    async getByStatus(status) {
        const q = query(
            collectionGroup(db, 'equipments'),
            where('status', '==', status),
            orderBy('dataInstalacao', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data()
        }));
    },

    /**
     * Buscar equipamentos com garantia vencendo
     * @param {number} days - Número de dias para considerar (padrão: 90)
     * @returns {Promise<array>} Array de equipamentos
     */
    async getExpiringWarranties(days = 90) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const q = query(
            collectionGroup(db, 'equipments'),
            where('garantiaAte', '<=', futureDate.toISOString()),
            where('garantiaAte', '>=', today.toISOString()),
            orderBy('garantiaAte', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data()
        }));
    },

    /**
     * Buscar equipamentos por número de série
     * @param {string} numeroSerie - Número de série
     * @returns {Promise<object|null>} Equipamento encontrado ou null
     */
    async getBySerialNumber(numeroSerie) {
        const q = query(
            collectionGroup(db, 'equipments'),
            where('numeroSerie', '==', numeroSerie)
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
     * Buscar equipamentos por projeto
     * @param {string} projetoId - ID do projeto
     * @returns {Promise<array>} Array de equipamentos
     */
    async getByProject(projetoId) {
        const q = query(
            collectionGroup(db, 'equipments'),
            where('projetoId', '==', projetoId),
            orderBy('dataInstalacao', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data()
        }));
    },

    /**
     * Buscar equipamentos por instalação
     * @param {string} instalacaoId - ID da instalação
     * @returns {Promise<array>} Array de equipamentos
     */
    async getByInstallation(instalacaoId) {
        const q = query(
            collectionGroup(db, 'equipments'),
            where('instalacaoId', '==', instalacaoId),
            orderBy('dataInstalacao', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data()
        }));
    },

    /**
     * Atualizar status do equipamento
     * @param {string} clientId - ID do cliente
     * @param {string} equipmentId - ID do equipamento
     * @param {string} newStatus - Novo status
     */
    async updateStatus(clientId, equipmentId, newStatus) {
        await this.update(clientId, equipmentId, { status: newStatus });
    },

    /**
     * Registrar manutenção
     * @param {string} clientId - ID do cliente
     * @param {string} equipmentId - ID do equipamento
     * @param {object} manutencao - Dados da manutenção
     */
    async addMaintenance(clientId, equipmentId, manutencao) {
        const equipment = await this.getById(clientId, equipmentId);

        if (!equipment) {
            throw new Error('Equipment not found');
        }

        const manutencoes = equipment.manutencoes || [];
        manutencoes.push({
            ...manutencao,
            data: manutencao.data || new Date().toISOString()
        });

        await this.update(clientId, equipmentId, { manutencoes });
    },

    /**
     * Marcar equipamento como defeituoso
     * @param {string} clientId - ID do cliente
     * @param {string} equipmentId - ID do equipamento
     * @param {string} descricaoDefeito - Descrição do defeito
     */
    async reportDefect(clientId, equipmentId, descricaoDefeito) {
        await this.update(clientId, equipmentId, {
            status: EquipmentStatus.DEFEITO,
            descricaoDefeito,
            dataDefeito: new Date().toISOString()
        });
    },

    /**
     * Substituir equipamento
     * @param {string} clientId - ID do cliente
     * @param {string} equipmentId - ID do equipamento antigo
     * @param {object} novoEquipamento - Dados do novo equipamento
     * @returns {Promise<string>} ID do novo equipamento
     */
    async replace(clientId, equipmentId, novoEquipamento) {
        // Marcar equipamento antigo como substituído
        await this.update(clientId, equipmentId, {
            status: EquipmentStatus.SUBSTITUIDO,
            dataSubstituicao: new Date().toISOString()
        });

        // Criar novo equipamento
        const newId = await this.create(clientId, {
            ...novoEquipamento,
            equipamentoSubstituidoId: equipmentId
        });

        return newId;
    },

    /**
     * Calcular métricas de equipamentos
     * @param {array} equipments - Array de equipamentos
     * @returns {object} Métricas calculadas
     */
    calculateMetrics(equipments) {
        const total = equipments.length;
        const operacionais = equipments.filter(e => e.status === EquipmentStatus.OPERACIONAL).length;
        const manutencao = equipments.filter(e => e.status === EquipmentStatus.MANUTENCAO).length;
        const defeito = equipments.filter(e => e.status === EquipmentStatus.DEFEITO).length;

        const porTipo = {};
        equipments.forEach(e => {
            porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;
        });

        const potenciaTotal = equipments.reduce((sum, e) => {
            return sum + (e.potenciaTotal || e.potencia || 0);
        }, 0);

        const valorTotal = equipments.reduce((sum, e) => {
            return sum + (e.valorAquisicao || 0);
        }, 0);

        // Equipamentos com garantia vencendo (próximos 90 dias)
        const hoje = new Date();
        const futuro = new Date();
        futuro.setDate(futuro.getDate() + 90);

        const garantiaVencendo = equipments.filter(e => {
            if (!e.garantiaAte) return false;
            const garantia = new Date(e.garantiaAte);
            return garantia >= hoje && garantia <= futuro;
        }).length;

        return {
            total,
            operacionais,
            manutencao,
            defeito,
            porTipo,
            potenciaTotal,
            valorTotal,
            garantiaVencendo
        };
    },

    /**
     * Buscar equipamentos que precisam de manutenção preventiva
     * @param {number} mesesSemManutencao - Meses sem manutenção (padrão: 6)
     * @returns {Promise<array>} Array de equipamentos
     */
    async getNeedingMaintenance(mesesSemManutencao = 6) {
        const allEquipments = await this.getByStatus(EquipmentStatus.OPERACIONAL);

        const dataLimite = new Date();
        dataLimite.setMonth(dataLimite.getMonth() - mesesSemManutencao);

        return allEquipments.filter(equip => {
            if (!equip.manutencoes || equip.manutencoes.length === 0) {
                // Nunca teve manutenção, verificar data de instalação
                if (!equip.dataInstalacao) return false;
                const dataInstalacao = new Date(equip.dataInstalacao);
                return dataInstalacao < dataLimite;
            }

            // Verificar última manutenção
            const ultimaManutencao = equip.manutencoes
                .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

            const dataUltimaManutencao = new Date(ultimaManutencao.data);
            return dataUltimaManutencao < dataLimite;
        });
    }
};
