import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart, renderChurnChart } from "../features/dashboard.js";
import { readExcelFile, exportJSON, exportExcel, exportPDF } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { showButtonLoading, showSkeleton, showEmptyState } from "../ui/loadingStates.js";
import { InvoiceService } from "../services/invoiceService.js";
import { TimelineService } from "../services/timelineService.js";
import { TaskService } from "../services/taskService.js";
import { TicketsUI } from "../features/ticketsUI.js"; // Importa TicketsUI
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";
import { validateCPF, validateCNPJ, debounce } from "../utils/helpers.js";
import { PROJECTS } from "../config/projects.js";

// Classes para o estado "Ativo" do Menu Lateral
const NAV_ACTIVE_CLASSES = ['bg-white', 'text-primary-700', 'shadow-sm', 'font-semibold'];
const NAV_INACTIVE_CLASSES = ['text-slate-500', 'hover:bg-white/60', 'hover:text-primary-700'];

export class CRMApp {

  constructor(db, auth, userData) {
    this.db = db;
    this.auth = auth;

    this.userRole = userData.role || 'visualizador';
    this.allowedBases = userData.allowedBases || Object.keys(PROJECTS);

    // Inicialização Inteligente
    const savedBase = localStorage.getItem('crm_last_project');
    if (savedBase && (this.allowedBases.includes(savedBase) || savedBase === 'TODOS')) {
      this.currentBase = savedBase;
    } else {
      this.currentBase = 'TODOS';
    }

    // Dados
    this.dashboardData = [];
    this.tableData = [];
    this.invoices = [];

    // Paginação
    this.pagination = {
      lastDoc: null,
      hasMore: true,
      isLoading: false,
      pageSize: 50
    };

    // Serviços
    this.service = new ClientService(db);
    this.invoiceService = new InvoiceService(db);
    this.timelineService = new TimelineService();
    this.taskService = new TaskService(); // Instância de Tarefas
    this.ticketsUI = new TicketsUI(db, auth); // Inicializa TicketsUI
    this.table = new ClientsTable(this.userRole);

    // Refs Gráficos
    this.clientsChartRef = { value: null };
    this.statusChartRef = { value: null };
    this.churnChartRef = { value: null };

    this.activeSection = 'dashboard';

    // Listeners
    this.unsubscribe = null;
    this.timelineUnsubscribe = null;
    this.tasksUnsubscribe = null;

    // Expor instância para o HTML (para os botões de concluir tarefa funcionarem)
    window.crmApp = this;

    this.init();
  }

