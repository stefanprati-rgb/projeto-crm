import { PROJECTS } from "../config/projects.js";

// Throttle para evitar renderizações excessivas
let chartRenderTimeout;
function throttleChartRender(callback, delay = 300) {
  if (chartRenderTimeout) clearTimeout(chartRenderTimeout);
  chartRenderTimeout = setTimeout(callback, delay);
}

// Configurações comuns dos gráficos
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { font: { family: "'Inter', sans-serif", size: 11 }, usePointStyle: true, boxWidth: 8, padding: 20, color: '#64748b' } },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      padding: 12,
      titleFont: { family: "'Inter', sans-serif", size: 13 },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      cornerRadius: 12,
      displayColors: true
    }
  },
  layout: { padding: 10 },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9', borderDash: [4, 4] }, ticks: { font: { size: 10 }, color: '#94a3b8' }, border: { display: false } },
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' }, border: { display: false } }
  }
};

// --- RENDERIZAÇÃO GERAL (KPIs Originais) ---
export function renderKPIs(elIds, clients, currentBase) {
  updateGreeting(currentBase);
  renderProjectHub(clients, currentBase);

  const total = clients.length;
  const active = clients.filter(c => (c.status || '').toUpperCase() === 'ATIVO').length;
  const overdue = clients.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'INADIMPLENTE' || st === 'EM_COBRANCA';
  }).length;

  const monthly = clients.reduce((sum, c) => {
    let cons = typeof c.consumption === 'string' ? parseFloat(c.consumption.replace('.', '').replace(',', '.')) : (c.consumption || 0);
    let disc = typeof c.discount === 'string' ? parseFloat(c.discount.replace(',', '.')) : (c.discount || 0);
    return sum + (cons * 0.85 * (1 - (disc / 100)));
  }, 0);

  updateText(elIds.total, total);
  updateText(elIds.active, active);
  updateText(elIds.overdue, overdue);
  updateText(elIds.revenue, monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
}

