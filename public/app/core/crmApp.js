import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart, renderChurnChart, renderTicketKPIs, renderTicketsChart } from "../features/dashboard.js";
import { readExcelFile, exportJSON, exportExcel, exportPDF } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { showButtonLoading, showSkeleton } from "../ui/loadingStates.js";
import { InvoiceService } from "../services/invoiceService.js";
import { TimelineService } from "../services/timelineService.js";
import { TaskService } from "../services/taskService.js";
import { TicketService } from "../services/ticketService.js";
import { TicketsUI } from "../features/ticketsUI.js";
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";
import { validateCPF, validateCNPJ, debounce } from "../utils/helpers.js";
import { PROJECTS } from "../config/projects.js";

// Importa as novas classes de UI
import { NavigationManager } from "../ui/navigation.js";
import { DrawerManager } from "../ui/drawer.js";
import { TimelineUI } from "../ui/timelineUI.js";


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
    this.ticketsData = []; // Armazena dados de tickets para o dashboard

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
    this.ticketService = new TicketService(); // Instância de Serviço de Tickets
    this.ticketsUI = new TicketsUI(db, auth);
    this.table = new ClientsTable(this.userRole);

    // Inicializa novos módulos de UI
    this.activeSection = 'dashboard';
    this.timelineUI = new TimelineUI(this.timelineService);
    // Nota: tasksUI foi substituído por ticketsUI (linha 58)

    this.drawerManager = new DrawerManager(
      this.timelineUI,
      null, // tasksUI removido - funcionalidade migrada para ticketsUI

      () => this.tableData,
      () => this.dashboardData,
      this.service,
      () => this.currentBase,
      () => this.userRole
    );
    // Initialize NavigationManager without triggering initial showSection
    this.navigationManager = new NavigationManager(this.activeSection, this.refreshUI.bind(this), true);

    // Refs Gráficos
    this.clientsChartRef = { value: null };
    this.statusChartRef = { value: null };
    this.churnChartRef = { value: null };

    // Listeners
    this.unsubscribe = null;
    this.financeUnsubscribe = null;
    this.ticketsDashboardUnsubscribe = null; // Listener específico para o Dashboard

    // Expor instância para o HTML
    window.crmApp = this;
    window.crmApp.showClientModal = this.drawerManager.showClientModal.bind(this.drawerManager);

    this.init();

    if (this.navigationManager) {
      this.navigationManager.showSection(this.activeSection);
    }
  }

  init() {
    this.initRoleBasedUI();
    this.initBaseSelector();
    this.initLoadMoreButton();

    this.bindActions();
    this.exposeWindowMethods();

    this.loadDataForBase(this.currentBase);
  }

  exposeWindowMethods() {
    // Check if tasksUI exists before binding (Legacy support)
    if (this.tasksUI) {
      window.crmApp.toggleTask = this.tasksUI.toggleTask.bind(this.tasksUI);
      window.crmApp.deleteTask = this.tasksUI.deleteTask.bind(this.tasksUI);
    }
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.financeUnsubscribe) this.financeUnsubscribe();
    if (this.ticketsDashboardUnsubscribe) this.ticketsDashboardUnsubscribe();
    if (this.ticketsUI) this.ticketsUI.destroy();
    this.timelineUI.destroy();

    console.log("CRMApp destruído.");
  }

  initRoleBasedUI() {
    if (this.userRole === 'visualizador') {
      ['importExcelButton', 'addClientButton', 'clientModalSaveButton', 'importInvoicesBtn'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
    }
  }

  initBaseSelector() {
    // Hotfix: Defensive programming para evitar crash em páginas sem o seletor
    const selector = document.getElementById('databaseSelector');
    if (!selector) {
      console.info('🔍 Seletor de base de dados não presente nesta view.');
      return;
    }

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

    // Event listener com referência correta
    selector.addEventListener('change', async (e) => {
      // 1. Atualizar referência atual
      this.currentBase = e.target.value;

      // 2. Salvar persistência
      localStorage.setItem('currentBase', this.currentBase);

      // 3. Recarregar dados para a nova base
      await this.loadDataForBase(this.currentBase);

      // 4. Atualizar UI com o nome visível da base
      const selectedText = e.target.options[e.target.selectedIndex].text;
      const baseNameDisplay = document.querySelector('.base-name');
      if (baseNameDisplay) {
        baseNameDisplay.textContent = selectedText;
      }
    });
  }

  async loadDataForBase(baseName) {
    this.dashboardData = [];
    this.tableData = [];
    this.pagination = { lastDoc: null, hasMore: true, isLoading: false, pageSize: 50 };

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
    if (!this.navigationManager) return;
    this.activeSection = this.navigationManager.activeSection;

    if (this.activeSection === 'dashboard') this.updateDashboard();
    if (this.activeSection === 'clients') { this.table.applyFilters(this.tableData); this.updateLoadMoreUI(); }
    if (this.activeSection === 'finance') this.updateFinance();
    if (this.activeSection === 'tickets') this.ticketsUI.init();
  }

  updateDashboard() {
    // 1. Renderiza Clientes
    renderKPIs({ total: 'kpi-total-clients', active: 'kpi-active-clients', overdue: 'kpi-overdue-clients', revenue: 'kpi-monthly-revenue' }, this.dashboardData, this.currentBase);

    const ctxLine = document.getElementById('clientsChart')?.getContext('2d');
    const ctxPie = document.getElementById('statusChart')?.getContext('2d');
    const ctxChurn = document.getElementById('churnChart')?.getContext('2d');

    if (ctxLine) renderClientsChart(ctxLine, this.dashboardData, this.clientsChartRef);
    if (ctxPie) renderStatusChart(ctxPie, this.dashboardData, this.statusChartRef);
    if (ctxChurn) renderChurnChart(ctxChurn, this.dashboardData, this.churnChartRef);

    // 2. Renderiza Tickets (Se não tiver listener, cria)
    if (!this.ticketsDashboardUnsubscribe) {
      this.ticketsDashboardUnsubscribe = this.ticketService.listen((tickets) => {
        this.ticketsData = tickets;
        const metrics = this.ticketService.getMetrics(tickets);
        renderTicketKPIs(metrics);

        const ctxTickets = document.getElementById('ticketsChart')?.getContext('2d');
        if (ctxTickets) {
          renderTicketsChart(ctxTickets, tickets);
        }
      });
    } else if (this.ticketsData.length > 0) {
      // Se já tem dados cacheados, re-renderiza
      const metrics = this.ticketService.getMetrics(this.ticketsData);
      renderTicketKPIs(metrics);
      const ctxTickets = document.getElementById('ticketsChart')?.getContext('2d');
      if (ctxTickets) {
        renderTicketsChart(ctxTickets, this.ticketsData);
      }
    }
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

    ['statusFilter', 'cityFilter', 'distributorFilter'].forEach(id => document.getElementById(id)?.addEventListener('input', () => this.table.applyFilters(this.tableData)));
    document.getElementById('clearFiltersButton')?.addEventListener('click', () => { this.table.clearFilters(); this.table.applyFilters(this.tableData); });

    document.getElementById('importExcelButton')?.addEventListener('click', () => {
      if (this.userRole !== 'editor') return;
      if (this.currentBase === 'TODOS') { showToast("Selecione um projeto.", "warning"); return; }
      if (confirm(`Importar para: ${PROJECTS[this.currentBase]?.name || this.currentBase}?`)) { document.getElementById('excelFileInput').click(); }
    });
    document.getElementById('excelFileInput')?.addEventListener('change', (e) => this.handleExcelImport(e));

    document.getElementById('importInvoicesBtn')?.addEventListener('click', () => {
      if (this.userRole !== 'editor') return;
      document.getElementById('invoicesFileInput').click();
    });
    document.getElementById('invoicesFileInput')?.addEventListener('change', (e) => this.handleInvoiceImport(e));

    document.getElementById('exportDataButton')?.addEventListener('click', () => exportJSON(this.dashboardData));
    document.getElementById('exportExcelButton')?.addEventListener('click', () => exportExcel(this.dashboardData));
    document.getElementById('exportPdfButton')?.addEventListener('click', () => exportPDF(this.dashboardData));

    document.getElementById('addClientButton')?.addEventListener('click', () => this.drawerManager.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));

    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'edit') this.drawerManager.showClientModal(btn.dataset.id);
    });
  }

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

  async handleSaveClient(e) {
    e.preventDefault();
    if (this.userRole !== 'editor') { showToast("Permissão negada.", "danger"); return; }
    if (this.currentBase === 'TODOS') { showToast("Selecione um projeto.", "warning"); return; }

    const id = document.getElementById('clientId').value;
    const data = {
      name: document.getElementById('clientName').value,
      externalId: document.getElementById('clientExternalId').value,
      instalacao: document.getElementById('clientInstalacao').value,
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