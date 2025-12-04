import { TicketService } from '../services/ticketService.js';
import { KBService } from '../services/kbService.js';
import { showToast } from '../ui/toast.js';
import { showButtonLoading } from '../ui/loadingStates.js';
import { debounce } from '../utils/helpers.js';

export class TicketsUI {
  constructor(db, auth) {
    this.db = db;
    this.auth = auth;
    this.ticketService = new TicketService();
    this.kbService = new KBService();

    this.currentFilter = 'all';
    this.tickets = [];
    this.unsubscribe = null;

    // Garante que o modal exista no DOM
    this._injectCreateModal();
  }

  init() {
    this.bindEvents();
    this.loadTickets();

    // Carrega sugestões iniciais (Populares) na KB
    this.searchKB('');
  }

  bindEvents() {
    // Filtros
    document.querySelectorAll('.ticket-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentFilter = e.target.dataset.filter;
        this.updateFilterUI();
        this.renderTickets();
      });
    });

    // Botão Novo Ticket
    const newTicketBtn = document.getElementById('newTicketButton');
    if (newTicketBtn) {
      newTicketBtn.onclick = () => this.openModal();
    }

    // Eventos do Modal
    const form = document.getElementById('createTicketForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleCreate(e));
    }

    const closeBtn = document.getElementById('closeTicketModal');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeModal();
    }

    // Cálculo de SLA
    const prioritySelect = document.getElementById('ticketPriority');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => this.updateSLAPreview(e.target.value));
    }

    // --- BUSCA MÁGICA NA KB ---
    const subjectInput = document.getElementById('ticketSubject');
    if (subjectInput) {
      // Debounce para não bombardear o Firestore
      subjectInput.addEventListener('input', debounce((e) => {
        const term = e.target.value;
        this.searchKB(term);
      }, 500));
    }
  }

  loadTickets() {
    this.showLoading(true);
    this.unsubscribe = this.ticketService.listen((tickets) => {
      this.tickets = tickets;
      this.renderTickets();
      this.showLoading(false);
    });
  }

  // --- Knowledge Base Logic ---

  async searchKB(term) {
    const container = document.getElementById('kbResults');
    if (!container) return;

    // Estado de loading local na KB
    container.innerHTML = `
            <div class="flex items-center justify-center py-4 text-slate-400">
                <i class="fas fa-circle-notch fa-spin mr-2"></i> Buscando...
            </div>`;

    try {
      const results = await this.kbService.searchArticles(term);
      this.renderKBResults(results, term);
    } catch (error) {
      console.error(error);
      container.innerHTML = `<p class="text-xs text-red-400 text-center">Erro ao buscar sugestões.</p>`;
    }
  }

  renderKBResults(articles, term) {
    const container = document.getElementById('kbResults');
    if (!container) return;

    if (articles.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 opacity-60">
                    <i class="fas fa-search text-2xl text-slate-300 mb-2"></i>
                    <p class="text-xs text-slate-500">Nenhum artigo encontrado para "${term}"</p>
                </div>`;
      return;
    }

    const titleText = term ? `Resultados para "${term}"` : 'Sugestões Populares';

    let html = `<p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">${titleText}</p>`;

    html += articles.map(art => `
            <div class="group p-3 bg-white rounded border border-slate-200 shadow-sm cursor-pointer hover:border-primary-400 hover:shadow-md transition-all mb-3" onclick="window.crmApp.openArticle('${art.id}')">
                <div class="flex justify-between items-start mb-1">
                    <p class="text-xs font-bold text-slate-700 group-hover:text-primary-700 leading-tight">${art.title}</p>
                    <i class="fas fa-chevron-right text-[10px] text-slate-300 group-hover:text-primary-400"></i>
                </div>
                <div class="flex items-center gap-2 mt-2">
                    <span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-medium uppercase">${art.category || 'Geral'}</span>
                    <span class="text-[9px] text-slate-400 flex items-center">
                        <i class="far fa-clock mr-1"></i> ${art.readTime || '2 min'}
                    </span>
                </div>
                ${term ? `<p class="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">${art.content}</p>` : ''}
            </div>
        `).join('');

    container.innerHTML = html;
  }

  // --- Ticket Rendering Logic (Mantida) ---

  renderTickets() {
    const container = document.getElementById('ticketsList');
    if (!container) return;

    const filtered = this.filterTickets(this.tickets);

    if (filtered.length === 0) {
      container.innerHTML = `
                <div class="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <i class="fas fa-ticket-alt text-4xl mb-4 text-slate-300"></i>
                    <p>Nenhum ticket encontrado nesta visão.</p>
                </div>`;
      return;
    }

    container.innerHTML = filtered.map(t => this.renderCard(t)).join('');
  }

  filterTickets(tickets) {
    if (this.currentFilter === 'all') return tickets;
    return tickets.filter(t => t.status === this.currentFilter);
  }

  renderCard(t) {
    const pInfo = TicketService.formatPriority(t.priority);
    const sInfo = TicketService.formatStatus(t.status);
    const date = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje';
    const slaClass = t.overdue ? 'text-rose-600' : 'text-slate-400';
    const slaIcon = t.overdue ? 'fa-fire' : 'fa-clock';

    return `
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer ticket-card group" data-id="${t.id}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sInfo.class}">
                                <i class="fas ${sInfo.icon} mr-1"></i>${sInfo.text}
                            </span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${pInfo.class}">
                                ${pInfo.text}
                            </span>
                            <span class="text-[10px] text-slate-400 font-mono">#${t.protocol || '---'}</span>
                        </div>
                        <h4 class="font-bold text-slate-800 group-hover:text-primary-700 transition-colors">${t.subject}</h4>
                    </div>
                    <div class="${slaClass} text-xs" title="SLA Status">
                        <i class="fas ${slaIcon}"></i>
                    </div>
                </div>
                <p class="text-sm text-slate-500 line-clamp-2 mb-3">${t.description}</p>
                <div class="flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3">
                    <div class="flex items-center gap-3">
                        <span><i class="far fa-calendar mr-1"></i>${date}</span>
                        <span><i class="far fa-user mr-1"></i>${t.assignedToEmail || 'Fila Geral'}</span>
                    </div>
                    <div class="font-medium text-slate-500">${this.formatCategory(t.category)}</div>
                </div>
            </div>
        `;
  }

  async handleCreate(e) {
    e.preventDefault();
    const btn = e.submitter;
    showButtonLoading(btn, true, 'Criando...');

    try {
      const mockClientId = 'CLI_MANUAL_' + Date.now();

      const data = {
        subject: document.getElementById('ticketSubject').value,
        category: document.getElementById('ticketCategory').value,
        priority: document.getElementById('ticketPriority').value,
        description: document.getElementById('ticketDesc').value,
        dueDate: this.calculateDueDate(document.getElementById('ticketPriority').value)
      };

      await this.ticketService.createTicket(mockClientId, data);

      showToast('Ticket criado com sucesso!', 'success');
      this.closeModal();
      document.getElementById('createTicketForm').reset();

    } catch (error) {
      console.error(error);
      showToast('Erro ao criar ticket.', 'danger');
    } finally {
      showButtonLoading(btn, false, 'Criar Ticket');
    }
  }

  // --- Helpers ---

  calculateDueDate(priority) {
    const hours = priority === 'high' ? 4 : (priority === 'medium' ? 24 : 48);
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  }

  updateSLAPreview(priority) {
    const el = document.getElementById('slaPreview');
    if (!el) return;
    const hours = priority === 'high' ? '4 horas' : (priority === 'medium' ? '24 horas' : '48 horas');
    el.textContent = `SLA Estimado: ${hours} para resolução`;
  }

  openModal() {
    const modal = document.getElementById('ticketModalOverlay');
    const content = document.getElementById('ticketModalContent');
    if (modal && content) {
      modal.classList.remove('hidden');
      requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95', 'opacity-0');
      });
      this.updateSLAPreview('medium');
      // Reset KB search
      this.searchKB('');
    }
  }

  closeModal() {
    const modal = document.getElementById('ticketModalOverlay');
    const content = document.getElementById('ticketModalContent');
    if (modal && content) {
      modal.classList.add('opacity-0');
      content.classList.add('scale-95', 'opacity-0');
      setTimeout(() => modal.classList.add('hidden'), 300);
    }
  }

  formatCategory(cat) {
    const map = { 'faturamento': 'Faturamento', 'tecnico': 'Técnico', 'cadastro': 'Cadastro', 'outros': 'Outros' };
    return map[cat] || cat;
  }

  updateFilterUI() {
    document.querySelectorAll('.ticket-filter-btn').forEach(btn => {
      const active = btn.dataset.filter === this.currentFilter;
      btn.className = `ticket-filter-btn px-4 py-2 rounded-lg font-medium transition-all ${active ? 'bg-primary-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        }`;
    });
  }

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
                        </div>`).join('')}
                </div>`;
    }
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  _injectCreateModal() {
    if (document.getElementById('ticketModalOverlay')) return;

    const html = `
        <div id="ticketModalOverlay" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
            <div id="ticketModalContent" class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl transform scale-95 opacity-0 transition-all duration-300 m-4 flex overflow-hidden max-h-[90vh]">
                
                <div class="flex-1 p-6 overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-slate-800">Novo Ticket</h3>
                        <button id="closeTicketModal" class="text-slate-400 hover:text-slate-600 transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <form id="createTicketForm" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Assunto</label>
                            <div class="relative">
                                <input type="text" id="ticketSubject" required class="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="Resumo do problema..." autocomplete="off">
                                <div class="absolute right-3 top-2.5 text-slate-400">
                                    <i class="fas fa-search"></i>
                                </div>
                            </div>
                            <p class="text-[10px] text-slate-400 mt-1 ml-1">Digite para ver soluções automáticas ao lado 👉</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                <select id="ticketCategory" class="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none bg-white">
                                    <option value="faturamento">Faturamento</option>
                                    <option value="tecnico">Suporte Técnico</option>
                                    <option value="cadastro">Atualização Cadastral</option>
                                    <option value="outros">Outros</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridade</label>
                                <select id="ticketPriority" class="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none bg-white">
                                    <option value="low">Baixa</option>
                                    <option value="medium" selected>Média</option>
                                    <option value="high">Alta</option>
                                </select>
                            </div>
                        </div>

                        <div id="slaPreview" class="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded border border-amber-100 flex items-center gap-2">
                            <i class="far fa-clock"></i>
                            </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição Detalhada</label>
                            <textarea id="ticketDesc" rows="5" required class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Descreva o problema com detalhes..."></textarea>
                        </div>

                        <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <button type="button" onclick="document.getElementById('closeTicketModal').click()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                            <button type="submit" class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-600/20 transition-all transform hover:-translate-y-0.5">
                                <i class="fas fa-paper-plane mr-2"></i>Criar Ticket
                            </button>
                        </div>
                    </form>
                </div>

                <div class="w-2/5 bg-slate-50 border-l border-slate-200 p-6 hidden md:flex flex-col">
                    <h4 class="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <i class="fas fa-lightbulb text-amber-400"></i> Base de Conhecimento
                    </h4>
                    
                    <div id="kbResults" class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div class="text-center py-8 opacity-60">
                            <i class="fas fa-search text-2xl text-slate-300 mb-2"></i>
                            <p class="text-xs text-slate-500">Digite o assunto para buscar...</p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t border-slate-200 text-center">
                        <button class="text-xs text-primary-600 hover:text-primary-700 font-medium" onclick="alert('Funcionalidade completa da KB em breve!')">
                            Ver todos os artigos <i class="fas fa-arrow-right ml-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // Expor função global para o onclick dos artigos
    window.crmApp = window.crmApp || {};
    window.crmApp.openArticle = (id) => {
      alert(`Abrir artigo ID: ${id}\n(Implementação do leitor de artigos na próxima fase)`);
    };
  }
}