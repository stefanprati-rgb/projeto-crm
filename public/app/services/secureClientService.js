/**
 * Exemplo de Integração Completa do Sistema de Segurança
 * 
 * Este arquivo demonstra como integrar todos os componentes de segurança
 * em um fluxo real de criação/edição de cliente.
 */

import { DataEncryption } from '../utils/encryption.js';
import { dbRateLimiter } from '../utils/rateLimiter.js';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const db = getFirestore();
const crypto = new DataEncryption();

// ============================================
// GERENCIAMENTO DE CHAVE DE CRIPTOGRAFIA
// ============================================

/**
 * Obtém ou cria a chave de criptografia do usuário
 * IMPORTANTE: Em produção, use Firebase Auth Custom Claims ou Firestore seguro
 */
async function getUserEncryptionKey() {
    const userId = getAuth().currentUser.uid;

    // Tenta recuperar do IndexedDB
    let key = await getFromIndexedDB(`encryptionKey_${userId}`);

    if (!key) {
        // Gera nova chave
        key = await crypto.generateKey();

        // Armazena localmente (ATENÇÃO: vulnerável a XSS)
        await saveToIndexedDB(`encryptionKey_${userId}`, key);

        // TODO: Em produção, salvar também no backend via Cloud Function
        // await saveKeyToBackend(userId, key);
    }

    return key;
}

// ============================================
// CRIAÇÃO DE CLIENTE COM SEGURANÇA COMPLETA
// ============================================

/**
 * Salva cliente com criptografia, rate limiting e validação
 */
export async function saveClientSecure(clientData) {
    const userId = getAuth().currentUser.uid;

    try {
        // 1. RATE LIMITING: Previne spam
        return await dbRateLimiter.throttle(userId, async () => {

            // 2. VALIDAÇÃO: Garante dados corretos
            validateClientData(clientData);

            // 3. CRIPTOGRAFIA: Protege dados sensíveis
            const key = await getUserEncryptionKey();
            const encryptedData = await encryptSensitiveFields(clientData, key);

            // 4. METADATA: Adiciona campos de auditoria
            const finalData = {
                ...encryptedData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userId,
                updatedBy: userId,
                status: clientData.status || 'ATIVO'
            };

            // 5. SALVAR NO FIRESTORE
            const clientRef = doc(db, 'clients', clientData.id || generateId());
            await setDoc(clientRef, finalData);

            // 6. LOG DE AUDITORIA
            await logAudit(userId, 'CLIENT_CREATED', {
                clientId: clientRef.id,
                clientName: clientData.name
            });

            return clientRef.id;
        });

    } catch (error) {
        if (error.message.includes('Limite de requisições')) {
            throw new Error('Você está fazendo muitas requisições. Aguarde alguns minutos.');
        }
        throw error;
    }
}

// ============================================
// LEITURA DE CLIENTE COM DESCRIPTOGRAFIA
// ============================================

/**
 * Recupera cliente e descriptografa dados sensíveis
 */
export async function getClientSecure(clientId) {
    try {
        const clientRef = doc(db, 'clients', clientId);
        const clientSnap = await getDoc(clientRef);

        if (!clientSnap.exists()) {
            throw new Error('Cliente não encontrado');
        }

        const data = clientSnap.data();

        // Descriptografa campos sensíveis
        const key = await getUserEncryptionKey();
        const decryptedData = await decryptSensitiveFields(data, key);

        return {
            id: clientSnap.id,
            ...decryptedData
        };

    } catch (error) {
        console.error('Erro ao recuperar cliente:', error);
        throw error;
    }
}

// ============================================
// ATUALIZAÇÃO DE CLIENTE
// ============================================

/**
 * Atualiza cliente com validação de campos permitidos
 */
