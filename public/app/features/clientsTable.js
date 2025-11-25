import { statusBadge } from "../utils/helpers.js";

export class ClientsTable {

  constructor(userRole) {
    this.filtered = [];
    this.currentPage = 1;
    this.perPage = 10;
    this.userRole = userRole;
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
      const instalacao = c.instalacao ? c.instalacao.toString() : '';
      const projeto = c.projeto || '';
      const distribuidora = c.distribuidora || '';
      const etapaUc = c.etapaUc || '';

      const matchesSearch = !search ||
        name.toLowerCase().includes(search) ||
        cpf.replace(/[.\-/]/g, '').includes(search) ||
        cnpj.replace(/[.\-/]/g, '').includes(search) ||
        email.toLowerCase().includes(search) ||
        instalacao.includes(search) ||
        projeto.toLowerCase().includes(search) ||
        distribuidora.toLowerCase().includes(search) ||
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
      tbody.innerHTML = `<tr><td colspan="6"><div class="text-center p-5 text-muted">
        <div class="mb-3"><i class="fas fa-search fa-3x text-light-gray opacity-25"></i></div>
        <h6 class="fw-bold">Nenhum cliente encontrado</h6>
        <p class="small text-secondary">Tente ajustar os filtros ou limpar a busca.</p>
      </div></td></tr>`;
      nav.innerHTML = '';
      summary.textContent = 'Mostrando 0 de 0';
      return;
    }

    const start = (this.currentPage - 1) * this.perPage;
    const pageClients = this.filtered.slice(start, start + this.perPage);

    pageClients.forEach(c => {
      const tr = document.createElement('tr');

      // Ações: Botões minimalistas
      let actionsHtml = '';
      if (this.userRole === 'editor') {
        actionsHtml = `
          <button class="btn btn-light btn-sm text-primary border-0 rounded-circle" style="width: 32px; height: 32px;" data-id="${c.id}" data-action="edit" title="Editar">
            <i class="fas fa-pen"></i>
          </button>
        `;
      } else {
        actionsHtml = `
          <button class="btn btn-light btn-sm text-secondary border-0 rounded-circle" style="width: 32px; height: 32px;" data-id="${c.id}" data-action="edit" title="Visualizar">
            <i class="fas fa-eye"></i>
          </button>
        `;
      }

      // Status Rateio (Soft Badge)
      let statusRateioHtml = '';
      if (c.statusRateio) {
        let badgeClass = 'bg-light text-dark border';
        const st = c.statusRateio.toLowerCase();

        if (st.includes('apto')) badgeClass = 'bg-success-soft';
        else if (st.includes('retirar')) badgeClass = 'bg-danger-soft';
        else if (st.includes('acompanhar') || st.includes('crédito')) badgeClass = 'bg-warning-soft';

        statusRateioHtml = `<div class="mt-1"><span class="badge ${badgeClass} fw-normal" style="font-size: 0.7em">${c.statusRateio}</span></div>`;
      }

      // Detalhes em subtexto
      const projetoInfo = c.projeto ?
        `<div class="small text-muted mt-1 d-flex align-items-center"><i class="fas fa-solar-panel me-1 text-warning opacity-75" style="font-size: 0.75em;"></i>${c.projeto}</div>` : '';

      const ucInfo = c.instalacao ?
        `<div class="small text-muted font-monospace mt-1"><i class="fas fa-hashtag me-1 opacity-50"></i>${c.instalacao}</div>` : '';

      const locInfo = c.city ?
        `<div>${c.city}${c.state ? '/' + c.state : ''}</div>` : '<span class="text-muted">-</span>';

      tr.innerHTML = `
        <td class="ps-4">
          <div class="fw-bold text-dark">${c.name || 'Sem Nome'}</div>
          ${projetoInfo}
        </td>
        <td>
          <div class="fw-medium text-secondary">${c.cpf || c.cnpj || 'N/A'}</div>
          ${ucInfo}
        </td>
        <td>
          ${statusBadge(c.status)}
          ${statusRateioHtml}
        </td>
        <td>
          ${locInfo}
          <div class="small text-muted">${c.distribuidora || ''}</div>
        </td>
        <td>
            <div class="d-flex align-items-center">
                <div class="fw-bold text-dark">${c.consumption || 0}</div>
                <span class="small text-muted ms-1">kWh</span>
            </div>
        </td>
        <td class="text-end pe-4">
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
        ul.innerHTML += `<li class="page-item"><a class="page-link border-0 text-secondary bg-transparent" href="#" data-page="${this.currentPage - 1}"><i class="fas fa-chevron-left"></i></a></li>`;
      }

      for (let i = startPage; i <= endPage; i++) {
        const activeClass = this.currentPage === i ? 'bg-primary text-white shadow-sm' : 'text-secondary bg-transparent hover-bg-light';
        ul.innerHTML += `<li class="page-item"><a class="page-link border-0 mx-1 rounded-circle d-flex align-items-center justify-content-center ${activeClass}" style="width: 32px; height: 32px;" href="#" data-page="${i}">${i}</a></li>`;
      }

      if (this.currentPage < totalPages) {
        ul.innerHTML += `<li class="page-item"><a class="page-link border-0 text-secondary bg-transparent" href="#" data-page="${this.currentPage + 1}"><i class="fas fa-chevron-right"></i></a></li>`;
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