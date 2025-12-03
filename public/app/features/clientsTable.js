import { statusBadge } from "../utils/helpers.js";

export class ClientsTable {
  constructor(userRole) {
    this.filtered = [];
    this.currentPage = 1;
    this.perPage = 10; // Mostra menos por página para um visual mais leve
    this.userRole = userRole;
  }

  applyFilters(clients) {
    const searchInput = document.getElementById('searchInput');
    const search = searchInput ? searchInput.value.toLowerCase() : '';

    const statusFilter = document.getElementById('statusFilter');
    const status = statusFilter ? statusFilter.value : '';

    // O filtro de tipo (PF/PJ) foi removido do HTML novo para simplificar, mas mantemos a lógica caso volte
    const typeEl = document.getElementById('typeFilter');
    const type = typeEl ? typeEl.value : '';

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

    // Estado Vazio (Empty State elegante)
    if (this.filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-16 text-center">
            <div class="flex flex-col items-center justify-center text-slate-300">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-search text-2xl text-slate-400"></i>
              </div>
              <p class="font-semibold text-slate-500">Nenhum resultado encontrado</p>
              <p class="text-sm mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
            </div>
          </td>
        </tr>`;
      nav.innerHTML = '';
      summary.textContent = '0 resultados';
      return;
    }

    const start = (this.currentPage - 1) * this.perPage;
    const pageClients = this.filtered.slice(start, start + this.perPage);

    pageClients.forEach(c => {
      const tr = document.createElement('tr');
      // Estilo de linha: hover suave e transição
      tr.className = "group hover:bg-slate-50/80 transition-colors duration-200";

      // Botões de Ação (Minimalistas e arredondados)
      let actionsHtml = '';
      if (this.userRole === 'editor') {
        actionsHtml = `
          <button class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-white hover:text-primary-600 hover:shadow-md border border-transparent hover:border-slate-100 flex items-center justify-center transition-all duration-200 transform hover:-translate-y-0.5" data-id="${c.id}" data-action="edit" title="Editar">
            <i class="fas fa-pen text-[10px]"></i>
          </button>`;
      } else {
        actionsHtml = `
          <button class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-md border border-transparent hover:border-slate-100 flex items-center justify-center transition-all duration-200" data-id="${c.id}" data-action="edit" title="Ver Detalhes">
            <i class="fas fa-eye text-[10px]"></i>
          </button>`;
      }

      // Badge Status Rateio (Estilo Tag sutil)
      let statusRateioHtml = '';
      if (c.statusRateio) {
        let colorClass = 'bg-slate-100 text-slate-500';
        const st = c.statusRateio.toLowerCase();
        if (st.includes('apto')) colorClass = 'bg-blue-50 text-blue-600';
        else if (st.includes('retirar')) colorClass = 'bg-rose-50 text-rose-600';
        else if (st.includes('acompanhar')) colorClass = 'bg-amber-50 text-amber-600';

        statusRateioHtml = `
          <div class="mt-1.5">
            <span class="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${colorClass}">
              ${c.statusRateio}
            </span>
          </div>`;
      }

      const projetoInfo = c.projeto
        ? `<div class="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>${c.projeto}</div>`
        : '';

      // UC e Conta Contrato
      let idsInfo = `<div class="text-xs font-mono text-slate-500 mt-1 flex items-center gap-1">UC ${c.instalacao}</div>`;
      if (c.contaContrato) {
        idsInfo += `<div class="text-[10px] text-slate-400 font-mono">CC ${c.contaContrato}</div>`;
      }

      // Documento formatado (simulado, idealmente usaria helper)
      const docDisplay = c.cpf || c.cnpj || 'N/A';

      // HTML da linha
      tr.innerHTML = `
        <td class="p-5 pl-8 align-top">
          <div class="font-bold text-slate-700 text-sm tracking-tight group-hover:text-primary-700 transition-colors">${c.name || 'Sem Nome'}</div>
          ${projetoInfo}
        </td>
        <td class="p-5 align-top">
          <div class="font-medium text-slate-600 text-xs">${docDisplay}</div>
          ${idsInfo}
        </td>
        <td class="p-5 align-top">
          ${statusBadge(c.status)}
          ${statusRateioHtml}
        </td>
        <td class="p-5 align-top">
          <div class="text-sm font-medium text-slate-600">${c.city || '-'}<span class="text-slate-300 mx-1">/</span>${c.state || '-'}</div>
          <div class="text-[11px] font-semibold text-slate-400 uppercase mt-0.5 tracking-wider">${c.distribuidora || ''}</div>
        </td>
        <td class="p-5 align-top">
            <div class="font-bold text-slate-700 text-sm">${c.consumption || 0} <span class="text-xs text-slate-400 font-normal">kWh</span></div>
        </td>
        <td class="p-5 pr-8 text-right align-middle">
          <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            ${actionsHtml}
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    // Paginação (Estilo iOS)
    const total = this.filtered.length;
    const totalPages = Math.ceil(total / this.perPage);
    const startItem = total === 0 ? 0 : start + 1;
    const endItem = Math.min(start + this.perPage, total);

    summary.textContent = `${startItem}-${endItem} de ${total}`;

    nav.innerHTML = '';
    if (totalPages > 1) {
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

      // Seta Esquerda
      if (this.currentPage > 1) {
        nav.innerHTML += `
          <a href="#" data-page="${this.currentPage - 1}" class="page-link w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-colors">
            <i class="fas fa-chevron-left text-xs"></i>
          </a>`;
      }

      // Números
      for (let i = startPage; i <= endPage; i++) {
        const activeClass = this.currentPage === i
          ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20 font-bold'
          : 'bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50';

        nav.innerHTML += `
          <a href="#" data-page="${i}" class="page-link w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all ${activeClass}">
            ${i}
          </a>`;
      }

      // Seta Direita
      if (this.currentPage < totalPages) {
        nav.innerHTML += `
          <a href="#" data-page="${this.currentPage + 1}" class="page-link w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-colors">
            <i class="fas fa-chevron-right text-xs"></i>
          </a>`;
      }

      nav.querySelectorAll('.page-link').forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.dataset.page, 10);
        if (!Number.isNaN(p)) this.changePage(p);
      }));
    }
  }
}