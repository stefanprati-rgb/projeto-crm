import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Serviço de Eventos do Cliente
 * Gerencia timeline de interações e eventos relacionados ao cliente
 */
export const eventService = {
    /**
     * Adiciona um novo evento ao cliente
     * @param {string} clientId - ID do cliente
     * @param {string} type - Tipo do evento: 'note', 'call', 'whatsapp', 'promise', 'email', 'visit'
     * @param {string} description - Descrição do evento
     * @param {object} metaData - Dados adicionais (opcional)
     */
    async addEvent(clientId, type, description, metaData = {}) {
        const user = auth.currentUser;

        const event = {
            clientId,
            type,
            description,
            metaData,
            createdAt: serverTimestamp(),
            createdBy: user?.uid || null,
            createdByEmail: user?.email || 'Sistema',
        };

        const docRef = await addDoc(collection(db, 'client_events'), event);

        // Retorna o evento com ID e timestamp local (serverTimestamp será null até sincronizar)
        return {
            id: docRef.id,
            ...event,
            createdAt: new Date().toISOString(), // Timestamp local temporário
        };
    },

    /**
     * Busca eventos de um cliente
     * @param {string} clientId - ID do cliente
     * @param {number} maxLimit - Número máximo de eventos (padrão: 50)
     */
    async getEvents(clientId, maxLimit = 50) {
        const q = query(
            collection(db, 'client_events'),
            where('clientId', '==', clientId),
            orderBy('createdAt', 'desc'),
            limit(maxLimit)
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Converte Timestamp do Firestore para ISO string
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            };
        });
    },

    /**
     * Busca todos os eventos de múltiplos clientes
     * Útil para dashboard de atividades
     */
    async getRecentEvents(maxLimit = 100) {
        const q = query(
            collection(db, 'client_events'),
            orderBy('createdAt', 'desc'),
            limit(maxLimit)
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            };
        });
    },

    /**
     * Tipos de eventos disponíveis
     */
    EVENT_TYPES: {
        NOTE: 'note',
        CALL: 'call',
        WHATSAPP: 'whatsapp',
        PROMISE: 'promise',
        EMAIL: 'email',
        VISIT: 'visit',
    },

    /**
     * Labels dos tipos de eventos
     */
    EVENT_LABELS: {
        note: 'Anotação',
        call: 'Ligação',
        whatsapp: 'WhatsApp',
        promise: 'Promessa de Pagamento',
        email: 'E-mail',
        visit: 'Visita',
    },
};
