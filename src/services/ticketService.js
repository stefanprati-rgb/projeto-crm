import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    collectionGroup,
    writeBatch,
    where,
    limit,
    startAfter,
    getDocs,
} from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Serviço de Tickets - Adaptado do código original
 * Tickets ficam em: clients/{clientId}/tickets
 */
export const ticketService = {
    /**
     * Formata prioridade para exibição
     */
    formatPriority(priority) {
        const formats = {
            high: { text: 'Alta', variant: 'danger', color: 'red' },
            medium: { text: 'Média', variant: 'warning', color: 'yellow' },
            low: { text: 'Baixa', variant: 'info', color: 'gray' },
        };
        return formats[priority] || formats.low;
    },

    /**
     * Formata status para exibição
     */
    formatStatus(status) {
        const formats = {
            open: { text: 'Aberto', variant: 'info', color: 'blue' },
            in_progress: { text: 'Em Andamento', variant: 'warning', color: 'yellow' },
            resolved: { text: 'Resolvido', variant: 'success', color: 'green' },
            closed: { text: 'Fechado', variant: 'default', color: 'gray' },
        };
        return formats[status] || formats.open;
    },

    /**
     * Calcula data de vencimento baseada na prioridade
     */
    calculateDueDate(priority) {
        const hours = priority === 'high' ? 4 : priority === 'medium' ? 24 : 48;
        const date = new Date();
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    },

    /**
     * Gera protocolo único para o ticket
     */
    generateProtocol() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000);
        return `T-${year}${month}-${random}`;
    },

    /**
     * Cria um novo ticket
     */
    async create(clientId, ticketData) {
        if (!clientId) throw new Error('Client ID obrigatório');

        const user = auth.currentUser;
        const path = `clients/${clientId}/tickets`;

        const ticket = {
            protocol: this.generateProtocol(),
            subject: ticketData.subject,
            description: ticketData.description || '',
            category: ticketData.category || 'outros',
            priority: ticketData.priority || 'medium',
            status: 'open',

            // SLA
            dueDate: ticketData.dueDate || this.calculateDueDate(ticketData.priority || 'medium'),
            overdue: false,

            // Metadata
            openedBy: user?.uid || null,
            openedByEmail: user?.email || 'Sistema',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timestamp: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, path), ticket);
        return { id: docRef.id, clientId, ...ticket };
    },

    /**
     * Atualiza um ticket
     */
    async update(clientId, ticketId, updates) {
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);

        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        // Se mudou para resolvido/fechado, marca data de resolução
        if (updates.status && ['resolved', 'closed'].includes(updates.status)) {
            updateData.resolvedAt = new Date().toISOString();
        }

        await updateDoc(ref, updateData);
        return { id: ticketId, clientId, ...updateData };
    },

    /**
     * Atualiza apenas o status
     */
    async updateStatus(clientId, ticketId, newStatus) {
        return this.update(clientId, ticketId, { status: newStatus });
    },

    /**
     * Deleta um ticket
     */
    async delete(clientId, ticketId) {
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);
        await deleteDoc(ref);
    },

    /**
     * Busca todos os tickets (usando collectionGroup)
     */
    async getAll(options = {}) {
        const { pageSize = 50, lastDoc = null, status = null } = options;

        let q = query(
            collectionGroup(db, 'tickets'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (status) {
            q = query(q, where('status', '==', status));
        }

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data(),
        }));

        return {
            tickets,
            lastDoc: snapshot.docs[snapshot.docs.length - 1],
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    /**
     * Busca tickets de um cliente específico
     */
    async getByClient(clientId, options = {}) {
        const { pageSize = 50, lastDoc = null } = options;

        const path = `clients/${clientId}/tickets`;
        let q = query(
            collection(db, path),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            clientId,
            ...doc.data(),
        }));

        return {
            tickets,
            lastDoc: snapshot.docs[snapshot.docs.length - 1],
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    /**
     * Listener em tempo real para todos os tickets
     */
    listen(onData, onError) {
        const q = query(collectionGroup(db, 'tickets'), orderBy('createdAt', 'desc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const tickets = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    clientId: doc.ref.parent.parent.id,
                    ...doc.data(),
                }));
                onData(tickets);
            },
            onError
        );
    },

    /**
     * Listener para tickets de um cliente específico
     */
    listenToClient(clientId, onData, onError) {
        if (!clientId) return null;

        const path = `clients/${clientId}/tickets`;
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const tickets = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    clientId,
                    ...doc.data(),
                }));
                onData(tickets);
            },
            onError
        );
    },

    /**
     * Verifica e atualiza tickets vencidos (SLA Enforcer)
     */
    async checkSLAEnforcement(tickets) {
        const now = new Date();
        const batch = writeBatch(db);
        let updatesCount = 0;

        tickets.forEach((t) => {
            // Ignora tickets já fechados ou já marcados como vencidos
            if (['resolved', 'closed'].includes(t.status)) return;
            if (!t.dueDate) return;

            const dueDate = new Date(t.dueDate);
            const isOverdue = now > dueDate;

            // Se detectou vencimento que ainda não está marcado
            if (isOverdue && !t.overdue) {
                const ref = doc(db, `clients/${t.clientId}/tickets`, t.id);
                batch.update(ref, { overdue: true });
                updatesCount++;
            }
        });

        if (updatesCount > 0) {
            console.log(`[SLA Enforcer] Atualizando ${updatesCount} tickets vencidos.`);
            await batch.commit();
        }

        return updatesCount;
    },

    /**
     * Calcula métricas dos tickets
     */
    getMetrics(tickets) {
        const total = tickets.length;
        if (total === 0) {
            return {
                total: 0,
                open: 0,
                overdue: 0,
                resolved: 0,
                avgResolutionHours: 0,
                complianceRate: 100,
            };
        }

        const open = tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
        const overdue = tickets.filter((t) => t.overdue && ['open', 'in_progress'].includes(t.status)).length;
        const resolved = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;

        // Tempo médio de resolução
        let totalTime = 0;
        let resolvedCount = 0;

        tickets.forEach((t) => {
            if (t.resolvedAt && t.createdAt) {
                const start = new Date(t.createdAt);
                const end = new Date(t.resolvedAt);
                totalTime += end - start;
                resolvedCount++;
            }
        });

        const avgResolutionHours = resolvedCount > 0 ? Math.round(totalTime / resolvedCount / (1000 * 60 * 60)) : 0;

        // Taxa de conformidade SLA
        const slaBreachedTotal = tickets.filter((t) => t.overdue).length;
        const complianceRate = Math.round(((total - slaBreachedTotal) / total) * 100);

        return {
            total,
            open,
            overdue,
            resolved,
            avgResolutionHours,
            complianceRate,
        };
    },
};
