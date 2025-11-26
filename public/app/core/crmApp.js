import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart } from "../features/dashboard.js";
import { readExcelFile, exportJSON, exportExcel } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { InvoiceService } from "../services/invoiceService.js";
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";
import { validateCPF, validateCNPJ } from "../utils/helpers.js";
import { PROJECTS } from "../config/projects.js";

// Classes para o estado "Ativo" do Menu (Tailwind)
const NAV_ACTIVE_CLASSES = ['bg-primary-50', 'text-primary-700', 'font-bold', 'shadow-sm'];
const NAV_INACTIVE_CLASSES = ['text-slate-500', 'hover:bg-primary-50', 'hover:text-primary-700'];

export class CRMApp {

  constructor(db, auth, userData) {
    this.db = db;
    this.auth = auth;

    this.userRole = userData.role || 'visualizador';
    // Se o usuário não tiver bases definidas, damos acesso a todas por padrão
    // No futuro, isso virá do Firestore do usuário
    this.allowedBases = userData.allowedBases || Object.keys(PROJECTS);
    this.currentBase = this.allowedBases[0];

    // --- DADOS SEPARADOS ---
    this.dashboardData = [];
    this.tableData = [];
    this.invoices = [];

    this.pagination = {
      lastDoc: null,
      hasMore: true,
      isLoading: false,
      pageSize: 50
    };

    this.service = new ClientService(db);
    this.invoiceService = new InvoiceService(db);

    this.table = new ClientsTable(this.userRole);
    this.clientsChartRef = { value: null };
    this.statusChartRef = { value: null };
    this.activeSection = 'dashboard';

    this.unsubscribe = null;
    this.init();
  }

