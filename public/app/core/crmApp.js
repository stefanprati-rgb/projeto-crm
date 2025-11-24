import { ClientService } from "../services/clientService.js";
import { ClientsTable } from "../features/clientsTable.js";
import { renderKPIs, renderClientsChart, renderStatusChart } from "../features/dashboard.js";
import { readExcelFile, mapRowToClient, exportJSON, exportExcel } from "../features/importExport.js";
import { showToast } from "../ui/toast.js";
import { renderFinanceKPIs, renderRevenueTrend, renderAgingChart } from "../features/financeDashboard.js";
import { InvoiceService } from "../services/invoiceService.js";
import { readInvoicesExcel } from "../features/importers/invoicesImporter.js";

// ESTA É A CLASSE PRINCIPAL DO APP
export class CRMApp {
  
  // O constructor agora aceita db, auth, e o NOVO userRole
  constructor(db, auth, userRole) {
    this.clients = [];
    this.invoices = []; // dados de faturamento
    this.invoiceService = null; // service de faturamento
    this.unsubscribeInvoices = null; // unsubscribe do listener

    this.db = db;
    this.auth = auth;
    this.userRole = userRole; // Guardamos a função (editor ou visualizador)

    this.service = new ClientService(db);
    this.table = new ClientsTable(this.userRole); // **NOVO**: Passamos a função para a Tabela

    this.clientsChartRef = { value: null };
    this.statusChartRef = { value: null };

    this.activeSection = 'dashboard';
    this.modal = null;
    this.unsubscribe = null; // Para "desligar" o listener ao sair

    this.init();
  }

  init() {
    const modalEl = document.getElementById('clientModal');
    if (modalEl) this.modal = new bootstrap.Modal(modalEl);

    // **NOVO**: Esconde botões se for 'visualizador'
    this.initRoleBasedUI();

    this.bindNav();
    this.bindActions();
    
    // Guardamos a função "unsubscribe" para usar no destroy()
    this.unsubscribe = this.service.listen(
      (data) => { this.clients = data; this.refreshUI(); },
      (err) => { console.error(err); showToast("Erro ao conectar ao banco de dados.", "danger"); }
    );

    // === FINANCEIRO: ouvir invoices em tempo real ===
    this.invoiceService = new InvoiceService(this.db);
    this.unsubscribeInvoices = this.invoiceService.listen(
      (rows) => {
        this.invoices = rows;
        if (this.activeSection === 'finance') this.updateFinance();
      },
      (err) => { console.error(err); showToast("Erro ao carregar faturamento.", "danger"); }
    );
  }