// --- NOVO: RENDERIZAÇÃO DE TICKETS (SLA & Suporte) ---
export function renderTicketKPIs(metrics) {
  if (!metrics) return;

  // 1. Injeção Dinâmica do Container se não existir
  const dashboardSection = document.getElementById('dashboard-section');
  let ticketContainer = document.getElementById('ticket-kpi-container');

  if (!ticketContainer && dashboardSection) {
    const html = `
      <div id="ticket-kpi-container" class="mt-8 fade-in">
        <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i class="fas fa-headset text-primary-600"></i> Performance de Atendimento
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 class="text-sm font-bold text-slate-700 mb-4">Volume por Categoria</h4>
            <div class="relative h-[200px]">
                <canvas id="ticketsChart"></canvas>
            </div>
        </div>
      </div>
    `;
    dashboardSection.insertAdjacentHTML('beforeend', html);
    ticketContainer = document.getElementById('ticket-kpi-container');
  }

  if (!ticketContainer) return;

  // 2. Renderiza Cards de KPI
  const cardsContainer = ticketContainer.querySelector('.grid');
  cardsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
      <div class="text-xs font-bold text-slate-400 uppercase mb-1">Em Aberto</div>
      <div class="text-2xl font-bold text-slate-800">${metrics.open}</div>
      <div class="text-[10px] text-slate-400 mt-1">Tickets na fila</div>
    </div>
    
    <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
      <div class="text-xs font-bold text-slate-400 uppercase mb-1">Resolvidos</div>
      <div class="text-2xl font-bold text-slate-800">${metrics.resolved}</div>
      <div class="text-[10px] text-emerald-600 mt-1 font-medium">Total acumulado</div>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 ${metrics.complianceRate < 90 ? 'border-l-rose-500' : 'border-l-primary-500'}">
      <div class="text-xs font-bold text-slate-400 uppercase mb-1">Adesão ao SLA</div>
      <div class="text-2xl font-bold ${metrics.complianceRate < 90 ? 'text-rose-600' : 'text-slate-800'}">${metrics.complianceRate}%</div>
      <div class="text-[10px] text-slate-400 mt-1">Meta: >90%</div>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
      <div class="text-xs font-bold text-slate-400 uppercase mb-1">Tempo Médio (TMR)</div>
      <div class="text-2xl font-bold text-slate-800">${metrics.avgResolutionHours}h</div>
      <div class="text-[10px] text-slate-400 mt-1">Horas úteis est.</div>
    </div>
  `;
}

// --- GRÁFICOS ---

export function renderTicketsChart(ctx, tickets) {
  // Agrupa por categoria
  const counts = {};
  tickets.forEach(t => {
    const cat = t.category || 'Outros';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tickets',
        data,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: 0.5
      }]
    },
    options: {
      ...commonOptions,
      plugins: { legend: { display: false } },
      indexAxis: 'y' // Barra horizontal para facilitar leitura de categorias
    }
  });
}

export function renderClientsChart(ctx, clients, chartInstanceRef) {
  throttleChartRender(() => {
    const etapas = { 'Novo': 0, 'Enviado Rateio': 0, 'Rateio Cadastrado': 0, 'Faturado': 0 };
    clients.forEach(c => {
      const st = (c.status || '').toUpperCase();
      const etapa = (c.etapaUc || '').toUpperCase();
      const statusRateio = (c.statusRateio || '').toUpperCase();

      if (etapa.includes('FATURADO') || st === 'ATIVO') etapas['Faturado']++;
      else if (statusRateio.includes('APTO') || etapa.includes('CADASTRADO')) etapas['Rateio Cadastrado']++;
      else if (etapa.includes('ENVIADO')) etapas['Enviado Rateio']++;
      else etapas['Novo']++;
    });

    const data = Object.values(etapas);
    const labels = Object.keys(etapas);

    if (chartInstanceRef.value) chartInstanceRef.value.destroy();

    chartInstanceRef.value = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Clientes',
          data,
          backgroundColor: ['#cbd5e1', '#f59e0b', '#3b82f6', '#10b981'],
          borderRadius: 8,
          barPercentage: 0.5,
          borderSkipped: false
        }]
      },
      options: { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }
    });
  });
}

export function renderStatusChart(ctx, clients, chartInstanceRef) {
  throttleChartRender(() => {
    const counts = {};
    clients.forEach(c => {
      let st = c.statusRateio || c.status || 'N/A';
      st = st.toUpperCase();
      counts[st] = (counts[st] ?? 0) + 1;
    });

    const sortedLabels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
    const data = sortedLabels.map(l => counts[l]);
    const backgroundColors = sortedLabels.map(label => {
      if (label.includes('ATIVO')) return '#10b981';
      if (label.includes('INATIVO')) return '#e2e8f0';
      if (label.includes('PENDENTE') || label.includes('ACOMPANHAR')) return '#f59e0b';
      if (label.includes('APTO')) return '#3b82f6';
      if (label.includes('CANCEL') || label.includes('INADIMPLENTE')) return '#f43f5e';
      return '#94a3b8';
    });

    if (chartInstanceRef.value) chartInstanceRef.value.destroy();

    chartInstanceRef.value = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sortedLabels,
        datasets: [{ data, backgroundColor: backgroundColors, borderWidth: 0, hoverOffset: 10 }]
      },
      options: {
        ...commonOptions,
        cutout: '80%',
        plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 10, font: { family: "'Inter', sans-serif", size: 11 }, color: '#475569' } } }
      }
    });
  });
}

export function renderChurnChart(ctx, clients, chartInstanceRef) {
  throttleChartRender(() => {
    const churnData = clients.filter(c => c.churnReason || c.motivoCancelamento);
    const counts = {};
    churnData.forEach(c => {
      let reason = c.churnReason || c.motivoCancelamento;
      reason = reason.split(' ').slice(0, 3).join(' ');
      counts[reason] = (counts[reason] || 0) + 1;
    });

    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
    const data = labels.map(l => counts[l]);

    if (chartInstanceRef && chartInstanceRef.value) chartInstanceRef.value.destroy();
    if (data.length === 0) return;

    chartInstanceRef.value = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Cancelamentos', data, backgroundColor: '#f43f5e', borderRadius: 4, barPercentage: 0.5 }]
      },
      options: { ...commonOptions, indexAxis: 'y', scales: { x: { display: false }, y: { grid: { display: false } } } }
    });
  });
}

// Helpers internos
function updateText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateGreeting(currentBase) {
  const titleEl = document.getElementById('sectionTitle');
  const subtitleEl = document.getElementById('sectionSubtitle');
  if (!titleEl) return;

  const hour = new Date().getHours();
  let greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  if (currentBase === 'TODOS') {
    titleEl.textContent = `${greeting}, Gestor`;
    subtitleEl.textContent = 'Aqui está o resumo consolidado da sua operação.';
  } else {
    const projName = PROJECTS[currentBase]?.name || currentBase;
    titleEl.textContent = projName;
    subtitleEl.textContent = `Visão detalhada do projeto ${currentBase}.`;
  }
}

function renderProjectHub(allClients, currentBase) {
  const grid = document.getElementById('projects-overview-grid');
  if (!grid) return;

  if (currentBase !== 'TODOS') {
    grid.classList.add('hidden');
    grid.classList.remove('grid');
    return;
  }

  grid.classList.remove('hidden');
  grid.classList.add('grid');
  grid.innerHTML = '';

  Object.entries(PROJECTS).forEach(([code, project]) => {
    const projClients = allClients.filter(c => c.database === code);
    const activeClients = projClients.filter(c => (c.status || '').toUpperCase() === 'ATIVO');
    const totalConsumo = activeClients.reduce((sum, c) => {
      let val = typeof c.consumption === 'string' ? parseFloat(c.consumption.replace('.', '').replace(',', '.')) : (c.consumption || 0);
      return sum + (val || 0);
    }, 0);

    const projRevenue = projClients.reduce((sum, c) => {
      let cons = typeof c.consumption === 'string' ? parseFloat(c.consumption.replace('.', '').replace(',', '.')) : (c.consumption || 0);
      let disc = typeof c.discount === 'string' ? parseFloat(c.discount.replace(',', '.')) : (c.discount || 0);
      return sum + (cons * 0.85 * (1 - (disc / 100)));
    }, 0);

    const target = project.target || 1;
    const occupancyPct = Math.min(100, (totalConsumo / target) * 100);
    const vacancyPct = (100 - occupancyPct).toFixed(1);

    let progressColor = occupancyPct < 20 ? 'bg-rose-500' : occupancyPct < 40 ? 'bg-amber-500' : 'bg-emerald-500';

    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-3xl shadow-apple hover:shadow-apple-hover border border-white/60 transition-all duration-300 group cursor-pointer relative overflow-hidden';
    card.onclick = () => {
      const selector = document.getElementById('databaseSelector');
      if (selector) {
        selector.value = code;
        selector.dispatchEvent(new Event('change'));
      }
    };

    card.innerHTML = `
      <div class="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">${code}</div>
          <h4 class="text-lg font-bold text-slate-800 group-hover:text-primary-700 transition-colors">${project.name}</h4>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
          <i class="fas fa-arrow-right text-xs transform group-hover:translate-x-0.5 transition-transform"></i>
        </div>
      </div>
      <div class="space-y-4 relative z-10">
        <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-500">Receita Est.</span>
            <span class="font-bold text-slate-700">${projRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-500">Ocupação</span>
            <span class="font-bold ${occupancyPct > 90 ? 'text-emerald-600' : 'text-slate-700'}">${occupancyPct.toFixed(1)}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div class="${progressColor} h-2 rounded-full transition-all duration-1000" style="width: ${occupancyPct}%"></div>
          </div>
          <div class="text-[10px] text-slate-400 mt-1 text-right">Vacância: ${vacancyPct}%</div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}