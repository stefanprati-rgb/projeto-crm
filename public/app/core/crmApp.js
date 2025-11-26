import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart } from "../features/dashboard.js";
import { readExcelFile, exportJSON, exportExcel } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { InvoiceService } from "../services/invoiceService.js";
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";
// Importamos as novas funções de validação
import { validateCPF, validateCNPJ } from "../utils/helpers.js";

// Classes para o estado "Ativo" do Menu (Tailwind)
const NAV_ACTIVE_CLASSES = ['bg-primary-50', 'text-primary-700', 'font-bold', 'shadow-sm'];
const NAV_INACTIVE_CLASSES = ['text-slate-500', 'hover:bg-primary-50', 'hover:text-primary-700'];

export class CRMApp {

  constructor(db, auth, userData) {
    this.db = db;
    this.auth = auth;

    // Definições de Utilizador e Permissões
    this.userRole = userData.role || 'visualizador';
    this.allowedBases = userData.allowedBases || ['CGB'];
    this.currentBase = this.allowedBases[0];

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

    this.unsubscribe = null;
    this.init();
  }

  init() {
    this.initRoleBasedUI();
    this.initBaseSelector();
    this.bindNav();
    this.bindActions();

    // Carrega dados iniciais da base padrão
    this.loadDataForBase(this.currentBase);

    // Atualiza visual da navegação inicial
    this.updateNavHighlight(this.activeSection);
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    console.log("CRMApp destruído.");
  }