  // **NOVO**: Método para "limpar" o app ao fazer logout
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe(); // Desliga o "ouvinte" do Firestore (clientes)
    }
    if (this.unsubscribeInvoices) {
      this.unsubscribeInvoices();
      this.unsubscribeInvoices = null;
    }
    console.log("CRMApp instance destroyed and listeners detached.");
  }

  // **NOVO**: Método que esconde botões com base na função
  initRoleBasedUI() {
    // Esconde os botões de "Editor" se o utilizador for "Visualizador"
    if (this.userRole === 'visualizador') {
      document.getElementById('importExcelButton')?.classList.add('d-none');
      document.getElementById('addClientButton')?.classList.add('d-none');
      
      // Também podemos fazer o modal ser "read-only" (a Tabela já vai esconder o botão de editar)
      // Por segurança, vamos esconder o botão de salvar do modal
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
    // Filtros tabela
    document.getElementById('searchInput')?.addEventListener('input', () => this.table.applyFilters(this.clients));
    document.getElementById('statusFilter')?.addEventListener('change', () => this.table.applyFilters(this.clients));
    document.getElementById('typeFilter')?.addEventListener('change', () => this.table.applyFilters(this.clients));
    document.getElementById('cityFilter')?.addEventListener('input', () => this.table.applyFilters(this.clients));
    document.getElementById('clearFiltersButton')?.addEventListener('click', () => { this.table.clearFilters(); this.table.applyFilters(this.clients); });

    // Import/Export (Botões agora estão no cabeçalho, mas os IDs são os mesmos)
    document.getElementById('importExcelButton')?.addEventListener('click', () => document.getElementById('excelFileInput').click());
    document.getElementById('excelFileInput')?.addEventListener('change', (e) => this.handleExcelImport(e));
    document.getElementById('exportDataButton')?.addEventListener('click', () => exportJSON(this.clients));
    document.getElementById('exportExcelButton')?.addEventListener('click', () => exportExcel(this.clients));

    // === FINANCEIRO: Importar FATURAMENTO via Excel ===
    document.getElementById('importInvoicesBtn')?.addEventListener('click', () => {
      document.getElementById('invoicesFileInput')?.click();
    });

    document.getElementById('invoicesFileInput')?.addEventListener('change', async (e) => {
      if (this.userRole !== 'editor') { showToast("Você não tem permissão para importar faturamento.", "danger"); return; }
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Lendo planilha de faturamento...', 'info');
        const rows = await readInvoicesExcel(file); // ← converte a aba "Acompanhamento FATURAMENTO"
        showToast(`Importando ${rows.length} faturas...`, 'info');
        await this.invoiceService.batchImport(rows, 400);
        showToast('Faturamento importado com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Falha ao importar faturamento. Verifique o arquivo.', 'danger');
      } finally {
        e.target.value = null;
      }
    });

    // CRUD Modal (Botão agora está no cabeçalho, mas o ID é o mesmo)
    document.getElementById('addClientButton')?.addEventListener('click', () => this.showClientModal());
    document.getElementById('clientForm')?.addEventListener('submit', (e) => this.handleSaveClient(e));
    document.getElementById('clientModal')?.addEventListener('hidden.bs.modal', () => {
      document.getElementById('clientForm').reset();
      document.getElementById('clientId').value = '';
    });

    // Ações de edição/remoção (delegação)
    document.getElementById('clientsTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'edit') {
        // Se for "Editor", abre para editar. Se for "Visualizador", abre para ver (o showClientModal trata disso)
        this.showClientModal(id);
      }
      
      if (action === 'delete') {
        // Verificação dupla de segurança
        if (this.userRole !== 'editor') {
          showToast("Você não tem permissão para esta ação.", "warning");
          return;
        }
        this.handleDeleteClient(id);
      }
    });
  }

  // **ALTERAÇÃO AQUI**
  showSection(sectionId) {
    this.activeSection = sectionId;

    // **NOVO**: Atualiza o título no cabeçalho
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) {
      titleEl.textContent =
        sectionId === 'dashboard' ? 'Dashboard' :
        sectionId === 'clients'   ? 'Clientes'  :
        sectionId === 'finance'   ? 'Financeiro' :
        titleEl.textContent;
    }

    // Ativa a secção correta
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`)?.classList.add('active');
    
    // Ativa o link da sidebar correto
    document.querySelectorAll('.nav-link[data-section]').forEach(a => a.classList.toggle('active', a.dataset.section === sectionId));
    
    // Atualiza os dados da secção
    if (sectionId === 'dashboard') this.updateDashboard();
    if (sectionId === 'clients')   this.table.applyFilters(this.clients);
    if (sectionId === 'finance')   this.updateFinance(); // <<< NOVO
  }

  refreshUI() {
    if (this.activeSection === 'dashboard') this.updateDashboard();
    if (this.activeSection === 'clients')   this.table.applyFilters(this.clients);
    if (this.activeSection === 'finance')   this.updateFinance(); // <<< NOVO
  }

  updateDashboard() {
    renderKPIs({
      total: 'kpi-total-clients',
      active: 'kpi-active-clients',
      overdue: 'kpi-overdue-clients',
      revenue: 'kpi-monthly-revenue'
    }, this.clients);

    const ctxLine = document.getElementById('clientsChart')?.getContext('2d');
    const ctxPie  = document.getElementById('statusChart')?.getContext('2d');
    if (ctxLine) renderClientsChart(ctxLine, this.clients, this.clientsChartRef);
    if (ctxPie)  renderStatusChart(ctxPie, this.clients, this.statusChartRef);
  }

  // === NOVO MÉTODO: DASHBOARD FINANCEIRO ===
  updateFinance() {
    // KPIs financeiros (ids de elementos precisam existir no HTML)
    renderFinanceKPIs(
      { emitido: 'kpi-emitido', pago: 'kpi-pago', inadimplencia: 'kpi-inad', dso: 'kpi-dso', energia: 'kpi-energia' },
      this.invoices
    );

    // Gráficos
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
    
    // **NOVO**: Se for visualizador, mude o título e desative o formulário
    if (this.userRole === 'visualizador') {
      title.textContent = 'Ver Cliente';
      // Desativa todos os campos do formulário
      Array.from(f.elements).forEach(el => el.disabled = true);
    } else {
      title.textContent = id ? 'Editar Cliente' : 'Novo Cliente';
      // Garante que os campos estão ativos para editores
      Array.from(f.elements).forEach(el => el.disabled = false);
    }

    if (id) {
      const c = this.clients.find(x => x.id === id);
      if (c) {
        document.getElementById('clientId').value = c.id;
        ['Name','ExternalId','Cpf','Cnpj','Email','Phone','Cep','Address','State','City','Status','ContractType','JoinDate','Consumption','Discount']
          .forEach(field => {
            const el = document.getElementById(`client${field}`);
            if (!el) return;
            if (field === 'JoinDate' && c.joinDate) el.value = c.joinDate.split('T')[0];
            else el.value = c[field.charAt(0).toLowerCase()+field.slice(1)] ?? '';
          });
      }
    }
    this.modal?.show();
  }

  async handleSaveClient(e) {
    e.preventDefault();
    
    // **NOVO**: Verificação de segurança
    if (this.userRole !== 'editor') {
      showToast("Você não tem permissão para salvar.", "danger");
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
      showToast(id ? 'Cliente atualizado!' : 'Cliente criado!', 'success');
      this.modal?.hide();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar cliente. Verifique as permissões.', 'danger');
    }
  }

  async handleDeleteClient(id) {
    // **NOVO**: Verificação de segurança
    if (this.userRole !== 'editor') {
      showToast("Você não tem permissão para excluir.", "danger");
      return;
    }
    
    // Nós já fizemos a verificação no bindActions, mas é bom ter a certeza.
    // O ideal era ter um modal de confirmação aqui.
    try {
      await this.service.delete(id);
      showToast('Cliente excluído.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir. Verifique as permissões.', 'danger');
    }
  }

  async handleExcelImport(e) {
    // **NOVO**: Verificação de segurança
    if (this.userRole !== 'editor') {
      showToast("Você não tem permissão para importar.", "danger");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;
    showToast('Lendo planilha...', 'info');
    try {
      const rows = await readExcelFile(file);
      showToast(`Importando ${rows.length} registros...`, 'info');
      
      // Passamos a lista de clientes atuais para evitar duplicação
      await this.service.batchImport(rows, mapRowToClient, this.clients, 400);
      
      showToast('Importação concluída!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao importar planilha. Verifique as permissões.', 'danger');
    }
    e.target.value = null;
  }
}
