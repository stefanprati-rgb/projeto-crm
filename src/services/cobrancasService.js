import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Serviço de Cobranças (Arquitetura V2)
 * Gerencia o histórico financeiro e travas de inadimplência
 */
export const cobrancasService = {
    /**
     * Retorna todas as cobranças da coleção cobrancas_chamados filtradas pelo ID do cliente
     */
    async getCobrancasByCliente(clienteId) {
        if (!clienteId) return [];
        const q = query(
            collection(db, 'cobrancas_chamados'),
            where('clienteId', '==', clienteId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Insere um novo documento na coleção cobrancas_chamados
     */
    async addCobranca(cobrancaData) {
        const cleanData = {
            ...cobrancaData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'cobrancas_chamados'), cleanData);
        return { id: docRef.id, ...cleanData };
    },

    /**
     * Atualiza apenas o campo status de uma cobrança específica
     */
    async updateStatusCobranca(cobrancaId, novoStatus) {
        const ref = doc(db, 'cobrancas_chamados', cobrancaId);
        await updateDoc(ref, {
            status: novoStatus,
            updatedAt: serverTimestamp()
        });
        return { id: cobrancaId, status: novoStatus };
    }
};
