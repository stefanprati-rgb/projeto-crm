import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth } from "../core/firebase.js";

export class TimelineService {
    constructor() {
        // Timeline é uma subcoleção: clients/{id}/timeline
    }

    /**
     * Adiciona uma nova interação na timeline do cliente
     * @param {string} clientId - ID do documento do cliente
     * @param {string} type - Tipo: 'whatsapp', 'call', 'email', 'note', 'meeting'
     * @param {string} content - Resumo ou detalhes da interação
     */
    async addActivity(clientId, type, content) {
        if (!clientId) throw new Error("Client ID is required");
        if (!content) throw new Error("Content is required");

        const user = auth.currentUser;
        const path = `clients/${clientId}/timeline`;

        const activity = {
            type,
            content,
            createdBy: user ? user.email : 'Sistema',
            createdById: user ? user.uid : null,
            createdAt: new Date().toISOString(), // Para ordenação visual imediata
            timestamp: serverTimestamp() // Para ordenação real no servidor
        };

        await addDoc(collection(db, path), activity);
    }

    /**
     * Escuta a timeline de um cliente em tempo real
     * @param {string} clientId 
     * @param {function} onData - Callback com array de atividades
     */
    listenToTimeline(clientId, onData) {
        if (!clientId) return null;

        const path = `clients/${clientId}/timeline`;
        // Ordena por data (mais recente no topo)
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const activities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            onData(activities);
        });
    }
}