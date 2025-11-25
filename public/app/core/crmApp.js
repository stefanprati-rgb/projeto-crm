import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart } from "../features/dashboard.js";
import { readExcelFile, exportJSON, exportExcel } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { InvoiceService } from "../services/invoiceService.js";
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";

export class CRMApp {

  constructor(db, auth, userData) {
    this.db = db;
    this.auth = auth;

    // Definições de Utilizador e Permissões
    this.userRole = userData.role || 'visualizador';
    this.allowedBases = userData.allowedBases || ['CGB']; // Ex: ['CGB', 'EGS']
    this.currentBase = this.allowedBases[0]; // Seleciona a primeira base por defeito

    // Dados em memória
    this.clients = [];
    this.invoices = [];

    // Serviços
    this.service = new ClientService(db);
    this.invoiceService = new InvoiceService(db);

    // Componentes UI
    this.table = new ClientsTable(this.userRole);
    this.clientsChartRef = { value: null };
    this.statusChartRef = { value: null };
    this.activeSection = 'dashboard';

    this.unsubscribe = null; // Listener do Firestore
    this.init();
  }

  init() {
    this.initRoleBasedUI();
    this.initBaseSelector(); // Configura o dropdown de bases
    this.bindNav();
    this.bindActions();

    // Carrega dados iniciais da base padrão
    this.loadDataForBase(this.currentBase);
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    console.log("CRMApp destruído.");
  }

  initRoleBasedUI() {
    if (this.userRole === 'visualizador') {
      document.getElementById('importExcelButton')?.classList.add('d-none');
      document.getElementById('addClientButton')?.classList.add('d-none');
      // Se houver modal save button
      document.getElementById('clientModalSaveButton')?.classList.add('d-none');
    }
  }

  // --- LÓGICA MULTI-BASE ---

  initBaseSelector() {
    const selector = document.getElementById('databaseSelector');
    if (!selector) return;

    // Limpa e preenche com as bases permitidas
    selector.innerHTML = '';

    if (this.allowedBases.length === 0) {
      const opt = document.createElement('option');
      opt.text = "Sem acesso";
      selector.appendChild(opt);
      selector.disabled = true;
      return;
    }

    this.allowedBases.forEach(base => {
      const opt = document.createElement('option');
      opt.value = base;
      opt.textContent = base;
      if (base === this.currentBase) opt.selected = true;
      selector.appendChild(opt);
    });

    // Evento: Troca de base recarrega os dados
    selector.addEventListener('change', (e) => {
      const newBase = e.target.value;
      if (newBase !== this.currentBase) {
        this.currentBase = newBase;
        this.loadDataForBase(this.currentBase);
        showToast(`A visualizar base: ${this.currentBase}`, 'info');
      }
    });
  }

  loadDataForBase(baseName) {
    // Remove listener antigo para não duplicar ou misturar dados
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Mostra estado de carregamento na tabela/dashboard se necessário
    console.log(`Carregando dados para: ${baseName}`);

    // Inicia novo listener filtrado
    this.unsubscribe = this.service.listen(baseName,
      (data) => {
        this.clients = data;
        this.refreshUI();
      },
      (err) => {
        console.error(err);
        showToast("Erro ao carregar dados. Verifique a conexão.", "danger");
      }
    );
  }

  // --- NAVEGAÇÃO E UI ---