  init() {
    this.initRoleBasedUI();
    this.initBaseSelector();
    this.initLoadMoreButton();

    this.bindNav();
    this.bindActions();
    this.bindModalTabs();

    this.loadDataForBase(this.currentBase);
    this.updateNavHighlight(this.activeSection);
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.timelineUnsubscribe) this.timelineUnsubscribe();
    if (this.tasksUnsubscribe) this.tasksUnsubscribe();
    if (this.ticketsUI) this.ticketsUI.destroy(); // Destroi listener de tickets
    console.log("CRMApp destruído.");
  }

  initRoleBasedUI() {
    // Corrige a lógica para ocultar botões de importação/criação para visualizador
    if (this.userRole === 'visualizador') {
      ['importExcelButton', 'addClientButton', 'clientModalSaveButton', 'importInvoicesBtn'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
    }
  }

  // --- SELETOR ---
  initBaseSelector() {
    const selector = document.getElementById('databaseSelector');
    if (!selector) return;

    selector.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = 'TODOS';
    optAll.textContent = 'Visão Consolidada (Todos)';
    selector.appendChild(optAll);

    this.allowedBases.forEach(baseCode => {
      const project = PROJECTS[baseCode];
      if (project) {
        const opt = document.createElement('option');
        opt.value = baseCode;
        opt.textContent = `${baseCode} - ${project.name}`;
        if (baseCode === this.currentBase) opt.selected = true;
        selector.appendChild(opt);
      }
    });

    selector.addEventListener('change', (e) => {
      const newBase = e.target.value;
      if (newBase !== this.currentBase) {
        this.currentBase = newBase;
        localStorage.setItem('crm_last_project', newBase);
        this.loadDataForBase(this.currentBase);
        const msg = newBase === 'TODOS' ? 'Visão Geral Consolidada' : `Projeto: ${PROJECTS[newBase]?.name}`;
        showToast(msg, 'info');
      }
    });
  }

  // --- ABAS ---
  bindModalTabs() {
    const tabBtns = document.querySelectorAll('.drawer-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.dataset.tab;

        // UI dos Botões
        tabBtns.forEach(b => {
          b.classList.remove('active', 'text-primary-700', 'border-primary-600');
          b.classList.add('text-slate-400', 'border-transparent');
        });

        btn.classList.remove('text-slate-400', 'border-transparent');
        btn.classList.add('active', 'text-primary-700', 'border-primary-600');

        // Conteúdo
        document.querySelectorAll('.drawer-content').forEach(c => c.classList.add('hidden'));
        const target = document.getElementById(targetId);
        if (target) {
          target.classList.remove('hidden');
          target.classList.add('fade-in');
        }
      });
    });
  }

  // --- CARREGAMENTO ---
  async loadDataForBase(baseName) {
    this.dashboardData = [];
    this.tableData = [];
    this.pagination = { lastDoc: null, hasMore: true, isLoading: false, pageSize: 50 };

    // Limpa a tabela e mostra Skeleton
    this.table.applyFilters([]);
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) showSkeleton(tbody, 5, 'table');

    this.updateLoadMoreUI();
    console.log(`Iniciando carregamento para: ${baseName}`);

    await this.loadNextPage();

    this.service.getAllForDashboard(baseName).then(data => {
      this.dashboardData = data;
      this.updateDashboard();
    }).catch(err => console.error("Erro dashboard:", err));
  }

  async loadNextPage() {
    if (this.pagination.isLoading || !this.pagination.hasMore) return;
    this.pagination.isLoading = true;

    const btn = document.getElementById('btnLoadMore');
    if (btn) showButtonLoading(btn, true, 'Carregar mais clientes');

    try {
      const result = await this.service.getPage(this.currentBase, this.pagination.pageSize, this.pagination.lastDoc);
      if (result.data.length > 0) {
        this.tableData = [...this.tableData, ...result.data];
        this.pagination.lastDoc = result.lastDoc;
        this.table.applyFilters(this.tableData);
      }
      this.pagination.hasMore = result.hasMore;
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar.", "danger");
    } finally {
      this.pagination.isLoading = false;
      if (btn) showButtonLoading(btn, false, 'Carregar mais clientes');
      this.updateLoadMoreUI();
    }
  }

  initLoadMoreButton() {
    const tableContainer = document.querySelector('#clients-section .overflow-x-auto');
    if (!tableContainer) return;
    if (!document.getElementById('loadMoreContainer')) {
      const container = document.createElement('div');
      container.id = 'loadMoreContainer';
      container.className = 'p-5 text-center border-t border-slate-100 bg-slate-50/30 hidden';
      const btn = document.createElement('button');
      btn.id = 'btnLoadMore';
      btn.className = 'px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm text-sm font-medium hover:bg-slate-50 hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
      btn.innerHTML = '<i class="fas fa-download me-2"></i>Carregar mais clientes';
      btn.addEventListener('click', () => this.loadNextPage());
      container.appendChild(btn);
      tableContainer.parentNode.insertBefore(container, tableContainer.nextSibling);
    }
  }

  updateLoadMoreUI() {
    const container = document.getElementById('loadMoreContainer');
    const btn = document.getElementById('btnLoadMore');
    if (!container || !btn) return;
    if (this.pagination.hasMore) { container.classList.remove('hidden'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-download me-2"></i>Carregar mais clientes'; }
    else { container.classList.add('hidden'); }
  }

  // --- NAVEGAÇÃO ---
  bindNav() {
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = e.currentTarget.dataset.section;
        this.showSection(sectionId);
      });
    });
    this.showSection(this.activeSection);
  }

  showSection(sectionId) {
    this.activeSection = sectionId;
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) {
      const titles = {
        'dashboard': 'Visão Geral',
        'clients': 'Carteira de Clientes',
        'finance': 'Gestão Financeira',
        'tickets': 'Central de Tickets' // Adiciona título da seção Tickets
      };
      titleEl.textContent = titles[sectionId] || 'CRM Energia';
    }
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`${sectionId}-section`);
    if (target) { target.classList.remove('hidden'); target.classList.add('fade-in'); }
    this.updateNavHighlight(sectionId);
    this.refreshUI();
  }

  updateNavHighlight(activeId) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const isTarget = link.dataset.section === activeId;
      link.classList.remove(...NAV_ACTIVE_CLASSES, ...NAV_INACTIVE_CLASSES);
      if (isTarget) link.classList.add(...NAV_ACTIVE_CLASSES);
      else link.classList.add(...NAV_INACTIVE_CLASSES);
    });
  }

  refreshUI() {
    if (this.activeSection === 'dashboard') this.updateDashboard();
    if (this.activeSection === 'clients') { this.table.applyFilters(this.tableData); this.updateLoadMoreUI(); }
    if (this.activeSection === 'finance') this.updateFinance();
    if (this.activeSection === 'tickets') this.ticketsUI.init(); // Inicializa o TicketsUI
  }

  updateDashboard() {
    renderKPIs({ total: 'kpi-total-clients', active: 'kpi-active-clients', overdue: 'kpi-overdue-clients', revenue: 'kpi-monthly-revenue' }, this.dashboardData, this.currentBase);

    const ctxLine = document.getElementById('clientsChart')?.getContext('2d');
    const ctxPie = document.getElementById('statusChart')?.getContext('2d');
    const ctxChurn = document.getElementById('churnChart')?.getContext('2d');

    if (ctxLine) renderClientsChart(ctxLine, this.dashboardData, this.clientsChartRef);
    if (ctxPie) renderStatusChart(ctxPie, this.dashboardData, this.statusChartRef);
    if (ctxChurn) renderChurnChart(ctxChurn, this.dashboardData, this.churnChartRef);
  }

  updateFinance() {
    if (this.invoices.length === 0) {
      this.invoiceService.listen((data) => {
        this.invoices = data;
        this.renderFinanceWidgets();
      }, (err) => console.error(err));
    } else {
      this.renderFinanceWidgets();
    }
  }

  renderFinanceWidgets() {
    import('../features/financeDashboard.js').then(module => {
      module.renderFinanceKPIs({ emitido: 'kpi-emitido', pago: 'kpi-pago', inadimplencia: 'kpi-inad', dso: 'kpi-dso' }, this.invoices);
      const ctx1 = document.getElementById('revenueTrend')?.getContext('2d');
      const ctx2 = document.getElementById('agingChart')?.getContext('2d');
      const ctx3 = document.getElementById('leakageChart')?.getContext('2d');

      if (ctx1) module.renderRevenueTrend(ctx1, this.invoices);
      if (ctx2) module.renderAgingChart(ctx2, this.invoices);
      if (ctx3) module.renderLeakageChart(ctx3, this.invoices);
    });
  }

  bindActions() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) { searchInput.addEventListener('input', debounce(() => { this.table.applyFilters(this.tableData); }, 500)); }

    ['statusFilter', 'cityFilter'].forEach(id => document.getElementById(id)?.addEventListener('input', () => this.table.applyFilters(this.tableData)));
    document.getElementById('clearFiltersButton')?.addEventListener('click', () => { this.table.clearFilters(); this.table.applyFilters(this.tableData); });

    document.getElementById('importExcelButton')?.addEventListener('click', () => {
      if (this.userRole !== 'editor') return;
      if (this.currentBase === 'TODOS') { showToast("Selecione um projeto.", "warning"); return; }
      if (confirm(`Importar para: ${PROJECTS[this.currentBase]?.name || this.currentBase}?`)) { document.getElementById('excelFileInput').click(); }
    });
    document.getElementById('excelFileInput')?.addEventListener('change', (e) => this.handleExcelImport(e));

    // Vincula o botão Importar Faturas ao input file
    document.getElementById('importInvoicesBtn')?.addEventListener('click', () => {
      if (this.userRole !== 'editor') return;
      document.getElementById('invoicesFileInput').click();
    });
    document.getElementById('invoicesFileInput')?.addEventListener('change', (e) => this.handleInvoiceImport(e));

    document.getElementById('exportDataButton')?.addEventListener('click', () => exportJSON(this.dashboardData));
    document.getElementById('exportExcelButton')?.addEventListener('click', () => exportExcel(this.dashboardData));
    document.getElementById('exportPdfButton')?.addEventListener('click', () => exportPDF(this.dashboardData));

    document.getElementById('addClientButton')?.addEventListener('click', () => this.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));

    // DRAWER
    document.getElementById('closeDrawerBtn')?.addEventListener('click', () => this.closeDrawer());
    document.getElementById('client-drawer-overlay')?.addEventListener('click', () => this.closeDrawer());

    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'edit') this.showClientModal(btn.dataset.id);
    });

    // FORMS SECUNDÁRIOS
    document.getElementById('activityForm')?.addEventListener('submit', (e) => this.handleSaveActivity(e));
    document.getElementById('taskForm')?.addEventListener('submit', (e) => this.handleSaveTask(e));
  }

  // --- HANDLERS ---
  async handleExcelImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try { await readExcelFile(file, this.currentBase); this.loadDataForBase(this.currentBase); } catch (err) { console.error(err); } e.target.value = null;
  }

  async handleInvoiceImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try { showToast('Lendo faturamento...', 'info'); const rows = await readInvoicesExcel(file); await this.invoiceService.batchImport(rows, 400); showToast('Importado com sucesso!', 'success'); } catch (err) { console.error(err); showToast('Erro na importação.', 'danger'); } e.target.value = null;
  }

  // --- DRAWER LOGIC ---

  showClientModal(id = null) {
    document.getElementById('clientForm').reset();
    document.getElementById('clientId').value = '';

    if (this.timelineUnsubscribe) { this.timelineUnsubscribe(); this.timelineUnsubscribe = null; }
    if (this.tasksUnsubscribe) { this.tasksUnsubscribe(); this.tasksUnsubscribe = null; }

    const timelineContainer = document.getElementById('activityTimeline');
    if (timelineContainer) timelineContainer.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Carregando histórico...</div>';

    const tasksContainer = document.getElementById('tasksList');
    if (tasksContainer) tasksContainer.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Carregando tarefas...</div>';

    // Reset Tabs
    const tabBtns = document.querySelectorAll('.drawer-tab-btn');
    tabBtns.forEach(b => {
      b.classList.remove('active', 'text-primary-700', 'border-primary-600');
      b.classList.add('text-slate-400', 'border-transparent');
    });
    document.querySelectorAll('.drawer-content').forEach(c => c.classList.add('hidden'));

    const firstTab = document.querySelector('[data-tab="tab-overview"]');
    if (firstTab) {
      firstTab.classList.remove('text-slate-400', 'border-transparent');
      firstTab.classList.add('active', 'text-primary-700', 'border-primary-600');
      document.getElementById('tab-overview')?.classList.remove('hidden');
    }

    if (id) {
      const c = this.tableData.find(x => x.id === id) || this.dashboardData.find(x => x.id === id);
      if (c) {
        document.getElementById('clientId').value = c.id;
        document.getElementById('drawerClientName').textContent = c.name || 'Cliente Sem Nome';
        document.getElementById('drawerClientId').textContent = `ID: ${c.externalId || '-'}`;
        document.getElementById('drawerClientUC').textContent = `UC: ${c.instalacao || '-'}`;

        // Adiciona a leitura do novo campo 'clientInstalacao' (UC)
        const fields = {
          'Name': c.name, 'ExternalId': c.externalId, 'Cpf': c.cpf, 'Cnpj': c.cnpj,
          'Email': c.email, 'Phone': c.phone, 'Address': c.address, 'State': c.state, 'City': c.city,
          'Status': c.status, 'ContractType': c.contractType, 'JoinDate': c.joinDate ? c.joinDate.split('T')[0] : '',
          'Consumption': c.consumption, 'Discount': c.discount, 'Instalacao': c.instalacao // Novo campo
        };
        for (const [key, val] of Object.entries(fields)) { const el = document.getElementById(`client${key}`); if (el) el.value = val || ''; }

        // LOAD SUBCOLLECTIONS
        this.loadTimeline(c.id);
        this.loadTasks(c.id);
      }
    } else {
      document.getElementById('drawerClientName').textContent = 'Novo Cliente';
      const elDate = document.getElementById('clientJoinDate'); if (elDate) elDate.value = new Date().toISOString().split('T')[0];
    }

    const drawer = document.getElementById('client-drawer');
    const overlay = document.getElementById('client-drawer-overlay');
    if (drawer && overlay) {
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.remove('opacity-0'), 10);
      drawer.classList.remove('translate-x-full');
    }
  }

  closeDrawer() {
    const drawer = document.getElementById('client-drawer');
    const overlay = document.getElementById('client-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.add('translate-x-full');
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.classList.add('hidden'), 300);
    }
  }

  // --- TIMELINE ---
  loadTimeline(clientId) {
    this.timelineUnsubscribe = this.timelineService.listenToTimeline(clientId, (activities) => {
      const container = document.getElementById('activityTimeline');
      if (!container) return;

      if (activities.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Nenhuma atividade registrada.</div>';
        return;
      }

      container.innerHTML = activities.map(act => {
        const date = new Date(act.createdAt).toLocaleDateString() + ' ' + new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let iconClass = 'fa-comment';
        let bgClass = 'bg-slate-100 text-slate-500';
        if (act.type === 'whatsapp') { iconClass = 'fa-whatsapp'; bgClass = 'bg-green-100 text-green-600'; }
        else if (act.type === 'call') { iconClass = 'fa-phone'; bgClass = 'bg-blue-100 text-blue-600'; }
        else if (act.type === 'email') { iconClass = 'fa-envelope'; bgClass = 'bg-amber-100 text-amber-600'; }

        return `
          <div class="flex gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm fade-in">
            <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bgClass}">
              <i class="fab ${iconClass} text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <p class="text-xs font-bold text-slate-700 uppercase tracking-wider">${act.type}</p>
                <span class="text-[10px] text-slate-400">${date}</span>
              </div>
              <p class="text-sm text-slate-600 mt-1 leading-relaxed">${act.content}</p>
              <p class="text-[10px] text-slate-300 mt-2">Por: ${act.createdBy || 'Sistema'}</p>
            </div>
          </div>
        `;
      }).join('');
    });
  }

  async handleSaveActivity(e) {
    e.preventDefault();
    const clientId = document.getElementById('clientId').value;
    if (!clientId) { showToast("Salve o cliente primeiro.", "warning"); return; }
    const type = document.getElementById('activityType').value;
    const content = document.getElementById('activityContent').value;
    try {
      await this.timelineService.addActivity(clientId, type, content);
      document.getElementById('activityContent').value = '';
      showToast("Atividade registrada!", "success");
    } catch (err) { console.error(err); showToast("Erro ao registrar.", "danger"); }
  }

  // --- TASKS ---
  loadTasks(clientId) {
    this.tasksUnsubscribe = this.taskService.listenToClientTasks(clientId, (tasks) => {
      const container = document.getElementById('tasksList');
      if (!container) return;

      if (tasks.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Nenhuma tarefa pendente.</div>';
        return;
      }

      container.innerHTML = tasks.map(task => {
        const isDone = task.status === 'done';
        const opacityClass = isDone ? 'opacity-50' : '';
        const checkIcon = isDone ? 'fa-check-circle text-emerald-500' : 'fa-circle text-slate-300';
        const date = new Date(task.dueDate).toLocaleDateString();
        let priorityColor = 'bg-slate-100 text-slate-500';
        if (task.priority === 'high') priorityColor = 'bg-rose-50 text-rose-600';
        if (task.priority === 'medium') priorityColor = 'bg-amber-50 text-amber-600';

        return `
          <div class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm fade-in group ${opacityClass}">
            <button class="shrink-0 text-lg hover:text-emerald-500 transition-colors" onclick="window.crmApp.toggleTask('${task.id}', '${task.status}')">
               <i class="far ${checkIcon}"></i>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                 <span class="text-xs font-bold ${priorityColor} px-2 py-0.5 rounded-full uppercase tracking-wide">${task.type || 'Geral'}</span>
                 <span class="text-[10px] text-slate-400 flex items-center gap-1"><i class="far fa-calendar"></i> ${date}</span>
              </div>
              <p class="text-sm font-medium text-slate-700 ${isDone ? 'line-through' : ''}">${task.title}</p>
            </div>
            <button class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" onclick="window.crmApp.deleteTask('${task.id}')">
               <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;
      }).join('');
    });
  }

  async handleSaveTask(e) {
    e.preventDefault();
    const clientId = document.getElementById('clientId').value;
    if (!clientId) { showToast("Salve o cliente primeiro.", "warning"); return; }

    const taskData = {
      title: document.getElementById('taskTitle').value,
      type: document.getElementById('taskType').value,
      dueDate: document.getElementById('taskDueDate').value,
      priority: document.getElementById('taskPriority').value
    };

    try {
      await this.taskService.addTask(clientId, taskData);
      document.getElementById('taskTitle').value = '';
      showToast("Tarefa criada!", "success");
    } catch (err) { console.error(err); showToast("Erro ao criar tarefa.", "danger"); }
  }

  // Métodos Expostos (Window)
  async toggleTask(taskId, currentStatus) {
    const clientId = document.getElementById('clientId').value;
    try {
      await this.taskService.toggleStatus(clientId, taskId, currentStatus);
      showToast(currentStatus === 'done' ? "Tarefa reaberta." : "Tarefa concluída!", "success");
    } catch (e) { console.error(e); showToast("Erro ao alterar status.", "danger"); }
  }

  async deleteTask(taskId) {
    if (!confirm("Apagar tarefa?")) return;
    const clientId = document.getElementById('clientId').value;
    try {
      await this.taskService.deleteTask(clientId, taskId);
      showToast("Tarefa apagada.", "success");
    } catch (e) { console.error(e); showToast("Erro ao apagar.", "danger"); }
  }

  // --- SAVE CLIENT ---
  async handleSaveClient(e) {
    e.preventDefault();
    if (this.userRole !== 'editor') { showToast("Permissão negada.", "danger"); return; }
    if (this.currentBase === 'TODOS') { showToast("Selecione um projeto.", "warning"); return; }

    const id = document.getElementById('clientId').value;
    const data = {
      // TODOS OS CAMPOS AGORA SÃO CAPTURADOS, INCLUINDO OS NOVOS DO FORMULÁRIO COMPLETO
      name: document.getElementById('clientName').value,
      externalId: document.getElementById('clientExternalId').value,
      instalacao: document.getElementById('clientInstalacao').value, // Campo UC/Conta Contrato
      address: document.getElementById('clientAddress').value,
      joinDate: document.getElementById('clientJoinDate').value,
      consumption: document.getElementById('clientConsumption').value,
      discount: document.getElementById('clientDiscount').value,

      cpf: document.getElementById('clientCpf').value,
      cnpj: document.getElementById('clientCnpj').value,
      email: document.getElementById('clientEmail').value,
      phone: document.getElementById('clientPhone').value,
      state: document.getElementById('clientState').value,
      city: document.getElementById('clientCity').value,
      status: document.getElementById('clientStatus').value,
      contractType: document.getElementById('clientContractType').value,
      database: this.currentBase
    };
    if (data.cpf && !validateCPF(data.cpf)) { showToast("CPF inválido.", "warning"); return; }
    if (data.cnpj && !validateCNPJ(data.cnpj)) { showToast("CNPJ inválido.", "warning"); return; }

    try {
      await this.service.save(id, data);
      showToast('Salvo com sucesso!', 'success');
      this.closeDrawer();
      this.loadDataForBase(this.currentBase);
    } catch (err) { console.error(err); showToast('Erro ao salvar.', 'danger'); }
  }
}