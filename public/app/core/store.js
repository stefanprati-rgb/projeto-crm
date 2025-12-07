/**
 * Store Pattern Reativo - Centraliza estado global do CRM
 * Usa Proxy para reatividade automática e batch updates
 * 
 * @example
 * store.set('clients', data);
 * store.subscribe('clients', renderTable);
 * const clients = store.get('clients');
 */

class ReactiveStore {
    constructor() {
        // Estado inicial mínimo
        this._state = {
            clients: [],
            tickets: [],
            currentBase: localStorage.getItem('currentBase') || 'TODOS',
            ui: {
                loading: false,
                loadingMessage: '',
                error: null
            },
            pagination: {
                hasMore: false,
                isLoading: false,
                currentPage: 1
            },
            user: {
                role: 'visualizador',
                allowedBases: []
            },
            dashboard: {
                metrics: null,
                finance: null
            }
        };

        // Listeners por chave de estado
        this._listeners = {};

        // Batch update queue
        this._batchQueue = [];
        this._batchTimeout = null;

        // Cria Proxy para reatividade automática
        this.state = new Proxy(this._state, {
            set: (target, property, value) => {
                const oldValue = target[property];

                // Atualiza valor
                target[property] = value;

                // Dispara listeners se valor mudou
                if (oldValue !== value) {
                    this._notify(property, value, oldValue);
                }

                return true;
            },

            get: (target, property) => {
                return target[property];
            }
        });
    }

    /**
     * Obtém valor do estado
     * @param {string} key - Chave do estado
     * @returns {any} Valor do estado
     */
    get(key) {
        if (key.includes('.')) {
            // Suporta acesso aninhado: 'ui.loading'
            return key.split('.').reduce((obj, k) => obj?.[k], this._state);
        }
        return this._state[key];
    }

    /**
     * Define valor do estado e dispara listeners
     * @param {string} key - Chave do estado
     * @param {any} value - Novo valor
     */
    set(key, value) {
        if (key.includes('.')) {
            // Suporta set aninhado: 'ui.loading'
            const keys = key.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((obj, k) => {
                if (!obj[k]) obj[k] = {};
                return obj[k];
            }, this._state);

            const oldValue = target[lastKey];
            target[lastKey] = value;

            if (oldValue !== value) {
                this._notify(key, value, oldValue);
            }
        } else {
            // Set direto
            this.state[key] = value;
        }
    }

    /**
     * Batch updates - agrupa múltiplas atualizações
     * @param {Object} updates - Objeto com chave: valor
     * @example store.batch({ clients: [], 'ui.loading': false })
     */
    batch(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this._batchQueue.push({ key, value });
        });

        // Debounce: executa após 10ms
        if (this._batchTimeout) {
            clearTimeout(this._batchTimeout);
        }

        this._batchTimeout = setTimeout(() => {
            this._processBatch();
        }, 10);
    }

    /**
     * Processa fila de batch updates
     * @private
     */
    _processBatch() {
        const queue = [...this._batchQueue];
        this._batchQueue = [];

        queue.forEach(({ key, value }) => {
            this.set(key, value);
        });
    }

    /**
     * Inscreve listener para mudanças em uma chave
     * @param {string} key - Chave do estado
     * @param {Function} callback - Função callback (newValue, oldValue)
     * @returns {Function} Função de unsubscribe
     */
    subscribe(key, callback) {
        if (!this._listeners[key]) {
            this._listeners[key] = new Map();
        }

        const id = Math.random().toString(36).substr(2, 9);
        this._listeners[key].set(id, callback);

        // Retorna função de cleanup
        return () => {
            this._listeners[key]?.delete(id);
        };
    }

    /**
     * Remove todos os listeners de uma chave
     * @param {string} key - Chave do estado
     */
    unsubscribe(key) {
        if (this._listeners[key]) {
            this._listeners[key].clear();
        }
    }

    /**
     * Notifica listeners sobre mudança
     * @private
     */
    _notify(key, newValue, oldValue) {
        const listeners = this._listeners[key];
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`[Store] Erro em listener de '${key}':`, error);
                }
            });
        }
    }

    /**
     * Reseta estado para valores iniciais
     */
    reset() {
        this.batch({
            clients: [],
            tickets: [],
            'ui.loading': false,
            'ui.error': null,
            'pagination.hasMore': false,
            'pagination.isLoading': false,
            'dashboard.metrics': null,
            'dashboard.finance': null
        });
    }

    /**
     * Debug: mostra estado atual
     */
    debug() {
        console.log('[Store] Estado atual:', JSON.parse(JSON.stringify(this._state)));
        console.log('[Store] Listeners ativos:', Object.keys(this._listeners).map(key => ({
            key,
            count: this._listeners[key].size
        })));
    }

    /**
     * Persiste chave no localStorage
     * @param {string} key - Chave do estado
     */
    persist(key) {
        const value = this.get(key);
        localStorage.setItem(`store_${key}`, JSON.stringify(value));
    }

    /**
     * Restaura chave do localStorage
     * @param {string} key - Chave do estado
     */
    restore(key) {
        const stored = localStorage.getItem(`store_${key}`);
        if (stored) {
            try {
                this.set(key, JSON.parse(stored));
            } catch (error) {
                console.error(`[Store] Erro ao restaurar '${key}':`, error);
            }
        }
    }
}

// Singleton export
export const store = new ReactiveStore();

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
    window.__store = store;
}
