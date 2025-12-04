import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    collectionGroup // Importado para Collection Group Query (para listar todos)
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth } from "../core/firebase.js";

export class TicketService {
    constructor() {
        // Tickets ficam em: clients/{id}/tickets
    }

    // --- STATIC HELPERS (Necessários para ticketsUI.js) ---
    static formatPriority(priority) {
        switch (priority) {
            case 'high': return { text: 'Alta', icon: 'fa-chevron-up', class: 'bg-rose-50 text-rose-600' };
            case 'medium': return { text: 'Média', icon: 'fa-minus', class: 'bg-amber-50 text-amber-600' };
            default: return { text: 'Baixa', icon: 'fa-chevron-down', class: 'bg-slate-100 text-slate-500' };
        }
    }

    static formatStatus(status) {
        switch (status) {
            case 'open': return { text: 'Aberto', icon: 'fa-envelope-open-text', class: 'bg-blue-50 text-blue-600' };
            case 'in_progress': return { text: 'Em Andamento', icon: 'fa-spinner fa-spin', class: 'bg-amber-50 text-amber-600' };
            case 'resolved': return { text: 'Resolvido', icon: 'fa-check-double', class: 'bg-emerald-50 text-emerald-600' };
            case 'closed': return { text: 'Fechado', icon: 'fa-check', class: 'bg-slate-100 text-slate-500' };
            default: return { text: 'N/A', icon: 'fa-question', class: 'bg-slate-100 text-slate-500' };
        }
    }

    // --- MÉTODOS DE DADOS ---

    /**
     * Abre um novo ticket para o cliente
     */
    async createTicket(clientId, ticketData) {
        if (!clientId) throw new Error("Client ID obrigatório");

        const user = auth.currentUser;
        const path = `clients/${clientId}/tickets`;

        // Gera um número de protocolo simples (Timestamp + Random)
        const protocol = 'T' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);

        const ticket = {
            protocol: protocol,
            subject: ticketData.subject,
            description: ticketData.description || '',
            category: ticketData.category || 'faturamento', // faturamento, cadastro, tecnico, outros
            priority: ticketData.priority || 'medium',
            status: 'open', // open, in_progress, resolved, closed

            openedBy: user ? user.uid : null,
            openedByEmail: user ? user.email : 'Sistema',

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timestamp: serverTimestamp()
        };

        return await addDoc(collection(db, path), ticket);
    }

    /**
     * Atualiza o status do ticket
     */
    async updateStatus(clientId, ticketId, newStatus) {
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);

        await updateDoc(ref, {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Lista tickets DE TODOS OS CLIENTES em tempo real para o Dashboard.
     * (Collection Group Query - Requer índice no Firestore)
     */
    listen(onData, filters = {}) {
        // Query o Collection Group 'tickets' (subcoleção)
        let q = query(collectionGroup(db, 'tickets'), orderBy('createdAt', 'desc'));

        // A filtragem por status é feita em ticketsUI.js para não exigir índice composto extra.

        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                clientId: doc.ref.parent.parent.id, // Adiciona o ID do Cliente pai
                ...doc.data()
            }));
            onData(tickets);
        });
    }


    /**
     * Lista tickets do cliente em tempo real (Mantido para a tela de detalhes do cliente)
     */
    listenToClientTickets(clientId, onData) {
        if (!clientId) return null;

        const path = `clients/${clientId}/tickets`;
        // Ordena por data de criação (mais recentes primeiro)
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            onData(tickets);
        });
    }
}