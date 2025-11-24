import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart } from "../features/dashboard.js";
// ATENÇÃO: Import ajustado (removemos mapRowToClient pois o importExport já faz isso internamente agora)
import { readExcelFile, exportJSON, exportExcel } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { renderFinanceKPIs, renderRevenueTrend, renderAgingChart } from "../features/financeDashboard.js";
import { InvoiceService } from "../services/invoiceService.js";
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";

export class CRMApp {

  constructor(db, auth, userRole) {
    this.clients = [];
    this.invoices = [];
    this.invoiceService = null;
    this.unsubscribeInvoices = null;

    this.db = db;
    this.auth = auth;
    this.userRole = userRole;

    this.service = new ClientService(db);
    this.table = new ClientsTable(this.userRole);

    this.clientsChartRef = { value: null };
    this.statusChartRef = { value: null };

    this.activeSection = 'dashboard';
    this.modal = null;
    this.unsubscribe = null;

    this.init();
  }

  init() {
    const modalEl = document.getElementById('clientModal');
    if (modalEl) this.modal = new bootstrap.Modal(modalEl);

    this.initRoleBasedUI();
    this.bindNav();
    this.bindActions();

    this.unsubscribe = this.service.listen(
      (data) => { this.clients = data; this.refreshUI(); },
      (err) => { console.error(err); showToast("Erro ao conectar ao banco de dados.", "danger"); }
    );

    this.invoiceService = new InvoiceService(this.db);
    this.unsubscribeInvoices = this.invoiceService.listen(
      (rows) => {
        this.invoices = rows;
        if (this.activeSection === 'finance') this.updateFinance();
      },
      (err) => { console.error(err); showToast("Erro ao carregar faturamento.", "danger"); }
    );
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.unsubscribeInvoices) this.unsubscribeInvoices();
    console.log("CRMApp instance destroyed.");
  }

  initRoleBasedUI() {
    if (this.userRole === 'visualizador') {
      document.getElementById('importExcelButton')?.classList.add('d-none');
      document.getElementById('addClientButton')?.classList.add('d-none');
      document.getElementById('clientModalSaveButton')?.classList.add('d-none');
    }
  }

  bindNav() {
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSection(e.currentTarget.dataset.section);
      });
    });
    this.showSection(this.activeSection);
  }

  bindActions() {
    document.getElementById('searchInput')?.addEventListener('input', () => this.table.applyFilters(this.clients));
    document.getElementById('statusFilter')?.addEventListener('change', () => this.table.applyFilters(this.clients));
    document.getElementById('typeFilter')?.addEventListener('change', () => this.table.applyFilters(this.clients));
    document.getElementById('cityFilter')?.addEventListener('input', () => this.table.applyFilters(this.clients));
    document.getElementById('clearFiltersButton')?.addEventListener('click', () => { this.table.clearFilters(); this.table.applyFilters(this.clients); });

    document.getElementById('importExcelButton')?.addEventListener('click', () => document.getElementById('excelFileInput').click());
    document.getElementById('excelFileInput')?.addEventListener('change', (e) => this.handleExcelImport(e));

    document.getElementById('exportDataButton')?.addEventListener('click', () => exportJSON(this.clients));
    document.getElementById('exportExcelButton')?.addEventListener('click', () => exportExcel(this.clients));

    document.getElementById('importInvoicesBtn')?.addEventListener('click', () => document.getElementById('invoicesFileInput')?.click());
    document.getElementById('invoicesFileInput')?.addEventListener('change', async (e) => {
      if (this.userRole !== 'editor') { showToast("Permissão negada.", "danger"); return; }
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Lendo faturamento...', 'info');
        const rows = await readInvoicesExcel(file);
        await this.invoiceService.batchImport(rows, 400);
        showToast('Faturamento importado!', 'success');
      } catch (err) { console.error(err); showToast('Erro na importação.', 'danger'); }
      e.target.value = null;
    });

    document.getElementById('addClientButton')?.addEventListener('click', () => this.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));
    document.getElementById('clientModal')?.addEventListener('hidden.bs.modal', () => {
      document.getElementById('clientForm').reset();
      document.getElementById('clientId').value = '';
    });

    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') this.showClientModal(id);
    });
  }

  showSection(sectionId) {
    this.activeSection = sectionId;
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) {
      titleEl.textContent =
        sectionId === 'dashboard' ? 'Dashboard' :
          sectionId === 'clients' ? 'Clientes' :
            sectionId === 'finance' ? 'Financeiro' : titleEl.textContent;
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
    renderFinanceKPIs({ emitido: 'kpi-emitido', pago: 'kpi-pago', inadimplencia: 'kpi-inad', dso: 'kpi-dso', energia: 'kpi-energia' }, this.invoices);
    const ctx1 = document.getElementById('revenueTrend')?.getContext('2d');
    const ctx2 = document.getElementById('agingChart')?.getContext('2d');
    if (ctx1) renderRevenueTrend(ctx1, this.invoices);
    if (ctx2) renderAgingChart(ctx2, this.invoices);
  }

  showClientModal(id = null) {
    const f = document.getElementById('clientForm');
    f.reset();
    document.getElementById('clientId').value = '';
    const title = document.getElementById('clientModalTitle');

    if (this.userRole === 'visualizador') {
      title.textContent = 'Ver Cliente';
      Array.from(f.elements).forEach(el => el.disabled = true);
    } else {
      title.textContent = id ? 'Editar Cliente' : 'Novo Cliente';
      Array.from(f.elements).forEach(el => el.disabled = false);
    }

    if (id) {
      const c = this.clients.find(x => x.id === id);
      if (c) {
        document.getElementById('clientId').value = c.id;
        // Mapeamento de campos do modal
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
    }
    this.modal?.show();
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
      discount: document.getElementById('clientDiscount').value
    };

    try {
      await this.service.save(id, data);
      showToast('Salvo com sucesso!', 'success');
      this.modal?.hide();
    } catch (err) { console.error(err); showToast('Erro ao salvar.', 'danger'); }
  }

  async handleExcelImport(e) {
    if (this.userRole !== 'editor') { showToast("Permissão negada.", "danger"); return; }

    const file = e.target.files[0];
    if (!file) return;

    // ATENÇÃO: Agora chamamos a função que processa e salva DIRETO
    try {
      // O readExcelFile agora é a função 'processAndUpload' que renomeamos no importExport.js
      // Ela já mostra os toasts e salva no Firestore
      await readExcelFile(file);

      // Recarregamos a UI
      this.refreshUI();

    } catch (err) {
      console.error(err);
      // O toast de erro já deve ter sido mostrado pelo importExport, mas garantimos aqui
      if (!document.querySelector('.toast.bg-danger')) {
        showToast('Erro na importação.', 'danger');
      }
    }
    e.target.value = null;
  }

} // <--- AQUI ESTAVA O PROBLEMA: Faltava fechar esta chave da Classe