  bindNav() {
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSection(e.currentTarget.dataset.section);
      });
    });
    this.showSection(this.activeSection);
  }

  showSection(sectionId) {
    this.activeSection = sectionId;

    // Atualiza Título
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) {
      const titles = { 'dashboard': 'Visão Geral', 'clients': 'Carteira de Clientes', 'finance': 'Gestão Financeira' };
      titleEl.textContent = titles[sectionId] || 'CRM Energia';
    }

    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`)?.classList.add('active');
    document.querySelectorAll('.nav-link[data-section]').forEach(a => a.classList.toggle('active', a.dataset.section === sectionId));

    this.refreshUI();
  }

  refreshUI() {
    if (this.activeSection === 'dashboard') this.updateDashboard();
    if (this.activeSection === 'clients') this.table.applyFilters(this.clients);
    if (this.activeSection === 'finance') this.updateFinance();
  }

  updateDashboard() {
    renderKPIs({ total: 'kpi-total-clients', active: 'kpi-active-clients', overdue: 'kpi-overdue-clients', revenue: 'kpi-monthly-revenue' }, this.clients);

    const ctxLine = document.getElementById('clientsChart')?.getContext('2d');
    const ctxPie = document.getElementById('statusChart')?.getContext('2d');

    if (ctxLine) renderClientsChart(ctxLine, this.clients, this.clientsChartRef);
    if (ctxPie) renderStatusChart(ctxPie, this.clients, this.statusChartRef);
  }

  updateFinance() {
    // Lógica financeira placeholder (será expandida com invoiceService)
    renderFinanceKPIs({ emitido: 'kpi-emitido', pago: 'kpi-pago', inadimplencia: 'kpi-inad', dso: 'kpi-dso', energia: 'kpi-energia' }, this.invoices);
    const ctx1 = document.getElementById('revenueTrend')?.getContext('2d');
    const ctx2 = document.getElementById('agingChart')?.getContext('2d');
    if (ctx1) renderRevenueTrend(ctx1, this.invoices);
    if (ctx2) renderAgingChart(ctx2, this.invoices);
  }

  // --- AÇÕES (Importação, Exportação, CRUD) ---

  bindActions() {
    // Filtros de Tabela (Busca local)
    const applyFilters = () => this.table.applyFilters(this.clients);
    ['searchInput', 'statusFilter', 'typeFilter', 'cityFilter'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', applyFilters));

    document.getElementById('clearFiltersButton')?.addEventListener('click', () => {
      this.table.clearFilters(); applyFilters();
    });

    // Importação de Clientes (Baseado na seleção atual)
    document.getElementById('importExcelButton')?.addEventListener('click', () => {
      if (this.userRole !== 'editor') return;
      // Confirmação visual para evitar erro de base
      if (confirm(`Atenção: Você vai importar dados para a base: ${this.currentBase}.\n\nConfirma?`)) {
        document.getElementById('excelFileInput').click();
      }
    });

    document.getElementById('excelFileInput')?.addEventListener('change', (e) => this.handleExcelImport(e));

    // Importação Financeira
    document.getElementById('importInvoicesBtn')?.addEventListener('click', () => document.getElementById('invoicesFileInput')?.click());
    document.getElementById('invoicesFileInput')?.addEventListener('change', (e) => this.handleInvoiceImport(e));

    // Exportação
    document.getElementById('exportDataButton')?.addEventListener('click', () => exportJSON(this.clients));
    document.getElementById('exportExcelButton')?.addEventListener('click', () => exportExcel(this.clients));

    // Modal de Cliente (Novo/Salvar)
    document.getElementById('addClientButton')?.addEventListener('click', () => this.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));

    // Edição via Tabela
    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'edit') this.showClientModal(btn.dataset.id);
    });
  }

  // --- MANIPULADORES DE EVENTOS ---

  async handleExcelImport(e) {
    if (this.userRole !== 'editor') return;
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Chama o readExcelFile passando a BASE ATUAL como destino
      await readExcelFile(file, this.currentBase);
      // O listener do Firestore atualizará a UI automaticamente
    } catch (err) { console.error(err); }
    e.target.value = null;
  }

  async handleInvoiceImport(e) {
    if (this.userRole !== 'editor') return;
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast('Lendo faturamento...', 'info');
      const rows = await readInvoicesExcel(file);
      // Nota: Idealmente invoiceService também deve filtrar por base no futuro
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
      if (btnSave) btnSave.classList.add('d-none');
    } else {
      title.textContent = id ? 'Editar Cliente' : 'Novo Cliente';
      Array.from(f.elements).forEach(el => el.disabled = false);
      if (btnSave) btnSave.classList.remove('d-none');
    }

    if (id) {
      const c = this.clients.find(x => x.id === id);
      if (c) {
        document.getElementById('clientId').value = c.id;
        // Preenchimento básico do formulário
        const fields = {
          'Name': c.name, 'ExternalId': c.externalId, 'Cpf': c.cpf, 'Cnpj': c.cnpj,
          'Email': c.email, 'Phone': c.phone, 'Cep': c.cep, 'Address': c.address,
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
      // Ao criar novo, define data de hoje
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

    const id = document.getElementById('clientId').value;
    const data = {
      name: document.getElementById('clientName').value,
      externalId: document.getElementById('clientExternalId').value,
      cpf: document.getElementById('clientCpf').value,
      cnpj: document.getElementById('clientCnpj').value,
      email: document.getElementById('clientEmail').value,
      phone: document.getElementById('clientPhone').value,
      cep: document.getElementById('clientCep').value,
      address: document.getElementById('clientAddress').value,
      state: document.getElementById('clientState').value,
      city: document.getElementById('clientCity').value,
      status: document.getElementById('clientStatus').value,
      contractType: document.getElementById('clientContractType').value,
      joinDate: document.getElementById('clientJoinDate').value,
      consumption: document.getElementById('clientConsumption').value,
      discount: document.getElementById('clientDiscount').value,
      // IMPORTANTE: Mantém a base atual ao criar/editar
      database: this.currentBase
    };

    try {
      await this.service.save(id, data);
      showToast('Salvo com sucesso!', 'success');
      const modalEl = document.getElementById('clientModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    } catch (err) { console.error(err); showToast('Erro ao salvar.', 'danger'); }
  }
}