/**
 * ListenerManager - Gerenciador de Event Listeners
 * 
 * Previne memory leaks removendo automaticamente listeners ao trocar de página.
 * Essencial para SPAs (Single Page Applications) que não recarregam a página.
 */

export class ListenerManager {
    constructor() {
        this.listeners = new Map();
        this.currentPage = null;
        this.debugMode = false; // Ativar para logs detalhados
    }

    /**
     * Adiciona um event listener rastreado
     * 
     * @param {HTMLElement} element - Elemento DOM
     * @param {string} event - Nome do evento (click, change, etc)
     * @param {Function} handler - Função callback
     * @param {string} page - Nome da página (opcional, usa currentPage se não fornecido)
     */
    add(element, event, handler, page = this.currentPage) {
        if (!element) {
            console.warn('⚠️ ListenerManager: Tentativa de adicionar listener a elemento null');
            return;
        }

        // Gera chave única para o listener
        const elementId = element.id || element.dataset?.listenerId || this._generateId();
        const key = `${page}_${elementId}_${event}`;

        // Remove listener anterior se existir (previne duplicatas)
        if (this.listeners.has(key)) {
            const old = this.listeners.get(key);
            old.element.removeEventListener(old.event, old.handler);

            if (this.debugMode) {
                console.log(`🔄 ListenerManager: Substituindo listener ${key}`);
            }
        }

        // Adiciona novo listener
        element.addEventListener(event, handler);
        this.listeners.set(key, { element, event, handler, page });

        if (this.debugMode) {
            console.log(`✅ ListenerManager: Adicionado ${key} (Total: ${this.listeners.size})`);
        }
    }

    /**
     * Remove todos os listeners de uma página específica
     * 
     * @param {string} page - Nome da página
     */
    cleanupPage(page) {
        const toRemove = [];

        this.listeners.forEach((listener, key) => {
            if (listener.page === page) {
                // Remove o listener do DOM
                listener.element.removeEventListener(listener.event, listener.handler);
                toRemove.push(key);
            }
        });

        // Remove do Map
        toRemove.forEach(key => this.listeners.delete(key));

        console.log(`🧹 ListenerManager: Cleanup de "${page}" - ${toRemove.length} listeners removidos`);

        if (this.debugMode && toRemove.length > 0) {
            console.log('Listeners removidos:', toRemove);
        }
    }

    /**
     * Define a página atual e faz cleanup da página anterior
     * 
     * @param {string} page - Nome da nova página
     */
    setCurrentPage(page) {
        if (this.currentPage && this.currentPage !== page) {
            this.cleanupPage(this.currentPage);
        }

        this.currentPage = page;

        if (this.debugMode) {
            console.log(`📄 ListenerManager: Página atual = "${page}"`);
        }
    }

    /**
     * Remove um listener específico
     * 
     * @param {HTMLElement} element - Elemento DOM
     * @param {string} event - Nome do evento
     * @param {string} page - Nome da página (opcional)
     */
    remove(element, event, page = this.currentPage) {
        if (!element) return;

        const elementId = element.id || element.dataset?.listenerId;
        const key = `${page}_${elementId}_${event}`;

        if (this.listeners.has(key)) {
            const listener = this.listeners.get(key);
            listener.element.removeEventListener(listener.event, listener.handler);
            this.listeners.delete(key);

            if (this.debugMode) {
                console.log(`🗑️ ListenerManager: Removido ${key}`);
            }
        }
    }

    /**
     * Remove TODOS os listeners (use com cuidado!)
     */
    cleanupAll() {
        this.listeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });

        const count = this.listeners.size;
        this.listeners.clear();

        console.log(`🧹 ListenerManager: Cleanup total - ${count} listeners removidos`);
    }

    /**
     * Retorna estatísticas de uso
     */
    getStats() {
        const stats = {
            total: this.listeners.size,
            currentPage: this.currentPage,
            byPage: {}
        };

        this.listeners.forEach(listener => {
            const page = listener.page || 'unknown';
            stats.byPage[page] = (stats.byPage[page] || 0) + 1;
        });

        return stats;
    }

    /**
     * Ativa/desativa modo debug
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 ListenerManager: Debug mode ${enabled ? 'ATIVADO' : 'DESATIVADO'}`);
    }

    /**
     * Gera ID único para elementos sem ID
     */
    _generateId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Exporta instância singleton para uso global
export const listenerManager = new ListenerManager();

// Adiciona método helper global para debug
if (typeof window !== 'undefined') {
    window.debugListeners = () => {
        const stats = listenerManager.getStats();
        console.log('📊 Estatísticas de Listeners:', stats);
        return stats;
    };
}
