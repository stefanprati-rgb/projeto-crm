import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    updateDoc,
    addDoc,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Cliente Service V2 (Arquitetura Relacional)
 * Lida com as coleções separadas: clientes, instalacoes e historico_rateios
 */
export const clientServiceV2 = {
    // ==========================================
    // CLIENTES
    // ==========================================

    /**
     * Busca clientes com paginação (Somente dados cadastrais PII)
     */
    async getClientes(options = {}) {
        const {
            baseFilter = null,
            pageSize = 25,
            lastDoc = null,
            orderField = 'createdAt',
            orderDir = 'desc',
        } = options;

        const constraints = [];

        if (baseFilter && baseFilter !== 'TODOS') {
            constraints.push(where('database', '==', baseFilter));
        }

        constraints.push(orderBy(orderField, orderDir));
        constraints.push(limit(pageSize));

        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        const q = query(collection(db, 'clientes'), ...constraints);
        const snapshot = await getDocs(q);

        const clientes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return {
            clientes,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    async getClienteById(id) {
        const docRef = doc(db, 'clientes', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    async createCliente(data) {
        const docRef = await addDoc(collection(db, 'clientes'), {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    },

    async updateCliente(id, data) {
        const docRef = doc(db, 'clientes', id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    },

    async deleteCliente(id) {
        // Soft delete ou delete físico? Usando physical por enquanto
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'clientes', id));
        return { success: true };
    },

    // ==========================================
    // INSTALAÇÕES (UCs) E PIPELINE
    // ==========================================

    /**
     * Busca instalações (UCs) vinculadas a um cliente específico
     */
    async getInstalacoesByClienteId(clienteId) {
        const q = query(
            collection(db, 'instalacoes'),
            where('clienteId', '==', clienteId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Busca instalações para o Funil de Onboarding / Kanban
     * Agora as "entidades" da esteira são as Instalações, e não os Clientes
     */
    async getPipelineInstalacoes(options = {}) {
        const {
            baseFilter = null,
            pageSize = 20,
            lastDoc = null,
            statusFilter = [],
            searchTerm = '',
        } = options;

        const constraints = [];

        if (baseFilter && baseFilter !== 'TODOS') {
            constraints.push(where('database', '==', baseFilter));
        }

        if (statusFilter && statusFilter.length > 0) {
            constraints.push(where('onboarding.pipelineStatus', 'in', statusFilter));
        }

        constraints.push(orderBy('updatedAt', 'desc'));
        constraints.push(limit(pageSize));

        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        const q = query(collection(db, 'instalacoes'), ...constraints);
        const snapshot = await getDocs(q);

        let instalacoes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // TODO: Num cenário ideal de NoSQL, o `nome do cliente` seria desnormalizado
        // e salvo na tabela `instalacoes` durante a gravação/dual-write.
        // Abaixo fazemos um join dinâmico (buscando os clientes em batch).
        const clienteIds = [...new Set(instalacoes.map(inst => inst.clienteId))];
        const clientesMap = {};

        if (clienteIds.length > 0) {
            // Em produção, deve-se particionar em blocos de 10 em 10 para o `in` query,
            // ou buscar individualmente em Promisse.all para caches.
            const clientsSnapshot = await Promise.all(
                clienteIds.map(id => getDoc(doc(db, 'clientes', id)))
            );

            clientsSnapshot.forEach(docSnap => {
                if (docSnap.exists()) {
                    clientesMap[docSnap.id] = docSnap.data().name;
                }
            });

            instalacoes = instalacoes.map(inst => ({
                ...inst,
                clienteNome: clientesMap[inst.clienteId] || "Cliente não encontrado"
            }));
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            instalacoes = instalacoes.filter(i =>
                i.uc?.toLowerCase().includes(term) ||
                i.clienteNome?.toLowerCase().includes(term)
            );
        }

        return {
            instalacoes,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    /**
     * Atualiza o status/dados do onboarding de uma instalação específica
     */
    async updateInstalacaoOnboarding(instalacaoId, onboardingUpdates) {
        const ref = doc(db, 'instalacoes', instalacaoId);

        // Em um sistema real, poderíamos disparar um histórico de auditoria aqui na collection de audit_logs.
        await updateDoc(ref, {
            'onboarding': onboardingUpdates,
            'updatedAt': new Date().toISOString()
        });

        return { success: true };
    },

    // ==========================================
    // HISTÓRICO DE RATEIOS
    // ==========================================

    async getRateiosByInstalacao(instalacaoId) {
        const q = query(
            collection(db, 'historico_rateios'),
            where('instalacaoId', '==', instalacaoId),
            orderBy('competencia', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // ==========================================
    // COBRANÇAS / TRAVAS (HARDENING FINANCEIRO)
    // ==========================================

    /**
     * Verifica se há cobranças inadimplentes ou abertas e vencidas para barrar o funil
     */
    async hasPendingCobrancas(clienteId) {
        const q = query(
            collection(db, 'cobrancas_chamados'),
            where('clienteId', '==', clienteId),
            where('status', 'in', ['aberta', 'inadimplente'])
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return false;

        let isBlocked = false;
        const now = new Date();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.status === 'inadimplente') {
                isBlocked = true;
            } else if (data.status === 'aberta' && data.dataVencimento) {
                const vDate = data.dataVencimento.toDate
                    ? data.dataVencimento.toDate()
                    : new Date(data.dataVencimento);
                if (vDate < now) {
                    isBlocked = true;
                }
            }
        });

        return isBlocked;
    }
};
