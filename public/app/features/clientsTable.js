import { statusBadge } from "../utils/helpers.js";

export class ClientsTable {
  
  // **NOVO**: O constructor agora recebe e guarda a função do utilizador
  constructor(userRole) {
    this.filtered = [];
    this.currentPage = 1;
    this.perPage = 10;
    this.userRole = userRole; // 'editor' ou 'visualizador'
  }

  applyFilters(clients) {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const type = document.getElementById('typeFilter').value;
    const city = document.getElementById('cityFilter').value.toLowerCase();

    this.filtered = clients.filter(c => {
      const name = c.name || '';
      const cpf = c.cpf || '';
      const cnpj = c.cnpj || '';
      const email = c.email || '';
      const ccity = c.city || '';
      const matchesSearch = !search ||
        name.toLowerCase().includes(search) ||
        cpf.replace(/[.\-/]/g, '').includes(search) ||
        cnpj.replace(/[.\-/]/g, '').includes(search) ||
        email.toLowerCase().includes(search);
      const matchesStatus = !status || c.status === status;
      const matchesType = !type || c.contractType === type;
      const matchesCity = !city || ccity.toLowerCase().includes(city);
      return matchesSearch && matchesStatus && matchesType && matchesCity;
    });

    this.currentPage = 1;
    this.render();
  }

  clearFilters() {
    ['searchInput','statusFilter','typeFilter','cityFilter'].forEach(id => document.getElementById(id).value = '');
  }

  changePage(p) { this.currentPage = p; this.render(); }

  render() {
    const tbody = document.getElementById('clientsTableBody');
    const nav = document.getElementById('pagination-nav');
    const summary = document.getElementById('pagination-summary');
    if (!tbody || !nav || !summary) return;

    tbody.innerHTML = '';
    if (this.filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
        <i class="fas fa-users"></i><h5>Nenhum cliente encontrado</h5><p>Tente ajustar os filtros ou importar novos dados.</p>
      </div></td></tr>`;
      nav.innerHTML = ''; summary.textContent = 'Mostrando 0 de 0'; return;
    }

    const start = (this.currentPage - 1) * this.perPage;
    const pageClients = this.filtered.slice(start, start + this.perPage);

    pageClients.forEach(c => {
      const tr = document.createElement('tr');
      
      // **NOVO**: Lógica para decidir quais botões de ação mostrar
      let actionsHtml = '';
      if (this.userRole === 'editor') {
        actionsHtml = `
          <button class="btn btn-outline-primary btn-sm btn-icon" data-id="${c.id}" data-action="edit" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn btn-outline-danger btn-sm btn-icon ms-1" data-id="${c.id}" data-action="delete" title="Excluir"><i class="fas fa-trash"></i></button>
        `;
      } else {
        // O Visualizador pode ver os detalhes (o crmApp vai abrir o modal read-only)
        actionsHtml = `
          <button class="btn btn-outline-secondary btn-sm btn-icon" data-id="${c.id}" data-action="edit" title="Visualizar"><i class="fas fa-eye"></i></button>
        `;
      }

      tr.innerHTML = `
        <td class="ps-3">
          <div class="client-name">${c.name || 'Nome não informado'}</div>
          <div class="client-subtext">${c.email || c.externalId || 'Sem info extra'}</div>
        </td>
        <td>${c.cpf || c.cnpj || 'N/A'}</td>
        <td>${statusBadge(c.status)}</td>
        <td><div class="client-subtext">${c.city || 'N/A'}, ${c.state || 'N/A'}</div></td>
        <td>${c.consumption || 0} kWh</td>
        <td class="text-end pe-3">
          ${actionsHtml}
        </td>`;
      tbody.appendChild(tr);
    });

    // Paginação
    const total = this.filtered.length;
    const totalPages = Math.ceil(total / this.perPage);
    const startItem = total === 0 ? 0 : start + 1;
    const endItem = Math.min(start + this.perPage, total);
    summary.textContent = `Mostrando ${startItem}-${endItem} de ${total} clientes`;

    nav.innerHTML = '';
    if (totalPages > 1) {
      const ul = document.createElement('ul');
      ul.className = 'pagination pagination-sm mb-0';
      ul.innerHTML += `<li class="page-item ${this.currentPage===1?'disabled':''}"><a class="page-link" href="#" data-page="${this.currentPage-1}">&laquo;</a></li>`;
      for (let i=1;i<=totalPages;i++){
        ul.innerHTML += `<li class="page-item ${this.currentPage===i?'active':''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }
      ul.innerHTML += `<li class="page-item ${this.currentPage===totalPages?'disabled':''}"><a class="page-link" href="#" data-page="${this.currentPage+1}">&raquo;</a></li>`;
      nav.appendChild(ul);
      nav.querySelectorAll('.page-link').forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.dataset.page, 10);
        if (!Number.isNaN(p)) this.changePage(p);
      }));
    }
  }
}
