// Tickets UI Component - Interface para gerenciamento de tickets
import { TicketService } from '../services/ticketService.js';
import { showToast } from '../ui/toast.js';

export class TicketsUI {
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;
        this.ticketService = new TicketService();
        this.currentFilter = 'all';
        this.tickets = [];
        this.unsubscribe = null;
    }

    /**
     * Inicializa a UI de tickets
     */
    init() {
        this.bindEvents();
        this.loadTickets();
    }

    /**
     * Vincula eventos da UI
     */
    bindEvents() {
        // Filtros de tickets
        document.querySelectorAll('.ticket-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.updateFilterUI();
                this.renderTickets();
            });
        });

        // Novo ticket
        const newTicketBtn = document.getElementById('newTicketButton');
        if (newTicketBtn) {
            newTicketBtn.addEventListener('click', () => this.showNewTicketModal());
        }
    }

    /**
     * Carrega tickets do Firestore
     */
    loadTickets() {
        this.showLoading(true);

        const filters = {};
        if (this.currentFilter !== 'all') {
            filters.status = this.currentFilter;
        }

        this.unsubscribe = this.ticketService.listen((tickets) => {
            this.tickets = tickets;
            this.renderTickets();
            this.showLoading(false);
        }, filters);
    }

    /**
     * Renderiza a lista de tickets
     */
    renderTickets() {
        const container = document.getElementById('ticketsList');
        if (!container) return;

        const filteredTickets = this.filterTickets(this.tickets);

        if (filteredTickets.length === 0) {
            container.innerHTML = `
        <div class="text-center py-12 text-slate-400">
          <i class="fas fa-ticket-alt text-4xl mb-4"></i>
          <p>Nenhum ticket encontrado</p>
        </div>
      `;
            return;
        }

        container.innerHTML = filteredTickets.map(ticket => this.renderTicketCard(ticket)).join('');

        // Bind eventos dos cards
        this.bindTicketCardEvents();
    }

    /**
     * Filtra tickets baseado no filtro atual
     */
    filterTickets(tickets) {
        if (this.currentFilter === 'all') return tickets;
        return tickets.filter(t => t.status === this.currentFilter);
    }

    /**
     * Renderiza um card de ticket
     */
    renderTicketCard(ticket) {
        const priority = TicketService.formatPriority(ticket.priority);
        const status = TicketService.formatStatus(ticket.status);
        const createdAt = ticket.createdAt?.toDate ?
            ticket.createdAt.toDate().toLocaleDateString('pt-BR') :
            new Date(ticket.createdAt).toLocaleDateString('pt-BR');

        return `
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer ticket-card" data-ticket-id="${ticket.id}">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.class}">
                <i class="fas ${status.icon}"></i>
                ${status.text}
              </span>
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${priority.class}">
                <i class="fas ${priority.icon}"></i>
                ${priority.text}
              </span>
            </div>
            <h4 class="text-lg font-bold text-slate-900 mb-1">${ticket.title || 'Sem título'}</h4>
            <p class="text-sm text-slate-600 line-clamp-2">${ticket.description || 'Sem descrição'}</p>
          </div>
          <div class="ml-4">
            <button class="ticket-menu-btn p-2 hover:bg-slate-100 rounded-lg transition-colors" data-ticket-id="${ticket.id}">
              <i class="fas fa-ellipsis-v text-slate-400"></i>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-4">
            <span><i class="far fa-calendar mr-1"></i>${createdAt}</span>
            ${ticket.assignedTo ? `<span><i class="far fa-user mr-1"></i>Atribuído</span>` : ''}
            ${ticket.category ? `<span class="px-2 py-1 bg-slate-100 rounded">${this.formatCategory(ticket.category)}</span>` : ''}
          </div>
          <span class="text-slate-400">#${ticket.id.slice(-6)}</span>
        </div>
      </div>
    `;
    }

    /**
     * Formata categoria para exibição
     */
    formatCategory(category) {
        const categories = {
            general: 'Geral',
            technical: 'Técnico',
            billing: 'Faturamento',
            support: 'Suporte'
        };
        return categories[category] || category;
    }

    /**
     * Vincula eventos dos cards de ticket
     */
    bindTicketCardEvents() {
        // Click no card para abrir detalhes
        document.querySelectorAll('.ticket-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.ticket-menu-btn')) {
                    const ticketId = card.dataset.ticketId;
                    this.showTicketDetails(ticketId);
                }
            });
        });

        // Menu de ações
        document.querySelectorAll('.ticket-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const ticketId = btn.dataset.ticketId;
                this.showTicketMenu(ticketId, btn);
            });
        });
    }

    /**
     * Mostra modal de novo ticket
     */
    showNewTicketModal() {
        showToast('Funcionalidade em desenvolvimento', 'info');
        // TODO: Implementar modal de criação de ticket
    }

    /**
     * Mostra detalhes do ticket
     */
    showTicketDetails(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        showToast(`Ticket: ${ticket.title}`, 'info');
        // TODO: Implementar drawer de detalhes do ticket
    }

    /**
     * Mostra menu de ações do ticket
     */
    showTicketMenu(ticketId, buttonElement) {
        // TODO: Implementar menu dropdown com ações
        console.log('Menu para ticket:', ticketId);
    }

    /**
     * Atualiza UI dos filtros
     */
    updateFilterUI() {
        document.querySelectorAll('.ticket-filter-btn').forEach(btn => {
            const isActive = btn.dataset.filter === this.currentFilter;
            btn.classList.toggle('bg-primary-600', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-slate-100', !isActive);
            btn.classList.toggle('text-slate-700', !isActive);
        });
    }

    /**
     * Mostra/esconde loading
     */
    showLoading(show) {
        const container = document.getElementById('ticketsList');
        if (!container) return;

        if (show) {
            container.innerHTML = `
        <div class="space-y-4">
          ${[1, 2, 3].map(() => `
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div class="skeleton h-6 w-1/3 rounded mb-3"></div>
              <div class="skeleton h-4 w-full rounded mb-2"></div>
              <div class="skeleton h-4 w-2/3 rounded"></div>
            </div>
          `).join('')}
        </div>
      `;
        }
    }

    /**
     * Destrói a instância e limpa listeners
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}