  initRoleBasedUI() {
    // Esconde botões de edição se for apenas visualizador
    if (this.userRole === 'visualizador') {
      ['importExcelButton', 'addClientButton', 'clientModalSaveButton', 'importInvoicesBtn'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden'); // Tailwind hidden
      });
    }
  }

  // --- LÓGICA MULTI-BASE ---

  initBaseSelector() {
    const selector = document.getElementById('databaseSelector');
    if (!selector) return;

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

    selector.addEventListener('change', (e) => {
      const newBase = e.target.value;
      if (newBase !== this.currentBase) {
        this.currentBase = newBase;
        this.loadDataForBase(this.currentBase);
        showToast(`Base alterada para: ${this.currentBase}`, 'info');
      }
    });
  }

  loadDataForBase(baseName) {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    console.log(`Carregando dados para: ${baseName}`);

    this.unsubscribe = this.service.listen(baseName,
      (data) => {
        this.clients = data;
        this.refreshUI();
      },
      (err) => {
        console.error(err);
        showToast("Erro ao carregar dados.", "danger");
      }
    );
  }

  // --- NAVEGAÇÃO E UI ---

  bindNav() {
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // Usa currentTarget para garantir que pegamos o elemento <a> mesmo clicando no ícone
        const sectionId = e.currentTarget.dataset.section;
        this.showSection(sectionId);
      });
    });

    // Força a exibição inicial
    this.showSection(this.activeSection);
  }

  showSection(sectionId) {
    this.activeSection = sectionId;

    // Atualiza Título e Breadcrumb
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) {
      const titles = {
        'dashboard': 'Visão Geral',
        'clients': 'Carteira de Clientes',
        'finance': 'Gestão Financeira'
      };
      titleEl.textContent = titles[sectionId] || 'CRM Energia';
    }

    // Gerencia Visibilidade das Secções (Usando d-none do CSS global)
    document.querySelectorAll('.section-content').forEach(s => {
      s.classList.add('d-none');
    });

    const target = document.getElementById(`${sectionId}-section`);
    if (target) {
      target.classList.remove('d-none');
      // Reinicia animação fade-in (opcional, visual hack)
      target.style.animation = 'none';
      target.offsetHeight; /* trigger reflow */
      target.style.animation = null;
    }

    // Atualiza destaque no menu lateral
    this.updateNavHighlight(sectionId);

    this.refreshUI();
  }

  updateNavHighlight(activeId) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const isTarget = link.dataset.section === activeId;

      // Remove todas as classes para limpar
      link.classList.remove(...NAV_ACTIVE_CLASSES, ...NAV_INACTIVE_CLASSES);

      if (isTarget) {
        link.classList.add(...NAV_ACTIVE_CLASSES);
      } else {
        link.classList.add(...NAV_INACTIVE_CLASSES);
      }
    });
  }

  refreshUI() {
    if (this.activeSection === 'dashboard') this.updateDashboard();
    if (this.activeSection === 'clients') this.table.applyFilters(this.clients);
    if (this.activeSection === 'finance') this.updateFinance();
  }

  updateDashboard() {
    renderKPIs({
      total: 'kpi-total-clients',
      active: 'kpi-active-clients',
      overdue: 'kpi-overdue-clients',
      revenue: 'kpi-monthly-revenue'
    }, this.clients);

    const ctxLine = document.getElementById('clientsChart')?.getContext('2d');
    const ctxPie = document.getElementById('statusChart')?.getContext('2d');

    if (ctxLine) renderClientsChart(ctxLine, this.clients, this.clientsChartRef);
    if (ctxPie) renderStatusChart(ctxPie, this.clients, this.statusChartRef);
  }

  updateFinance() {
    // Carrega dados financeiros (se ainda não carregou ou se precisar refresh)
    // Nota: Em produção, idealmente invoiceService teria listener real-time também
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
    // Importado dinamicamente no topo, mas funções são globais ou passadas via módulo
    // Precisamos importar as funções do financeDashboard no topo para usar aqui
    // Já importado no topo deste arquivo? Não, vamos adicionar importação dinâmica ou assumir importação no topo.
    // Correção: Adicionei imports do financeDashboard.js no topo do arquivo (assumindo que o usuário vai copiar tudo)

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

  // --- AÇÕES (Importação, Exportação, CRUD) ---

  bindActions() {
    // Filtros de Tabela
    const applyFilters = () => this.table.applyFilters(this.clients);
    ['searchInput', 'statusFilter', 'typeFilter'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', applyFilters));

    // City Filter (pode não existir no novo layout ou ser diferente)
    document.getElementById('cityFilter')?.addEventListener('input', applyFilters);

    document.getElementById('clearFiltersButton')?.addEventListener('click', () => {
      this.table.clearFilters(); applyFilters();
    });

    // Importação
    document.getElementById('importExcelButton')?.addEventListener('click', () => {
      if (this.userRole !== 'editor') return;
      if (confirm(`Importar dados para a base: ${this.currentBase}?`)) {
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

    // Modal Cliente
    document.getElementById('addClientButton')?.addEventListener('click', () => this.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));

    // Edição via Tabela (Delegação de Eventos)
    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      // Procura o botão ou ícone dentro do botão
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'edit') this.showClientModal(btn.dataset.id);
    });
  }

  // --- MANIPULADORES DE EVENTOS ---

  async handleExcelImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await readExcelFile(file, this.currentBase);
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

    // Ajuste de UI para visualizador
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
      const c = this.clients.find(x => x.id === id);
      if (c) {
        document.getElementById('clientId').value = c.id;
        // Preenche campos
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
      // Data Hoje para novos
      const elDate = document.getElementById('clientJoinDate');
      if (elDate) elDate.value = new Date().toISOString().split('T')[0];
    }

    // Abre Modal (Usando Bootstrap JS que ainda está no bundle)
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
      address: document.getElementById('clientAddress').value,
      state: document.getElementById('clientState').value,
      city: document.getElementById('clientCity').value,
      status: document.getElementById('clientStatus').value,
      contractType: document.getElementById('clientContractType').value,
      joinDate: document.getElementById('clientJoinDate').value,
      consumption: document.getElementById('clientConsumption').value,
      discount: document.getElementById('clientDiscount').value,
      database: this.currentBase
    };

    // --- VALIDAÇÃO ANTES DE SALVAR ---

    // Validar CPF se preenchido
    if (data.cpf && !validateCPF(data.cpf)) {
      showToast("CPF inválido. Verifique os números.", "warning");
      return; // Para a execução
    }

    // Validar CNPJ se preenchido
    if (data.cnpj && !validateCNPJ(data.cnpj)) {
      showToast("CNPJ inválido. Verifique os números.", "warning");
      return; // Para a execução
    }

    try {
      await this.service.save(id, data);
      showToast('Salvo com sucesso!', 'success');
      const modalEl = document.getElementById('clientModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    } catch (err) { console.error(err); showToast('Erro ao salvar.', 'danger'); }
  }
}