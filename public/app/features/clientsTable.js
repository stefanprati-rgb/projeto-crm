import { statusBadge } from "../utils/helpers.js";

export class ClientsTable {

  constructor(userRole) {
    this.filtered = [];
    this.currentPage = 1;
    this.perPage = 10;
    this.userRole = userRole;
  }

  applyFilters(clients) {
    // Captura os valores dos inputs de filtro
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const type = document.getElementById('typeFilter').value;
    const city = document.getElementById('cityFilter').value.toLowerCase();

    this.filtered = clients.filter(c => {
      // Normalização para evitar erros se o campo estiver vazio
      const name = c.name || '';
      const cpf = c.cpf || '';
      const cnpj = c.cnpj || '';
      const email = c.email || '';
      const ccity = c.city || '';

      // Novos campos para busca
      const instalacao = c.instalacao ? c.instalacao.toString() : '';
      const distribuidora = c.distribuidora || '';
      const projeto = c.projeto || '';
      const conexao = c.connectionType || ''; // Vem de 'FORNECIMENTO'

      // Lógica de Busca Geral (funciona para qualquer um desses campos)
      const matchesSearch = !search ||
        name.toLowerCase().includes(search) ||
        cpf.replace(/[.\-/]/g, '').includes(search) ||
        cnpj.replace(/[.\-/]/g, '').includes(search) ||
        email.toLowerCase().includes(search) ||
        instalacao.includes(search) ||           // Busca por UC
        distribuidora.toLowerCase().includes(search) || // Busca por Distribuidora
        projeto.toLowerCase().includes(search) ||  // Busca por Projeto
        conexao.toLowerCase().includes(search);    // Busca por Conexão

      const matchesStatus = !status || c.status === status;
      const matchesType = !type || c.contractType === type;
      const matchesCity = !city || ccity.toLowerCase().includes(city);

      return matchesSearch && matchesStatus && matchesType && matchesCity;
    });

    this.currentPage = 1;
    this.render();
  }

  clearFilters() {
    ['searchInput', 'statusFilter', 'typeFilter', 'cityFilter'].forEach(id => document.getElementById(id).value = '');
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

      // === BOTÕES DE AÇÃO (SEM EXCLUIR) ===
      let actionsHtml = '';
      if (this.userRole === 'editor') {
        // Apenas botão de Editar
        actionsHtml = `
          <button class="btn btn-outline-primary btn-sm btn-icon" data-id="${c.id}" data-action="edit" title="Editar"><i class="fas fa-edit"></i></button>
        `;
      } else {
        actionsHtml = `
          <button class="btn btn-outline-secondary btn-sm btn-icon" data-id="${c.id}" data-action="edit" title="Visualizar"><i class="fas fa-eye"></i></button>
        `;
      }

      // Badge extra para Status Rateio (se existir)
      let statusExtra = '';
      if (c.statusRateio) {
        statusExtra = `<div class="mt-1"><span class="badge bg-info text-dark" style="font-size: 0.7em">${c.statusRateio}</span></div>`;
      }

      // Exibição da UC e Distribuidora abaixo do nome ou documento
      const ucInfo = c.instalacao ? `<small class="text-muted d-block">UC: ${c.instalacao}</small>` : '';

      tr.innerHTML = `
        <td class="ps-3">
          <div class="fw-bold text-primary">${c.name || 'Sem Nome'}</div>
          <small class="text-muted">${c.email || c.externalId || ''}</small>
        </td>
        <td>
          <div>${c.cpf || c.cnpj || 'N/A'}</div>
          ${ucInfo}
        </td>
        <td>
          ${statusBadge(c.status)}
          ${statusExtra}
        </td>
        <td>
          <div>${c.city || 'N/A'}, ${c.state || ''}</div>
          <small class="text-muted">${c.distribuidora || ''}</small>
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

      // Botão Anterior
      ul.innerHTML += `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${this.currentPage - 1}"><i class="fas fa-chevron-left"></i></a></li>`;

      // Números (lógica simplificada para mostrar até 5 páginas)
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

      for (let i = startPage; i <= endPage; i++) {
        ul.innerHTML += `<li class="page-item ${this.currentPage === i ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }

      // Botão Próximo
      ul.innerHTML += `<li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${this.currentPage + 1}"><i class="fas fa-chevron-right"></i></a></li>`;

      nav.appendChild(ul);
      nav.querySelectorAll('.page-link').forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.dataset.page, 10);
        if (!Number.isNaN(p)) this.changePage(p);
      }));
    }
  }
}