  init() {
    this.initRoleBasedUI();
    this.initBaseSelector();
    this.initLoadMoreButton();
    this.bindNav();
    this.bindActions();

    this.loadDataForBase(this.currentBase);
    this.updateNavHighlight(this.activeSection);
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
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
    const selector = document.getElementById('databaseSelector');
    if (!selector) return;

    selector.innerHTML = '';

    // Adiciona opção "TODOS" (Consolidado)
    const optAll = document.createElement('option');
    optAll.value = 'TODOS';
    optAll.textContent = 'Visão Consolidada (Todos)';
    selector.appendChild(optAll);

    // Adiciona Projetos Individuais
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
        this.loadDataForBase(this.currentBase);

        // Feedback visual de troca de contexto
        const msg = newBase === 'TODOS' ? 'Visão Geral Consolidada' : `Projeto: ${PROJECTS[newBase]?.name}`;
        showToast(msg, 'info');
      }
    });
  }

  initLoadMoreButton() {
    const tableContainer = document.querySelector('#clients-section .overflow-x-auto');
    if (!tableContainer) return;

    if (!document.getElementById('loadMoreContainer')) {
      const container = document.createElement('div');
      container.id = 'loadMoreContainer';
      container.className = 'p-4 text-center border-t border-slate-100 bg-slate-50/30 hidden';

      const btn = document.createElement('button');
      btn.id = 'btnLoadMore';
      btn.className = 'px-6 py-2 bg-white border border-slate-300 text-slate-600 rounded-full shadow-sm text-sm font-medium hover:bg-slate-50 hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
      btn.innerHTML = '<i class="fas fa-download me-2"></i>Carregar mais clientes';

      btn.addEventListener('click', () => this.loadNextPage());

      container.appendChild(btn);
      tableContainer.parentNode.insertBefore(container, tableContainer.nextSibling);
    }
  }

  // --- CARREGAMENTO ---

  async loadDataForBase(baseName) {
    this.dashboardData = [];
    this.tableData = [];
    this.pagination = { lastDoc: null, hasMore: true, isLoading: false, pageSize: 50 };

    this.table.applyFilters([]);
    this.updateLoadMoreUI();

    console.log(`Iniciando carregamento para: ${baseName}`);

    // 1. Tabela Paginada
    await this.loadNextPage();

    // 2. Dashboard Completo (Background)
    this.service.getAllForDashboard(baseName).then(data => {
      this.dashboardData = data;
      this.updateDashboard();
    }).catch(err => console.error("Erro dashboard:", err));
  }

  async loadNextPage() {
    if (this.pagination.isLoading || !this.pagination.hasMore) return;

    this.pagination.isLoading = true;
    const btn = document.getElementById('btnLoadMore');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin me-2"></i>Carregando...';
    }

    try {
      const result = await this.service.getPage(
        this.currentBase,
        this.pagination.pageSize,
        this.pagination.lastDoc
      );

      if (result.data.length > 0) {
        this.tableData = [...this.tableData, ...result.data];
        this.pagination.lastDoc = result.lastDoc;
        this.table.applyFilters(this.tableData);
      }

      this.pagination.hasMore = result.hasMore;

    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar mais clientes.", "danger");
    } finally {
      this.pagination.isLoading = false;
      this.updateLoadMoreUI();
    }
  }

  updateLoadMoreUI() {
    const container = document.getElementById('loadMoreContainer');
    const btn = document.getElementById('btnLoadMore');
    if (!container || !btn) return;

    if (this.pagination.hasMore) {
      container.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download me-2"></i>Carregar mais clientes';
    } else {
      container.classList.add('hidden');
    }
  }

  // --- UI & NAVEGAÇÃO ---

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
        'finance': 'Gestão Financeira'
      };
      titleEl.textContent = titles[sectionId] || 'CRM Energia';
    }

    document.querySelectorAll('.section-content').forEach(s => s.classList.add('d-none'));
    const target = document.getElementById(`${sectionId}-section`);
    if (target) {
      target.classList.remove('d-none');
      target.style.animation = 'none';
      target.offsetHeight;
      target.style.animation = null;
    }

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
    if (this.activeSection === 'clients') {
      this.table.applyFilters(this.tableData);
      this.updateLoadMoreUI();
    }
    if (this.activeSection === 'finance') this.updateFinance();
  }

  updateDashboard() {
    // Passa a base atual para cálculo correto da vacância
    renderKPIs({
      total: 'kpi-total-clients',
      active: 'kpi-active-clients',
      overdue: 'kpi-overdue-clients',
      revenue: 'kpi-monthly-revenue'
    }, this.dashboardData, this.currentBase);

    const ctxLine = document.getElementById('clientsChart')?.getContext('2d');
    const ctxPie = document.getElementById('statusChart')?.getContext('2d');

    if (ctxLine) renderClientsChart(ctxLine, this.dashboardData, this.clientsChartRef);
    if (ctxPie) renderStatusChart(ctxPie, this.dashboardData, this.statusChartRef);
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
      module.renderFinanceKPIs({
        emitido: 'kpi-emitido',
        pago: 'kpi-pago',
        inadimplencia: 'kpi-inad',
        dso: 'kpi-dso'
      }, this.invoices);

      const ctx1 = document.getElementById('revenueTrend')?.getContext('2d');
      const ctx2 = document.getElementById('agingChart')?.getContext('2d');
      if (ctx1) module.renderRevenueTrend(ctx1, this.invoices);
      if (ctx2) module.renderAgingChart(ctx2, this.invoices);
    });
  }

  // --- AÇÕES ---

  bindActions() {
    const applyFilters = () => this.table.applyFilters(this.tableData);
    ['searchInput', 'statusFilter', 'typeFilter'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', applyFilters));

    document.getElementById('cityFilter')?.addEventListener('input', applyFilters);

    document.getElementById('clearFiltersButton')?.addEventListener('click', () => {
      this.table.clearFilters(); applyFilters();
    });

    // IMPORTAÇÃO
    document.getElementById('importExcelButton')?.addEventListener('click', () => {
      if (this.userRole !== 'editor') return;

      // Proteção: Não permitir importar em "TODOS"
      if (this.currentBase === 'TODOS') {
        showToast("Selecione um projeto específico (ex: LNV) para importar.", "warning");
        return;
      }

      if (confirm(`Você está importando dados para: ${PROJECTS[this.currentBase]?.name || this.currentBase}.\n\nConfirma?`)) {
        document.getElementById('excelFileInput').click();
      }
    });

    document.getElementById('excelFileInput')?.addEventListener('change', (e) => this.handleExcelImport(e));

    document.getElementById('importInvoicesBtn')?.addEventListener('click', () => document.getElementById('invoicesFileInput')?.click());
    document.getElementById('invoicesFileInput')?.addEventListener('change', (e) => this.handleInvoiceImport(e));

    // Exportação
    document.getElementById('exportDataButton')?.addEventListener('click', () => exportJSON(this.dashboardData));
    document.getElementById('exportExcelButton')?.addEventListener('click', () => exportExcel(this.dashboardData));

    // CRUD
    document.getElementById('addClientButton')?.addEventListener('click', () => this.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));

    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'edit') this.showClientModal(btn.dataset.id);
    });
  }

  // --- HANDLERS ---

  async handleExcelImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await readExcelFile(file, this.currentBase);
      this.loadDataForBase(this.currentBase);
    } catch (err) { console.error(err); }
    e.target.value = null;
  }

  async handleInvoiceImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast('Lendo faturamento...', 'info');
      const rows = await readInvoicesExcel(file);
      await this.invoiceService.batchImport(rows, 400);
      showToast('Faturamento importado!', 'success');
    } catch (err) { console.error(err); showToast('Erro na importação.', 'danger'); }
    e.target.value = null;
  }

  showClientModal(id = null) {
    const f = document.getElementById('clientForm');
    f.reset();
    document.getElementById('clientId').value = '';
    const title = document.getElementById('clientModalTitle');
    const btnSave = document.getElementById('clientModalSaveButton');

    if (this.userRole === 'visualizador') {
      title.textContent = 'Ver Cliente';
      Array.from(f.elements).forEach(el => el.disabled = true);
      if (btnSave) btnSave.classList.add('hidden');
    } else {
      title.textContent = id ? 'Editar Cliente' : 'Novo Cliente';
      Array.from(f.elements).forEach(el => el.disabled = false);
      if (btnSave) btnSave.classList.remove('hidden');
    }

    if (id) {
      const c = this.tableData.find(x => x.id === id) || this.dashboardData.find(x => x.id === id);
      if (c) {
        document.getElementById('clientId').value = c.id;
        const fields = {
          'Name': c.name, 'ExternalId': c.externalId, 'Cpf': c.cpf, 'Cnpj': c.cnpj,
          'Email': c.email, 'Phone': c.phone, 'Address': c.address,
          'State': c.state, 'City': c.city, 'Status': c.status, 'ContractType': c.contractType,
          'JoinDate': c.joinDate ? c.joinDate.split('T')[0] : '',
          'Consumption': c.consumption, 'Discount': c.discount
        };
        for (const [key, val] of Object.entries(fields)) {
          const el = document.getElementById(`client${key}`);
          if (el) el.value = val || '';
        }
      }
    } else {
      const elDate = document.getElementById('clientJoinDate');
      if (elDate) elDate.value = new Date().toISOString().split('T')[0];
    }

    const modalEl = document.getElementById('clientModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  async handleSaveClient(e) {
    e.preventDefault();
    if (this.userRole !== 'editor') { showToast("Permissão negada.", "danger"); return; }

    // Bloqueia salvar se estiver em TODOS
    if (this.currentBase === 'TODOS') {
      showToast("Selecione um projeto específico para salvar o cliente.", "warning");
      return;
    }

    const id = document.getElementById('clientId').value;
    const data = {
      name: document.getElementById('clientName').value,
      externalId: document.getElementById('clientExternalId').value,
      cpf: document.getElementById('clientCpf').value,
      cnpj: document.getElementById('clientCnpj').value,
      email: document.getElementById('clientEmail').value,
      phone: document.getElementById('clientPhone').value,
      address: document.getElementById('clientAddress').value,
      state: document.getElementById('clientState').value,
      city: document.getElementById('clientCity').value,
      status: document.getElementById('clientStatus').value,
      contractType: document.getElementById('clientContractType').value,
      joinDate: document.getElementById('clientJoinDate').value,
      consumption: document.getElementById('clientConsumption').value,
      discount: document.getElementById('clientDiscount').value,
      database: this.currentBase // Salva com a base selecionada
    };

    if (data.cpf && !validateCPF(data.cpf)) {
      showToast("CPF inválido.", "warning");
      return;
    }
    if (data.cnpj && !validateCNPJ(data.cnpj)) {
      showToast("CNPJ inválido.", "warning");
      return;
    }

    try {
      await this.service.save(id, data);
      showToast('Salvo com sucesso!', 'success');
      const modalEl = document.getElementById('clientModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
      this.loadDataForBase(this.currentBase);
    } catch (err) { console.error(err); showToast('Erro ao salvar.', 'danger'); }
  }
}