export const DB_NAME = 'crm_persistence';
export const STORE_NAME = 'pagination_cursors';
export const DB_VERSION = 1;

/**
 * Abre (ou cria) o banco de dados IndexedDB.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('[IndexedDB] Erro ao abrir banco:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Salva um cursor (ou qualquer valor) no IndexedDB.
 * @param {string} key - Chave única (ex: 'clients_PROJECT_A_cursor').
 * @param {object} value - Valor a ser salvo (ex: { docId: '...', createdAt: '...' }).
 */
export async function setCursor(key, value) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('[IndexedDB] Falha ao salvar cursor:', e);
    }
}

/**
 * Recupera um cursor.
 * @param {string} key 
 */
export async function getCursor(key) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error('[IndexedDB] Falha ao ler cursor:', e);
        return null;
    }
}

/**
 * Remove um cursor específico.
 */
export async function clearCursor(key) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('[IndexedDB] Falha ao limpar cursor:', e);
    }
}
