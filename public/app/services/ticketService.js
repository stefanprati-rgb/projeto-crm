import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth } from "../core/firebase.js";

export class TicketService {
    constructor() {
        // Tickets ficam em: clients/{id}/tickets
    }

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
     * Lista tickets do cliente em tempo real
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