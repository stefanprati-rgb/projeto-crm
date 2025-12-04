// crmApp.js

import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart, renderChurnChart } from "../features/dashboard.js";
import { readExcelFile, exportJSON, exportExcel, exportPDF } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { showButtonLoading, showSkeleton, showEmptyState } from "../ui/loadingStates.js";
import { InvoiceService } from "../services/invoiceService.js";
import { TimelineService } from "../services/timelineService.js";
import { TaskService } from "../services/taskService.js";
import { TicketsUI } from "../features/ticketsUI.js";
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";
import { validateCPF, validateCNPJ, debounce } from "../utils/helpers.js";
import { PROJECTS } from "../config/projects.js";

// Importa as novas classes de UI
import { NavigationManager } from "../ui/navigation.js";
import { DrawerManager } from "../ui/drawer.js";
import { TimelineUI } from "../ui/timelineUI.js";
import { TasksUI } from "../ui/tasksUI.js";

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
    this.taskService = new TaskService();
    this.ticketsUI = new TicketsUI(db, auth);
    this.table = new ClientsTable(this.userRole);

    // Inicializa novos módulos de UI
    this.activeSection = 'dashboard';
    this.timelineUI = new TimelineUI(this.timelineService);
    this.tasksUI = new TasksUI(this.taskService);
    this.drawerManager = new DrawerManager(
      this.timelineUI,
      this.tasksUI,
      () => this.tableData,
      () => this.dashboardData,
      this.service,
      () => this.currentBase,
      () => this.userRole
    );
    this.navigationManager = new NavigationManager(this.activeSection, this.refreshUI.bind(this));

    // Refs Gráficos
    this.clientsChartRef = { value: null };
    this.statusChartRef = { value: null };
    this.churnChartRef = { value: null };

    // Listeners
    this.unsubscribe = null;
    this.financeUnsubscribe = null;

    // Expor instância para o HTML (AGORA FEITO ANTES DO INIT)
    window.crmApp = this;
    // Expõe showClientModal para ser usado no bindActions da tabela
    window.crmApp.showClientModal = this.drawerManager.showClientModal.bind(this.drawerManager);

    this.init();
  }

  init() {
    this.initRoleBasedUI();
    this.initBaseSelector();
    this.initLoadMoreButton();

    this.bindActions();
    this.exposeWindowMethods(); // <--- ADICIONADO AQUI PARA EXPOR MÉTODOS GLOBAIS

    this.loadDataForBase(this.currentBase);
  }

  // NOVO MÉTODO PARA EXPOR FUNÇÕES PARA O HTML
  exposeWindowMethods() {
    // Funções necessárias para o HTML (ex: botões de concluir/deletar tarefa no Drawer)
    // O window.crmApp já está definido no construtor.
    window.crmApp.toggleTask = this.tasksUI.toggleTask.bind(this.tasksUI);
    window.crmApp.deleteTask = this.tasksUI.deleteTask.bind(this.tasksUI);
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.financeUnsubscribe) this.financeUnsubscribe();
    if (this.ticketsUI) this.ticketsUI.destroy();
    this.timelineUI.destroy();
    this.tasksUI.destroy();
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

  refreshUI() {
    // Obtém a seção ativa através do NavigationManager
    this.activeSection = this.navigationManager.activeSection;

    if (this.activeSection === 'dashboard') this.updateDashboard();
    if (this.activeSection === 'clients') { this.table.applyFilters(this.tableData); this.updateLoadMoreUI(); }
    if (this.activeSection === 'finance') this.updateFinance();
    if (this.activeSection === 'tickets') this.ticketsUI.init();
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
      if (this.financeUnsubscribe) this.financeUnsubscribe();
      this.financeUnsubscribe = this.invoiceService.listen((data) => {
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

    // Delega a chamada do modal para o DrawerManager
    document.getElementById('addClientButton')?.addEventListener('click', () => this.drawerManager.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));

    // DRAWER
    // closeDrawerBtn e overlay REMOVIDOS e DELEGADOS ao DrawerManager

    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'edit') this.drawerManager.showClientModal(btn.dataset.id);
    });

    // FORMS SECUNDÁRIOS
    // activityForm e taskForm REMOVIDOS e DELEGADOS aos respectivos UIs
  }

  // --- HANDLERS ---
  async handleExcelImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try { await readExcelFile(file, this.currentBase); this.loadDataForBase(this.currentBase); } catch (err) { console.error(err); showToast("Erro na leitura/importação.", "danger"); } e.target.value = null;
  }

  async handleInvoiceImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try { showToast('Lendo faturamento...', 'info'); const rows = await readInvoicesExcel(file); await this.invoiceService.batchImport(rows, 400); showToast('Importado com sucesso!', 'success'); } catch (err) { console.error(err); showToast('Erro na importação.', "danger"); } e.target.value = null;
  }

  // --- SAVE CLIENT ---
  async handleSaveClient(e) {
    e.preventDefault();
    if (this.userRole !== 'editor') { showToast("Permissão negada.", "danger"); return; }
    if (this.currentBase === 'TODOS') { showToast("Selecione um projeto.", "warning"); return; }

    const id = document.getElementById('clientId').value;
    const data = {
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
      this.drawerManager.closeDrawer();
      this.loadDataForBase(this.currentBase);
    } catch (err) { console.error(err); showToast('Erro ao salvar.', 'danger'); }
  }
}