export async function updateClientSecure(clientId, updates) {
    const userId = getAuth().currentUser.uid;

    try {
        return await dbRateLimiter.throttle(userId, async () => {

            // Valida que apenas campos permitidos estão sendo atualizados
            const allowedFields = ['name', 'email', 'status', 'phone', 'address'];
            const invalidFields = Object.keys(updates).filter(
                field => !allowedFields.includes(field)
            );

            if (invalidFields.length > 0) {
                throw new Error(`Campos não permitidos: ${invalidFields.join(', ')}`);
            }

            // Criptografa campos sensíveis
            const key = await getUserEncryptionKey();
            const encryptedUpdates = await encryptSensitiveFields(updates, key);

            // Adiciona metadata
            const finalUpdates = {
                ...encryptedUpdates,
                updatedAt: serverTimestamp(),
                updatedBy: userId
            };

            // Atualiza no Firestore
            const clientRef = doc(db, 'clients', clientId);
            await setDoc(clientRef, finalUpdates, { merge: true });

            // Log de auditoria
            await logAudit(userId, 'CLIENT_UPDATED', {
                clientId,
                updatedFields: Object.keys(updates)
            });

            return clientId;
        });

    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        throw error;
    }
}

// ============================================
// SOFT DELETE (Nunca deletar diretamente)
// ============================================

/**
 * Marca cliente como deletado (soft delete)
 */
export async function deleteClientSecure(clientId) {
    const userId = getAuth().currentUser.uid;

    try {
        return await dbRateLimiter.throttle(userId, async () => {

            const clientRef = doc(db, 'clients', clientId);
            await setDoc(clientRef, {
                status: 'DELETED',
                deletedAt: serverTimestamp(),
                deletedBy: userId,
                updatedAt: serverTimestamp(),
                updatedBy: userId
            }, { merge: true });

            await logAudit(userId, 'CLIENT_DELETED', { clientId });

            return clientId;
        });

    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        throw error;
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Criptografa campos sensíveis (CPF/CNPJ, RG, etc.)
 */
async function encryptSensitiveFields(data, key) {
    const sensitiveFields = ['cpfCnpj', 'rg', 'birthDate'];
    const result = { ...data };

    for (const field of sensitiveFields) {
        if (data[field]) {
            result[field] = await crypto.encrypt(String(data[field]), key);
        }
    }

    return result;
}

/**
 * Descriptografa campos sensíveis
 */
async function decryptSensitiveFields(data, key) {
    const sensitiveFields = ['cpfCnpj', 'rg', 'birthDate'];
    const result = { ...data };

    for (const field of sensitiveFields) {
        if (data[field] && typeof data[field] === 'object' && data[field].ciphertext) {
            result[field] = await crypto.decrypt(data[field], key);
        }
    }

    return result;
}

/**
 * Valida dados do cliente
 */
function validateClientData(data) {
    if (!data.name || data.name.trim().length === 0) {
        throw new Error('Nome é obrigatório');
    }

    if (!data.email || !data.email.match(/.*@.*\..*/)) {
        throw new Error('Email inválido');
    }

    if (data.cpfCnpj) {
        const cleaned = data.cpfCnpj.replace(/\D/g, '');
        if (cleaned.length !== 11 && cleaned.length !== 14) {
            throw new Error('CPF/CNPJ inválido');
        }
    }
}

/**
 * Cria log de auditoria
 */
async function logAudit(userId, action, details) {
    try {
        const ip = await fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(d => d.ip)
            .catch(() => 'unknown');

        const logRef = doc(collection(db, 'audit_logs'));
        await setDoc(logRef, {
            userId,
            action,
            details,
            timestamp: serverTimestamp(),
            ip,
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Falha ao criar log de auditoria:', error);
    }
}

/**
 * Gera ID único
 */
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// HELPERS DE INDEXEDDB (Simplificado)
// ============================================

async function saveToIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CRM_Security', 1);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('keys')) {
                db.createObjectStore('keys');
            }
        };

        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('keys', 'readwrite');
            const store = tx.objectStore('keys');

            // Exporta a chave para formato armazenável
            crypto.subtle.exportKey('jwk', value).then(exportedKey => {
                store.put(exportedKey, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        };

        request.onerror = () => reject(request.error);
    });
}

async function getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CRM_Security', 1);

        request.onsuccess = (e) => {
            const db = e.target.result;

            if (!db.objectStoreNames.contains('keys')) {
                resolve(null);
                return;
            }

            const tx = db.transaction('keys', 'readonly');
            const store = tx.objectStore('keys');
            const getRequest = store.get(key);

            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    // Importa a chave de volta
                    crypto.subtle.importKey(
                        'jwk',
                        getRequest.result,
                        { name: 'AES-GCM' },
                        true,
                        ['encrypt', 'decrypt']
                    ).then(resolve).catch(reject);
                } else {
                    resolve(null);
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        };

        request.onerror = () => reject(request.error);
    });
}
