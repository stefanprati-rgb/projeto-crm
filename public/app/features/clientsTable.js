import { statusBadge } from "../utils/helpers.js";

export class ClientsTable {
  constructor(userRole) {
    this.filtered = [];
    this.currentPage = 1;
    this.perPage = 10;
    this.userRole = userRole;
  }

  // A lógica de filtro permanece idêntica, apenas a renderização muda
  applyFilters(clients) {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const type = document.getElementById('typeFilter').value;
    // Verifica se o elemento cityFilter existe antes de tentar acessar o valor
    const cityEl = document.getElementById('cityFilter');
    const city = cityEl ? cityEl.value.toLowerCase() : '';

    this.filtered = clients.filter(c => {
      const name = c.name || '';
      const cpf = c.cpf || '';
      const cnpj = c.cnpj || '';
      const instalacao = c.instalacao ? c.instalacao.toString() : '';
      const contaContrato = c.contaContrato ? c.contaContrato.toString() : '';
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

  clearFilters() {
    ['searchInput', 'statusFilter', 'typeFilter', 'cityFilter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  changePage(p) {
    this.currentPage = p;
    this.render();
  }

  render() {
    const tbody = document.getElementById('clientsTableBody');
    const nav = document.getElementById('pagination-nav');
    const summary = document.getElementById('pagination-summary');

    if (!tbody || !nav || !summary) return;

    tbody.innerHTML = '';

    // Estado Vazio (Empty State)
    if (this.filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-12 text-center">
            <div class="flex flex-col items-center justify-center text-slate-400">
              <i class="fas fa-search text-3xl mb-3 opacity-50"></i>
              <p class="font-medium">Nenhum cliente encontrado</p>
              <p class="text-xs mt-1">Tente ajustar os filtros de busca.</p>
            </div>
          </td>
        </tr>`;
      nav.innerHTML = '';
      summary.textContent = '0 clientes';
      return;
    }

    const start = (this.currentPage - 1) * this.perPage;
    const pageClients = this.filtered.slice(start, start + this.perPage);

    // Renderização das Linhas
    pageClients.forEach(c => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0";

      // Botões de Ação Modernos
      let actionsHtml = '';
      if (this.userRole === 'editor') {
        // Botão Editar (Verde/Primary)
        actionsHtml = `
          <button class="h-8 w-8 rounded-full bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 hover:border-primary-200 flex items-center justify-center transition-all shadow-sm group" data-id="${c.id}" data-action="edit" title="Editar">
            <i class="fas fa-pen text-xs group-hover:scale-110 transition-transform"></i>
          </button>`;
      } else {
        // Botão Visualizar (Cinza)
        actionsHtml = `
          <button class="h-8 w-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 flex items-center justify-center transition-all shadow-sm group" data-id="${c.id}" data-action="edit" title="Ver Detalhes">
            <i class="fas fa-eye text-xs group-hover:scale-110 transition-transform"></i>
          </button>`;
      }

      // Badge Status Rateio (Pequeno e discreto)
      let statusRateioHtml = '';
      if (c.statusRateio) {
        let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
        const st = c.statusRateio.toLowerCase();
        if (st.includes('apto')) colorClass = 'bg-blue-50 text-blue-700 border-blue-100';
        else if (st.includes('retirar')) colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
        else if (st.includes('acompanhar')) colorClass = 'bg-amber-50 text-amber-700 border-amber-100';

        statusRateioHtml = `
          <div class="mt-1.5">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colorClass}">
              ${c.statusRateio}
            </span>
          </div>`;
      }

      const projetoInfo = c.projeto
        ? `<div class="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><i class="fas fa-solar-panel text-amber-400 text-[10px]"></i>${c.projeto}</div>`
        : '';

      let idsInfo = `<div class="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1"><i class="fas fa-plug text-[10px] opacity-50"></i>${c.instalacao}</div>`;
      if (c.contaContrato) {
        idsInfo += `<div class="text-[10px] text-slate-400 font-mono opacity-75">CC: ${c.contaContrato}</div>`;
      }

      // Preenchimento das Células com classes Tailwind
      tr.innerHTML = `
        <td class="p-4 pl-6 align-top">
          <div class="font-bold text-slate-700 text-sm">${c.name || 'Sem Nome'}</div>
          ${projetoInfo}
        </td>
        <td class="p-4 align-top">
          <div class="font-medium text-slate-600 text-xs">${c.cpf || c.cnpj || 'N/A'}</div>
          ${idsInfo}
        </td>
        <td class="p-4 align-top">
          ${statusBadge(c.status)}
          ${statusRateioHtml}
        </td>
        <td class="p-4 align-top">
          <div class="text-sm text-slate-600">${c.city || '-'}<span class="text-slate-400 text-xs mx-1">/</span>${c.state || '-'}</div>
          <div class="text-xs text-slate-400 mt-0.5">${c.distribuidora || ''}</div>
        </td>
        <td class="p-4 align-top">
            <div class="font-bold text-slate-700 text-sm">${c.consumption || 0} <span class="text-xs text-slate-400 font-normal">kWh</span></div>
        </td>
        <td class="p-4 pr-6 text-right align-top">
          <div class="flex justify-end gap-2">
            ${actionsHtml}
          </div>
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
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

      // Botão Anterior
      if (this.currentPage > 1) {
        nav.innerHTML += `
          <a href="#" data-page="${this.currentPage - 1}" class="page-link flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors text-xs">
            <i class="fas fa-chevron-left"></i>
          </a>`;
      }

      // Números
      for (let i = startPage; i <= endPage; i++) {
        const activeClass = this.currentPage === i
          ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';

        nav.innerHTML += `
          <a href="#" data-page="${i}" class="page-link flex items-center justify-center w-8 h-8 rounded-lg border ${activeClass} transition-all text-xs font-bold">
            ${i}
          </a>`;
      }

      // Botão Próximo
      if (this.currentPage < totalPages) {
        nav.innerHTML += `
          <a href="#" data-page="${this.currentPage + 1}" class="page-link flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors text-xs">
            <i class="fas fa-chevron-right"></i>
          </a>`;
      }

      // Event Listeners da Paginação
      nav.querySelectorAll('.page-link').forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.dataset.page, 10);
        if (!Number.isNaN(p)) this.changePage(p);
      }));
    }
  }
}