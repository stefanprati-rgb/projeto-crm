import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth } from "../core/firebase.js";

export class LogService {
    constructor() {
        this.collectionName = 'audit_logs';
    }

    /**
     * Regista uma ação de auditoria no Firestore
     * @param {string} action - Tipo da ação: 'CREATE', 'UPDATE', 'DELETE', 'IMPORT'
     * @param {string} targetCollection - Coleção afetada (ex: 'clients')
     * @param {string} targetId - ID do documento afetado
     * @param {object} details - Detalhes opcionais (ex: campos alterados, nome do cliente)
     */
    async log(action, targetCollection, targetId, details = {}) {
        try {
            const user = auth.currentUser;

            const logEntry = {
                action,
                targetCollection,
                targetId,
                details,
                // Metadados de Auditoria
                userEmail: user ? user.email : 'system',
                userId: user ? user.uid : 'system',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent // Útil para saber se foi via mobile/desktop
            };

            // Grava numa coleção separada 'audit_logs'
            await addDoc(collection(db, this.collectionName), logEntry);

            console.log(`[Audit] ${action} registado para ${targetCollection}/${targetId}`);

        } catch (error) {
            // Falha silenciosa: O log não deve impedir a operação principal de funcionar
            console.error("[Audit] Erro ao gravar log:", error);
        }
    }
}

// Exporta uma instância única para ser usada em toda a app
export const auditLogger = new LogService();