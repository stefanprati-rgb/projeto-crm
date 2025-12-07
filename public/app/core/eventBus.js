/**
 * Event Bus Global - Comunicação entre módulos
 * Implementa padrão pub/sub para desacoplamento
 * 
 * @example
 * const unsubscribe = bus.on('base:change', (baseName) => loadData(baseName));
 * bus.emit('base:change', 'EGS');
 * unsubscribe(); // cleanup
 */

class EventBus {
    constructor() {
        this.events = {};
        this.debugMode = false;
    }

    /**
     * Inscreve listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     * @param {Object} options - Opções { once: boolean }
     * @returns {Function} Função de unsubscribe
     */
    on(event, callback, options = {}) {
        if (!this.events[event]) {
            this.events[event] = new Map();
        }

        const id = Math.random().toString(36).substr(2, 9);

        // Wrapper para suportar 'once'
        const wrappedCallback = options.once
            ? (...args) => {
                callback(...args);
                this.off(event, id);
            }
            : callback;

        this.events[event].set(id, {
            callback: wrappedCallback,
            once: options.once || false
        });

        if (this.debugMode) {
            console.log(`[EventBus] Listener registrado: ${event} (${id})`);
        }

        // Retorna função de cleanup
        return () => this.off(event, id);
    }

    /**
     * Inscreve listener que executa apenas uma vez
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     * @returns {Function} Função de unsubscribe
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }

    /**
     * Remove listener específico ou todos de um evento
     * @param {string} event - Nome do evento
     * @param {string} [id] - ID do listener (opcional)
     */
    off(event, id) {
        if (!this.events[event]) return;

        if (id) {
            // Remove listener específico
            this.events[event].delete(id);

            if (this.debugMode) {
                console.log(`[EventBus] Listener removido: ${event} (${id})`);
            }

            // Limpa evento se não tem mais listeners
            if (this.events[event].size === 0) {
                delete this.events[event];
            }
        } else {
            // Remove todos os listeners do evento
            delete this.events[event];

            if (this.debugMode) {
                console.log(`[EventBus] Todos os listeners removidos: ${event}`);
            }
        }
    }

    /**
     * Emite evento para todos os listeners
     * @param {string} event - Nome do evento
     * @param {...any} args - Argumentos para os callbacks
     */
    emit(event, ...args) {
        const listeners = this.events[event];

        if (!listeners || listeners.size === 0) {
            if (this.debugMode) {
                console.warn(`[EventBus] Nenhum listener para: ${event}`);
            }
            return;
        }

        if (this.debugMode) {
            console.log(`[EventBus] Emitindo: ${event}`, args);
        }

        // Executa callbacks
        listeners.forEach(({ callback }, id) => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`[EventBus] Erro no listener ${event} (${id}):`, error);
            }
        });
    }

    /**
     * Emite evento de forma assíncrona
     * @param {string} event - Nome do evento
     * @param {...any} args - Argumentos para os callbacks
     */
    async emitAsync(event, ...args) {
        const listeners = this.events[event];

        if (!listeners || listeners.size === 0) {
            if (this.debugMode) {
                console.warn(`[EventBus] Nenhum listener para: ${event}`);
            }
            return;
        }

        if (this.debugMode) {
            console.log(`[EventBus] Emitindo async: ${event}`, args);
        }

        // Executa callbacks em paralelo
        const promises = Array.from(listeners.values()).map(({ callback }) => {
            return Promise.resolve().then(() => callback(...args));
        });

        try {
            await Promise.all(promises);
        } catch (error) {
            console.error(`[EventBus] Erro em listener async de ${event}:`, error);
        }
    }

    /**
     * Remove todos os listeners de todos os eventos
     */
    clear() {
        this.events = {};

        if (this.debugMode) {
            console.log('[EventBus] Todos os listeners removidos');
        }
    }

    /**
     * Lista eventos ativos
     * @returns {Array} Array com nomes dos eventos e contagem de listeners
     */
    getEvents() {
        return Object.keys(this.events).map(event => ({
            event,
            listeners: this.events[event].size
        }));
    }

    /**
     * Ativa/desativa modo debug
     * @param {boolean} enabled - Ativar debug
     */
    setDebug(enabled) {
        this.debugMode = enabled;
        console.log(`[EventBus] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Debug: mostra estado atual
     */
    debug() {
        console.log('[EventBus] Eventos ativos:', this.getEvents());
    }
}

// Singleton export
export const bus = new EventBus();

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
    window.__bus = bus;
}

/**
 * Eventos padrão do sistema (documentação)
 * 
 * DADOS:
 * - 'clients:loaded' - Clientes carregados (clients[])
 * - 'clients:updated' - Cliente atualizado (client)
 * - 'clients:deleted' - Cliente deletado (clientId)
 * - 'tickets:loaded' - Tickets carregados (tickets[])
 * - 'tickets:updated' - Ticket atualizado (ticket)
 * - 'tickets:created' - Ticket criado (ticket)
 * 
 * BASE:
 * - 'base:change' - Base alterada (baseName)
 * - 'base:refresh' - Forçar reload da base atual ()
 * 
 * UI:
 * - 'ui:loading' - Estado de loading (boolean)
 * - 'ui:error' - Erro ocorreu (error)
 * - 'ui:success' - Operação sucesso (message)
 * 
 * PAGINAÇÃO:
 * - 'pagination:next' - Carregar próxima página ()
 * - 'pagination:reset' - Resetar paginação ()
 * 
 * DASHBOARD:
 * - 'dashboard:refresh' - Atualizar dashboard ()
 * - 'finance:refresh' - Atualizar financeiro ()
 */
