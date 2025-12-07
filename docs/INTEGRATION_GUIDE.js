// Integração do TicketsUI no crmApp.js
// Copie e cole este código nas seções indicadas

// ========== 1. IMPORTS (Adicionar após linha 8) ==========
import { TicketsUI } from "../features/ticketsUI.js";
import { showButtonLoading, showSkeleton, showEmptyState } from "../ui/loadingStates.js";

// ========== 2. CONSTRUCTOR (Adicionar após linha 53) ==========
// Após: this.taskService = new TaskService();
this.ticketsUI = new TicketsUI(db, auth);

// ========== 3. MÉTODO showSection (Adicionar no switch/if) ==========
// Localizar o método showSection (linha ~235)
// Adicionar após o bloco de finance:

if (sectionId === 'tickets') {
    this.ticketsUI.init();
}

// ========== 4. MÉTODO destroy (Adicionar linha ~89) ==========
// Adicionar antes de console.log:
if (this.ticketsUI) {
    this.ticketsUI.destroy();
}

// ========== 5. MÉTODO refreshUI (Adicionar linha ~262) ==========
// Adicionar após o bloco de finance:
if (this.activeSection === 'tickets') {
    this.ticketsUI.init();
}

// ========== CÓDIGO COMPLETO DAS SEÇÕES ==========

/* 
  SEÇÃO 1: IMPORTS (Linhas 1-13)
  Substituir:
*/
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

/*
  SEÇÃO 2: CONSTRUCTOR - Serviços (Linhas 47-55)
  Substituir:
*/
// Serviços
this.service = new ClientService(db);
this.invoiceService = new InvoiceService(db);
this.timelineService = new TimelineService();
this.taskService = new TaskService();
this.ticketsUI = new TicketsUI(db, auth);
this.table = new ClientsTable(this.userRole);

/*
  SEÇÃO 3: MÉTODO destroy (Linhas 85-90)
  Substituir:
*/
destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.timelineUnsubscribe) this.timelineUnsubscribe();
    if (this.tasksUnsubscribe) this.tasksUnsubscribe();
    if (this.ticketsUI) this.ticketsUI.destroy();
    console.log("CRMApp destruído.");
}

/*
  SEÇÃO 4: MÉTODO showSection (Linha ~235)
  Adicionar após o bloco existente:
*/
showSection(sectionId) {
    this.activeSection = sectionId;
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) {
        const titles = {
            'dashboard': 'Visão Geral',
            'clients': 'Carteira de Clientes',
            'finance': 'Gestão Financeira',
            'tickets': 'Central de Tickets'  // ADICIONAR
        };
        titleEl.textContent = titles[sectionId] || 'CRM Energia';
    }
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('d-none'));
    const target = document.getElementById(`${sectionId}-section`);
    if (target) { target.classList.remove('d-none'); target.classList.add('fade-in'); }
    this.updateNavHighlight(sectionId);
    this.refreshUI();
}

/*
  SEÇÃO 5: MÉTODO refreshUI (Linha ~258)
  Substituir:
*/
refreshUI() {
    if (this.activeSection === 'dashboard') this.updateDashboard();
    if (this.activeSection === 'clients') {
        this.table.applyFilters(this.tableData);
        this.updateLoadMoreUI();
    }
    if (this.activeSection === 'finance') this.updateFinance();
    if (this.activeSection === 'tickets') this.ticketsUI.init();  // ADICIONAR
}
