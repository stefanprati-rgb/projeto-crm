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
      const instalacao = c.instalacao ? c.instalacao.toString() : '';
      const contaContrato = c.contaContrato ? c.contaContrato.toString() : ''; // NOVO
      const projeto = c.projeto || '';
      const statusRateio = c.statusRateio || '';

      const matchesSearch = !search ||
        name.toLowerCase().includes(search) ||
        cpf.replace(/[.\-/]/g, '').includes(search) ||
        cnpj.replace(/[.\-/]/g, '').includes(search) ||
        instalacao.includes(search) ||
        contaContrato.includes(search) ||
        projeto.toLowerCase().includes(search) ||
        statusRateio.toLowerCase().includes(search);

      const matchesStatus = !status || c.status === status;
      const matchesType = !type || c.contractType === type;
      const matchesCity = !city || (c.city && c.city.toLowerCase().includes(city));

      return matchesSearch && matchesStatus && matchesType && matchesCity;
    });

    this.currentPage = 1;
    this.render();
  }

  // ... (clearFilters e changePage iguais) ...
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
        <h6 class="fw-bold">Nenhum cliente encontrado</h6>
      </div></td></tr>`;
      nav.innerHTML = '';
      summary.textContent = '0 clientes';
      return;
    }

    const start = (this.currentPage - 1) * this.perPage;
    const pageClients = this.filtered.slice(start, start + this.perPage);

    pageClients.forEach(c => {
      const tr = document.createElement('tr');

      // Ações
      let actionsHtml = '';
      if (this.userRole === 'editor') {
        actionsHtml = `<button class="btn btn-light btn-sm text-primary rounded-circle" data-id="${c.id}" data-action="edit"><i class="fas fa-pen"></i></button>`;
      } else {
        actionsHtml = `<button class="btn btn-light btn-sm text-secondary rounded-circle" data-id="${c.id}" data-action="edit"><i class="fas fa-eye"></i></button>`;
      }

      // Badge Status Rateio
      let statusRateioHtml = '';
      if (c.statusRateio) {
        let badgeClass = 'bg-light text-dark border';
        const st = c.statusRateio.toLowerCase();
        if (st.includes('apto')) badgeClass = 'bg-success-soft';
        else if (st.includes('retirar')) badgeClass = 'bg-danger-soft';
        else if (st.includes('acompanhar')) badgeClass = 'bg-warning-soft';
        statusRateioHtml = `<div class="mt-1"><span class="badge ${badgeClass} fw-normal" style="font-size: 0.65em">${c.statusRateio}</span></div>`;
      }

      const projetoInfo = c.projeto ? `<div class="small text-muted mt-1"><i class="fas fa-solar-panel me-1 text-warning"></i>${c.projeto}</div>` : '';

      // Exibe UC e Conta Contrato se existir
      let idsInfo = `<div class="small text-muted font-monospace mt-1"><i class="fas fa-plug me-1"></i>${c.instalacao}</div>`;
      if (c.contaContrato) {
        idsInfo += `<div class="small text-muted font-monospace" style="font-size: 0.75em">CC: ${c.contaContrato}</div>`;
      }

      tr.innerHTML = `
        <td class="ps-4">
          <div class="fw-bold text-dark">${c.name || 'Sem Nome'}</div>
          ${projetoInfo}
        </td>
        <td>
          <div class="fw-medium text-secondary">${c.cpf || c.cnpj || 'N/A'}</div>
          ${idsInfo}
        </td>
        <td>
          ${statusBadge(c.status)}
          ${statusRateioHtml}
        </td>
        <td>
          <div>${c.city || '-'}/${c.state || '-'}</div>
          <div class="small text-muted">${c.distribuidora || ''}</div>
        </td>
        <td>
            <div class="fw-bold text-dark">${c.consumption || 0} <span class="small text-muted fw-normal">kWh</span></div>
        </td>
        <td class="text-end pe-4">
          ${actionsHtml}
        </td>`;
      tbody.appendChild(tr);
    });

    // ... (Paginação igual ao anterior) ...
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