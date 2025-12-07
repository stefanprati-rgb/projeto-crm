/**
 * Exemplo de Integração Store + Event Bus no CRMApp
 * 
 * Este arquivo demonstra como integrar o store reativo e event bus
 * com o aplicativo CRM existente.
 */

import { store } from './store.js';
import { bus } from './eventBus.js';

/**
 * Inicializa listeners do store para reatividade automática
 */
export function initStoreListeners() {

    // 1. CLIENTS - Atualiza tabela quando clientes mudam
    const unsubClients = store.subscribe('clients', (newClients, oldClients) => {
        console.log('[Store] Clients atualizados:', newClients.length);

        // Renderiza tabela automaticamente
        if (window.clientsTable) {
            window.clientsTable.render(newClients);
        }
    });

    // 2. TICKETS - Atualiza dashboard quando tickets mudam
    const unsubTickets = store.subscribe('tickets', (newTickets) => {
        console.log('[Store] Tickets atualizados:', newTickets.length);

        // Atualiza métricas do dashboard
        if (window.crmApp) {
            window.crmApp.updateDashboard();
        }
    });

    // 3. CURRENT BASE - Recarrega dados quando base muda
    const unsubBase = store.subscribe('currentBase', (newBase, oldBase) => {
        console.log('[Store] Base alterada:', oldBase, '->', newBase);

        // Persiste no localStorage
        store.persist('currentBase');

        // Emite evento para recarregar dados
        bus.emit('base:change', newBase);
    });

    // 4. UI LOADING - Atualiza indicadores de loading
    const unsubLoading = store.subscribe('ui.loading', (isLoading) => {
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = isLoading ? 'block' : 'none';
        }
    });

    // 5. PAGINATION - Atualiza botão "Carregar Mais"
    const unsubPagination = store.subscribe('pagination.hasMore', (hasMore) => {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = !hasMore;
            loadMoreBtn.textContent = hasMore ? 'Carregar Mais' : 'Todos os registros carregados';
        }
    });

    // Retorna função de cleanup para remover todos os listeners
    return () => {
        unsubClients();
        unsubTickets();
        unsubBase();
        unsubLoading();
        unsubPagination();
    };
}

/**
 * Inicializa event bus listeners para comunicação entre módulos
 */
export function initEventBusListeners(crmApp) {

    // 1. BASE CHANGE - Recarrega dados da nova base
    bus.on('base:change', async (baseName) => {
        console.log('[EventBus] Carregando base:', baseName);

        store.batch({
            'ui.loading': true,
            'ui.loadingMessage': `Carregando ${baseName}...`,
            clients: [],
            tickets: []
        });

        try {
            await crmApp.loadDataForBase(baseName);
            bus.emit('ui:success', `Base ${baseName} carregada`);
        } catch (error) {
            bus.emit('ui:error', `Erro ao carregar base: ${error.message}`);
        }
    });

    // 2. BASE REFRESH - Força reload da base atual
    bus.on('base:refresh', async () => {
        const currentBase = store.get('currentBase');
        console.log('[EventBus] Recarregando base atual:', currentBase);
        bus.emit('base:change', currentBase);
    });

    // 3. PAGINATION NEXT - Carrega próxima página
    bus.on('pagination:next', async () => {
        if (store.get('pagination.isLoading')) return;

        store.set('pagination.isLoading', true);

        try {
            await crmApp.loadNextPage();
        } catch (error) {
            bus.emit('ui:error', 'Erro ao carregar próxima página');
        } finally {
            store.set('pagination.isLoading', false);
        }
    });

    // 4. PAGINATION RESET - Reseta paginação
    bus.on('pagination:reset', () => {
        store.batch({
            'pagination.currentPage': 1,
            'pagination.hasMore': false,
            clients: []
        });
    });

    // 5. DASHBOARD REFRESH - Atualiza dashboard
    bus.on('dashboard:refresh', () => {
        console.log('[EventBus] Atualizando dashboard...');
        crmApp.updateDashboard();
    });

    // 6. FINANCE REFRESH - Atualiza financeiro
    bus.on('finance:refresh', () => {
        console.log('[EventBus] Atualizando financeiro...');
        crmApp.updateFinance();
    });

    // 7. UI SUCCESS - Mostra toast de sucesso
    bus.on('ui:success', (message) => {
        console.log('[EventBus] Sucesso:', message);
        if (window.showToast) {
            window.showToast(message, 'success');
        }
    });

    // 8. UI ERROR - Mostra toast de erro
    bus.on('ui:error', (message) => {
        console.error('[EventBus] Erro:', message);
        if (window.showToast) {
            window.showToast(message, 'error');
        }
    });

    // 9. CLIENTS LOADED - Log quando clientes são carregados
    bus.on('clients:loaded', (clients) => {
        console.log('[EventBus] Clientes carregados:', clients.length);
    });

    // 10. TICKETS LOADED - Log quando tickets são carregados
    bus.on('tickets:loaded', (tickets) => {
        console.log('[EventBus] Tickets carregados:', tickets.length);
    });
}

/**
 * Exemplo de uso no CRMApp.init()
 * 
 * async init() {
 *   // ... código existente ...
 *   
 *   // Inicializa store e event bus
 *   this.cleanupStore = initStoreListeners();
 *   initEventBusListeners(this);
 *   
 *   // Restaura estado do localStorage
 *   store.restore('currentBase');
 *   
 *   // Carrega base inicial
 *   const initialBase = store.get('currentBase');
 *   bus.emit('base:change', initialBase);
 * }
 * 
 * destroy() {
 *   // Cleanup
 *   if (this.cleanupStore) {
 *     this.cleanupStore();
 *   }
 *   bus.clear();
 * }
 */

/**
 * Exemplo de uso em componentes
 * 
 * // Botão de trocar base
 * document.getElementById('base-selector').addEventListener('change', (e) => {
 *   const newBase = e.target.value;
 *   store.set('currentBase', newBase);
 *   // O listener do store automaticamente emite 'base:change'
 * });
 * 
 * // Botão de carregar mais
 * document.getElementById('load-more-btn').addEventListener('click', () => {
 *   bus.emit('pagination:next');
 * });
 * 
 * // Botão de refresh
 * document.getElementById('refresh-btn').addEventListener('click', () => {
 *   bus.emit('base:refresh');
 * });
 * 
 * // Salvar cliente com optimistic update
 * async function saveClient(clientData) {
 *   // O ClientService já faz optimistic update automaticamente
 *   await clientService.save(clientData.id, clientData);
 *   // UI já foi atualizada antes do Firebase responder!
 * }
 */

/**
 * Debug helpers
 */
export function debugStore() {
    console.log('=== STORE DEBUG ===');
    store.debug();
    console.log('===================');
}

export function debugBus() {
    console.log('=== EVENT BUS DEBUG ===');
    bus.debug();
    console.log('=======================');
}

// Expõe debug helpers globalmente
if (typeof window !== 'undefined') {
    window.debugStore = debugStore;
    window.debugBus = debugBus;
}
