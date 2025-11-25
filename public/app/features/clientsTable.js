import { statusBadge } from "../utils/helpers.js";

export class ClientsTable {

  constructor(userRole) {
    this.filtered = [];
    this.currentPage = 1;
    this.perPage = 10;
    this.userRole = userRole;
  }

  applyFilters(clients) {
    // Captura os valores dos inputs
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const type = document.getElementById('typeFilter').value;
    const city = document.getElementById('cityFilter').value.toLowerCase();

    this.filtered = clients.filter(c => {
      // Normalização de dados para evitar erros em campos vazios
      const name = c.name || '';
      const cpf = c.cpf || '';
      const cnpj = c.cnpj || '';
      const email = c.email || '';
      const instalacao = c.instalacao ? c.instalacao.toString() : ''; // UC

      const projeto = c.projeto || '';        // Projeto
      const distribuidora = c.distribuidora || ''; // Distribuidora
      const etapaUc = c.etapaUc || '';        // Etapa UC (futuro)

      // Lógica de Busca Geral: verifica se o texto digitado existe em qualquer um destes campos
      const matchesSearch = !search ||
        name.toLowerCase().includes(search) ||         // Razão Social
        cpf.replace(/[.\-/]/g, '').includes(search) ||
        cnpj.replace(/[.\-/]/g, '').includes(search) ||
        email.toLowerCase().includes(search) ||
        instalacao.includes(search) ||                 // UC
        projeto.toLowerCase().includes(search) ||      // Projeto
        distribuidora.toLowerCase().includes(search) || // Distribuidora
        etapaUc.toLowerCase().includes(search);

      const matchesStatus = !status || c.status === status;
      const matchesType = !type || c.contractType === type;
      const matchesCity = !city || (c.city && c.city.toLowerCase().includes(city));

      return matchesSearch && matchesStatus && matchesType && matchesCity;
    });

    this.currentPage = 1;
    this.render();
  }

  clearFilters() {
    ['searchInput', 'statusFilter', 'typeFilter', 'cityFilter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  changePage(p) { this.currentPage = p; this.render(); }

  render() {
    const tbody = document.getElementById('clientsTableBody');
    const nav = document.getElementById('pagination-nav');
    const summary = document.getElementById('pagination-summary');

    if (!tbody || !nav || !summary) return;

    tbody.innerHTML = '';

    if (this.filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="text-center p-4 text-muted">
        <i class="fas fa-search fa-2x mb-3"></i><h5>Nenhum cliente encontrado</h5><p>Tente ajustar os filtros.</p>
      </div></td></tr>`;
      nav.innerHTML = '';
      summary.textContent = 'Mostrando 0 de 0';
      return;
    }

    const start = (this.currentPage - 1) * this.perPage;
    const pageClients = this.filtered.slice(start, start + this.perPage);

    pageClients.forEach(c => {
      const tr = document.createElement('tr');

      // === AÇÕES: REMOVIDA A OPÇÃO DE EXCLUIR ===
      let actionsHtml = '';
      if (this.userRole === 'editor') {
        actionsHtml = `
          <button class="btn btn-outline-primary btn-sm btn-icon" data-id="${c.id}" data-action="edit" title="Editar"><i class="fas fa-edit"></i></button>
        `;
      } else {
        actionsHtml = `
          <button class="btn btn-outline-secondary btn-sm btn-icon" data-id="${c.id}" data-action="edit" title="Visualizar"><i class="fas fa-eye"></i></button>
        `;
      }

      // === STATUS RATEIO (Visualização) ===
      let statusRateioHtml = '';
      if (c.statusRateio) {
        // Cores sugeridas para status de rateio
        let badgeClass = 'bg-light text-dark border';
        const st = c.statusRateio.toLowerCase();
        if (st.includes('apto')) badgeClass = 'bg-success text-white';
        else if (st.includes('retirar')) badgeClass = 'bg-danger text-white';
        else if (st.includes('acompanhar') || st.includes('crédito')) badgeClass = 'bg-warning text-dark';

        statusRateioHtml = `<div class="mt-1"><span class="badge ${badgeClass}" style="font-size: 0.7em">${c.statusRateio}</span></div>`;
      }

      // === PROJETO/DISTRIBUIDORA ===
      const projetoInfo = c.projeto ? `<div style="font-size: 0.75em; color: #666"><i class="fas fa-solar-panel me-1"></i>${c.projeto}</div>` : '';

      // === UC ===
      const ucInfo = c.instalacao ? `<small class="text-muted d-block font-monospace">UC: ${c.instalacao}</small>` : '';

      tr.innerHTML = `
        <td class="ps-3">
          <div class="fw-bold text-primary">${c.name || 'Sem Nome'}</div>
          ${projetoInfo}
        </td>
        <td>
          <div>${c.cpf || c.cnpj || 'N/A'}</div>
          ${ucInfo}
        </td>
        <td>
          ${statusBadge(c.status)}
          ${statusRateioHtml}
        </td>
        <td>
          <div>${c.city || 'N/A'}, ${c.state || ''}</div>
        </td>
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
    summary.textContent = `Mostrando ${startItem}-${endItem} de ${total}`;

    nav.innerHTML = '';
    if (totalPages > 1) {
      const ul = document.createElement('ul');
      ul.className = 'pagination pagination-sm mb-0 justify-content-end';

      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

      if (this.currentPage > 1) {
        ul.innerHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${this.currentPage - 1}"><i class="fas fa-chevron-left"></i></a></li>`;
      }

      for (let i = startPage; i <= endPage; i++) {
        ul.innerHTML += `<li class="page-item ${this.currentPage === i ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }

      if (this.currentPage < totalPages) {
        ul.innerHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${this.currentPage + 1}"><i class="fas fa-chevron-right"></i></a></li>`;
      }

      nav.appendChild(ul);
      nav.querySelectorAll('.page-link').forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.dataset.page, 10);
        if (!Number.isNaN(p)) this.changePage(p);
      }));
    }
  }
}