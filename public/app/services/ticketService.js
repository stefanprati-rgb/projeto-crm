import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    collectionGroup,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth } from "../core/firebase.js";
import { store } from "../core/store.js";
import { bus } from "../core/eventBus.js";

export class TicketService {
    constructor() {
        // Tickets ficam em: clients/{id}/tickets
    }

    // --- STATIC HELPERS (Formatadores) ---
    static formatPriority(priority) {
        switch (priority) {
            case 'high': return { text: 'Alta', icon: 'fa-chevron-up', class: 'bg-rose-50 text-rose-600 border-rose-100' };
            case 'medium': return { text: 'Média', icon: 'fa-minus', class: 'bg-amber-50 text-amber-600 border-amber-100' };
            default: return { text: 'Baixa', icon: 'fa-chevron-down', class: 'bg-slate-100 text-slate-500 border-slate-200' };
        }
    }

    static formatStatus(status) {
        switch (status) {
            case 'open': return { text: 'Aberto', icon: 'fa-envelope-open-text', class: 'bg-blue-50 text-blue-600 border-blue-100' };
            case 'in_progress': return { text: 'Em Andamento', icon: 'fa-spinner fa-spin', class: 'bg-amber-50 text-amber-600 border-amber-100' };
            case 'resolved': return { text: 'Resolvido', icon: 'fa-check-double', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
            case 'closed': return { text: 'Fechado', icon: 'fa-check', class: 'bg-slate-100 text-slate-500 border-slate-200' };
            default: return { text: 'N/A', icon: 'fa-question', class: 'bg-slate-100 text-slate-500' };
        }
    }

    // --- MÉTODOS DE DADOS ---

    /**
     * Abre um novo ticket para o cliente com cálculo de SLA
     */
    async createTicket(clientId, ticketData) {
        if (!clientId) throw new Error("Client ID obrigatório");

        const user = auth.currentUser;
        const path = `clients/${clientId}/tickets`;

        // Gera protocolo: T-ANO-MÊS-RANDOM
        const now = new Date();
        const protocol = `T-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;

        const ticket = {
            protocol: protocol,
            subject: ticketData.subject,
            description: ticketData.description || '',
            category: ticketData.category || 'outros',
            priority: ticketData.priority || 'medium',
            status: 'open',

            // SLA Inicial
            dueDate: ticketData.dueDate || this.calculateDueDate(ticketData.priority || 'medium'),
            overdue: false,

            openedBy: user ? user.uid : null,
            openedByEmail: user ? user.email : 'Sistema',

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timestamp: serverTimestamp()
        };

        // Optimistic update
        const tempId = 'temp-' + Date.now();
        const optimisticTicket = { ...ticket, id: tempId, clientId, pending: true };
        const tickets = store.get('tickets') || [];

        store.set('tickets', [optimisticTicket, ...tickets]);
        bus.emit('tickets:created', optimisticTicket);

        try {
            const docRef = await addDoc(collection(db, path), ticket);

            // Success: replace temp ID with real ID
            store.set('tickets', store.get('tickets').map(t =>
                t.id === tempId ? { ...t, id: docRef.id, pending: false } : t
            ));

            bus.emit('ui:success', 'Ticket criado com sucesso');
            return docRef;
        } catch (error) {
            // Rollback: remove optimistic entry
            store.set('tickets', store.get('tickets').filter(t => t.id !== tempId));
            bus.emit('ui:error', 'Falha ao criar ticket');
            throw error;
        }
    }

    /**
     * Calcula data de vencimento baseada na prioridade
     */
    calculateDueDate(priority) {
        const hours = priority === 'high' ? 4 : (priority === 'medium' ? 24 : 48);
        const date = new Date();
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    }

    /**
     * Atualiza status e registra atividade
     */
    async updateStatus(clientId, ticketId, newStatus) {
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);

        const updateData = {
            status: newStatus,
            updatedAt: new Date().toISOString()
        };

        // Se fechou, marca data de resolução
        if (newStatus === 'resolved' || newStatus === 'closed') {
            updateData.resolvedAt = new Date().toISOString();
        }

        // Optimistic update
        const tickets = store.get('tickets') || [];
        const oldTicket = tickets.find(t => t.id === ticketId);

        if (oldTicket) {
            const optimisticTicket = { ...oldTicket, ...updateData, pending: true };
            store.set('tickets', tickets.map(t => t.id === ticketId ? optimisticTicket : t));
            bus.emit('tickets:updated', optimisticTicket);
        }

        try {
            await updateDoc(ref, updateData);

            // Success: remove pending flag
            store.set('tickets', store.get('tickets').map(t =>
                t.id === ticketId ? { ...t, pending: false } : t
            ));

            bus.emit('ui:success', 'Status atualizado com sucesso');
        } catch (error) {
            // Rollback: restore old ticket
            if (oldTicket) {
                store.set('tickets', tickets.map(t => t.id === ticketId ? oldTicket : t));
            }
            bus.emit('ui:error', 'Falha ao atualizar status');
            throw error;
        }
    }

    /**
     * Lista tickets GLOBAIS (Dashboard) e verifica SLA
     */
    listen(onData) {
        // Query global usando Collection Group
        const q = query(collectionGroup(db, 'tickets'), orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                clientId: doc.ref.parent.parent.id, // ID do Cliente Pai
                ...doc.data()
            }));

            // Executa verificação de SLA em background (Client-Side Enforcer)
            this._checkSLAEnforcement(tickets);

            // Update store
            store.set('tickets', tickets);
            bus.emit('tickets:loaded', tickets);

            onData(tickets);
        });
    }

    /**
     * Lista tickets de um cliente específico
     */
    listenToClientTickets(clientId, onData) {
        if (!clientId) return null;
        const path = `clients/${clientId}/tickets`;
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                clientId: clientId,
                ...doc.data()
            }));
            onData(tickets);
        });
    }

    // --- SLA ENFORCER & METRICS (VIBE CODING LOGIC) ---

    /**
     * Verifica tickets vencidos e atualiza no banco se necessário.
     * Funciona como um "Cloud Function" rodando no cliente do admin.
     */
    async _checkSLAEnforcement(tickets) {
        const now = new Date();
        const batch = writeBatch(db);
        let updatesCount = 0;

        tickets.forEach(t => {
            // Ignora tickets já fechados ou já marcados como vencidos
            if (['resolved', 'closed'].includes(t.status)) return;
            if (!t.dueDate) return;

            const dueDate = new Date(t.dueDate);
            const isOverdue = now > dueDate;

            // Se detectou vencimento que ainda não está marcado no banco
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
    }

    /**
     * Gera KPIs para o Dashboard
     */
    getMetrics(tickets) {
        const total = tickets.length;
        if (total === 0) return null;

        const open = tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
        const overdue = tickets.filter(t => t.overdue && ['open', 'in_progress'].includes(t.status)).length;
        const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;

        // Tempo Médio de Resolução (apenas dos resolvidos)
        let totalTime = 0;
        let resolvedCount = 0;
        tickets.forEach(t => {
            if (t.resolvedAt && t.createdAt) {
                const start = new Date(t.createdAt);
                const end = new Date(t.resolvedAt);
                totalTime += (end - start);
                resolvedCount++;
            }
        });

        // Média em Horas
        const avgResolutionHours = resolvedCount > 0 ? Math.round((totalTime / resolvedCount) / (1000 * 60 * 60)) : 0;

        // SLA Compliance Rate
        const slaBreachedTotal = tickets.filter(t => t.overdue).length; // Inclui fechados que venceram
        const complianceRate = Math.round(((total - slaBreachedTotal) / total) * 100);

        return {
            total,
            open,
            overdue,
            resolved,
            avgResolutionHours,
            complianceRate
        };
    }
}