import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    writeBatch,
    onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Serviço de Clientes - Adaptado do código original
 * Gerencia CRUD de clientes com paginação e filtros
 */
export const clientService = {
    /**
     * Busca clientes com paginação
     */
    async getAll(options = {}) {
        const {
            baseFilter = null,
            pageSize = 25,
            lastDoc = null,
            orderField = 'createdAt',
            orderDir = 'desc',
        } = options;

        const constraints = [];

        // Filtro de Base (Projeto)
        if (baseFilter && baseFilter !== 'TODOS') {
            constraints.push(where('database', '==', baseFilter));
        }

        // Ordenação
        constraints.push(orderBy(orderField, orderDir));

        // Paginação
        constraints.push(limit(pageSize));
        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        const q = query(collection(db, 'clients'), ...constraints);
        const snapshot = await getDocs(q);

        const clients = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return {
            clients,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    /**
     * ✅ P3-1: Busca clientes otimizada para dashboard (com limit)
     */
    async getAllForDashboard(baseFilter = null, maxLimit = 1000) {
        const constraints = [];

        if (baseFilter && baseFilter !== 'TODOS') {
            constraints.push(where('database', '==', baseFilter));
        }

        // Ordenação e limit para evitar leitura excessiva
        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(maxLimit));

        const q = query(collection(db, 'clients'), ...constraints);
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    },

    /**
     * Busca um cliente por ID
     */
    async getById(id) {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    /**
     * Cria um novo cliente
     */
    async create(clientData) {
        const user = auth.currentUser;

        const client = {
            ...clientData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user?.uid || null,
            createdByEmail: user?.email || 'Sistema',
        };

        // Remove campos undefined/null/vazios
        const cleanData = this._removeUndefined(client);

        const docRef = await addDoc(collection(db, 'clients'), cleanData);
        return { id: docRef.id, ...cleanData };
    },

    /**
     * Atualiza um cliente
     */
    async update(id, updates) {
        const ref = doc(db, 'clients', id);

        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        // Remove campos undefined/null/vazios
        const cleanData = this._removeUndefined(updateData);

        await updateDoc(ref, cleanData);
        return { id, ...cleanData };
    },

    /**
     * Deleta um cliente
     */
    async delete(id) {
        const ref = doc(db, 'clients', id);
        await deleteDoc(ref);
    },

    /**
     * ✅ P3-1: Listener otimizado com limit
     */
    listen(onData, onError, baseFilter = null, maxLimit = 500) {
        const constraints = [];

        if (baseFilter && baseFilter !== 'TODOS') {
            constraints.push(where('database', '==', baseFilter));
        }

        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(maxLimit));

        const q = query(collection(db, 'clients'), ...constraints);

        return onSnapshot(
            q,
            (snapshot) => {
                const clients = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                onData(clients);
            },
            onError
        );
    },

    /**
     * ✅ P3-1: Busca otimizada (ainda client-side mas com limit)
     * TODO: Implementar busca server-side com Algolia ou similar para produção
     */
    async search(searchTerm, baseFilter = null) {
        // Se busca vazia, retorna vazio
        if (!searchTerm || searchTerm.trim() === '') {
            return [];
        }

        // Busca com limit para evitar leitura excessiva
        const allClients = await this.getAllForDashboard(baseFilter, 500);

        const term = searchTerm.toLowerCase();
        return allClients.filter((client) => {
            return (
                client.name?.toLowerCase().includes(term) ||
                client.email?.toLowerCase().includes(term) ||
                client.phone?.toLowerCase().includes(term) ||
                client.cpfCnpj?.toLowerCase().includes(term) ||
                client.address?.toLowerCase().includes(term)
            );
        });
    },

    /**
     * Importação em lote
     */
    async batchImport(items, batchSize = 400) {
        const chunks = [];
        for (let i = 0; i < items.length; i += batchSize) {
            chunks.push(items.slice(i, i + batchSize));
        }

        let count = 0;
        for (const chunk of chunks) {
            const batch = writeBatch(db);

            chunk.forEach((item) => {
                const cleanData = this._removeUndefined(item);
                if (item.id) {
                    const ref = doc(db, 'clients', item.id);
                    batch.set(ref, cleanData, { merge: true });
                } else {
                    const ref = doc(collection(db, 'clients'));
                    batch.set(ref, cleanData);
                }
            });

            await batch.commit();
            count++;
            console.log(`Lote ${count}/${chunks.length} processado.`);
        }

        return { imported: items.length, batches: count };
    },

    /**
     * Deleta todos os clientes de uma base
     */
    async deleteAll(baseFilter) {
        if (!baseFilter || baseFilter === 'TODOS') {
            throw new Error('Segurança: Selecione um projeto específico para limpar.');
        }

        const q = query(collection(db, 'clients'), where('database', '==', baseFilter));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return 0;

        const batchSize = 400;
        const chunks = [];
        let currentChunk = [];

        snapshot.docs.forEach((doc) => {
            currentChunk.push(doc.ref);
            if (currentChunk.length === batchSize) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
        });
        if (currentChunk.length > 0) chunks.push(currentChunk);

        let count = 0;
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((ref) => batch.delete(ref));
            await batch.commit();
            count += chunk.length;
            console.log(`Apagados ${count} registros...`);
        }

        return count;
    },

    /**
     * Calcula métricas dos clientes
     */
    getMetrics(clients) {
        const total = clients.length;
        if (total === 0) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                byDatabase: {},
            };
        }

        const active = clients.filter((c) => c.status === 'active' || !c.status).length;
        const inactive = clients.filter((c) => c.status === 'inactive').length;

        // Agrupa por base/projeto
        const byDatabase = clients.reduce((acc, client) => {
            const db = client.database || 'Sem Base';
            acc[db] = (acc[db] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            active,
            inactive,
            byDatabase,
        };
    },

    /**
     * Busca clientes focada no pipeline de onboarding com filtros e paginação
     */
    async getOnboardingPipeline(options = {}) {
        const {
            baseFilter = null,
            pageSize = 20,
            lastDoc = null,
            statusFilter = [],
            searchTerm = '',
        } = options;

        const constraints = [];

        // Filtro de Base (Obrigatório para Tenancy)
        if (baseFilter && baseFilter !== 'TODOS') {
            constraints.push(where('database', '==', baseFilter));
        }

        // Filtro de Status do Pipeline
        if (statusFilter && statusFilter.length > 0) {
            constraints.push(where('onboarding.pipelineStatus', 'in', statusFilter));
        }

        // Ordenação por última atualização de onboarding
        constraints.push(orderBy('onboarding.updatedAt', 'desc'));

        // Paginação
        constraints.push(limit(pageSize));
        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        const q = query(collection(db, 'clients'), ...constraints);
        const snapshot = await getDocs(q);

        let clients = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Se houver termo de busca, filtramos (Nota: Firestore não suporta busca parcial nativa bem)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            clients = clients.filter(c =>
                c.uc?.toLowerCase().includes(term) ||
                c.name?.toLowerCase().includes(term)
            );
        }

        return {
            clients,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    /**
     * Atualiza especificamente o objeto de onboarding de um cliente
     */
    async updateOnboarding(clientId, onboardingData) {
        const ref = doc(db, 'clients', clientId);

        await updateDoc(ref, {
            'onboarding': {
                ...onboardingData,
                updatedAt: new Date().toISOString()
            }
        });

        return { success: true };
    },

    /**
     * Remove campos undefined, null e vazios
     */
    _removeUndefined(obj) {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
    },
};
