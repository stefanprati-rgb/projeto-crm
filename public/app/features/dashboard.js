import { PROJECTS, getTargetGeneration } from "../config/projects.js";

// Renderiza os KPIs, Saudação e o Hub de Projetos
export function renderKPIs(elIds, clients, currentBase) {

  // 1. Atualiza Saudação (UX "Apple")
  updateGreeting(currentBase);

  // 2. Renderiza o Hub de Projetos (Apenas se estiver em 'TODOS')
  renderProjectHub(clients, currentBase);

  // 3. Cálculos Globais (KPIs Principais)
  const total = clients.length;
  const active = clients.filter(c => (c.status || '').toUpperCase() === 'ATIVO').length;

  const overdue = clients.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'INADIMPLENTE' || st === 'EM_COBRANCA';
  }).length;

  // Cálculo de Receita (Robusto para strings ou numbers)
  const monthly = clients.reduce((sum, c) => {
    let cons = typeof c.consumption === 'string' ? parseFloat(c.consumption.replace('.', '').replace(',', '.')) : (c.consumption || 0);
    let disc = typeof c.discount === 'string' ? parseFloat(c.discount.replace(',', '.')) : (c.discount || 0);
    // Regra: Consumo * 0.85 * (1 - Desconto)
    return sum + (cons * 0.85 * (1 - (disc / 100)));
  }, 0);

  // Atualiza DOM dos KPIs
  updateText(elIds.total, total);
  updateText(elIds.active, active);
  updateText(elIds.overdue, overdue);
  updateText(elIds.revenue, monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
}

// --- FUNÇÕES AUXILIARES DE UI ---

function updateText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateGreeting(currentBase) {
  const titleEl = document.getElementById('sectionTitle');
  const subtitleEl = document.getElementById('sectionSubtitle');
  if (!titleEl) return;

  const hour = new Date().getHours();
  let greeting = 'Olá';
  if (hour < 12) greeting = 'Bom dia';
  else if (hour < 18) greeting = 'Boa tarde';
  else greeting = 'Boa noite';

  if (currentBase === 'TODOS') {
    titleEl.textContent = `${greeting}, Gestor`;
    subtitleEl.textContent = 'Aqui está o resumo consolidado da sua operação.';
  } else {
    const projName = PROJECTS[currentBase]?.name || currentBase;
    titleEl.textContent = projName;
    subtitleEl.textContent = `Visão detalhada do projeto ${currentBase}.`;
  }
}

// --- HUB DE PROJETOS (OS CARDS MÁGICOS) ---

function renderProjectHub(allClients, currentBase) {
  const grid = document.getElementById('projects-overview-grid');
  if (!grid) return;

  // Só mostra o grid se estivermos na visão consolidada
  if (currentBase !== 'TODOS') {
    grid.classList.add('hidden');
    grid.classList.remove('grid');
    return;
  }

  grid.classList.remove('hidden');
  grid.classList.add('grid'); // Ativa o grid do Tailwind
  grid.innerHTML = '';

  // Itera sobre cada projeto configurado (LNV, ALA, etc.)
  Object.entries(PROJECTS).forEach(([code, project]) => {

    // 1. Filtra clientes deste projeto específico
    const projClients = allClients.filter(c => c.database === code);

    // 2. Calcula métricas locais
    const activeClients = projClients.filter(c => (c.status || '').toUpperCase() === 'ATIVO');

    // Soma Consumo
    const totalConsumo = activeClients.reduce((sum, c) => {
      let val = typeof c.consumption === 'string' ? parseFloat(c.consumption.replace('.', '').replace(',', '.')) : (c.consumption || 0);
      return sum + (val || 0);
    }, 0);

    // Soma Receita
    const projRevenue = projClients.reduce((sum, c) => {
      let cons = typeof c.consumption === 'string' ? parseFloat(c.consumption.replace('.', '').replace(',', '.')) : (c.consumption || 0);
      let disc = typeof c.discount === 'string' ? parseFloat(c.discount.replace(',', '.')) : (c.discount || 0);
      return sum + (cons * 0.85 * (1 - (disc / 100)));
    }, 0);

    // Vacância
    const target = project.target || 1; // Evita divisão por zero
    const occupancyPct = Math.min(100, (totalConsumo / target) * 100);
    const vacancyPct = (100 - occupancyPct).toFixed(1);

    // Cor da barra de progresso baseada na ocupação
    let progressColor = 'bg-emerald-500';
    if (occupancyPct < 40) progressColor = 'bg-amber-500';
    if (occupancyPct < 20) progressColor = 'bg-rose-500';

    // 3. Gera o Card HTML (Glassmorphism + Apple Style)
    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-3xl shadow-apple hover:shadow-apple-hover border border-white/60 transition-all duration-300 group cursor-pointer relative overflow-hidden';

    // Ação ao clicar: Mudar o filtro global para este projeto
    card.onclick = () => {
      const selector = document.getElementById('databaseSelector');
      if (selector) {
        selector.value = code;
        selector.dispatchEvent(new Event('change')); // Dispara a troca de base
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
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-500">Receita Est.</span>
            <span class="font-bold text-slate-700">${projRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-500">Ocupação Usina</span>
            <span class="font-bold ${occupancyPct > 90 ? 'text-emerald-600' : 'text-slate-700'}">${occupancyPct.toFixed(1)}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div class="${progressColor} h-2 rounded-full transition-all duration-1000" style="width: ${occupancyPct}%"></div>
          </div>
          <div class="text-[10px] text-slate-400 mt-1 text-right">Vacância: ${vacancyPct}%</div>
        </div>
      </div>

      <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-primary-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-xl"></div>
    `;

    grid.appendChild(card);
  });
}

// --- GRÁFICOS (CONFIGURAÇÃO) ---

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { family: "'Inter', sans-serif", size: 11 },
        usePointStyle: true,
        boxWidth: 8,
        padding: 20,
        color: '#64748b'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate-900
      padding: 12,
      titleFont: { family: "'Inter', sans-serif", size: 13 },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      cornerRadius: 12,
      displayColors: true,
      boxPadding: 4
    }
  },
  layout: { padding: 10 },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9', borderDash: [4, 4] },
      ticks: { font: { size: 10 }, color: '#94a3b8' },
      border: { display: false }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#64748b' },
      border: { display: false }
    }
  }
};

// Gráfico de Barras (Funil)
export function renderClientsChart(ctx, clients, chartInstanceRef) {
  const etapas = {
    'Novo': 0,
    'Enviado Rateio': 0,
    'Rateio Cadastrado': 0,
    'Faturado': 0
  };

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
        backgroundColor: ['#cbd5e1', '#f59e0b', '#3b82f6', '#10b981'], // Slate, Amber, Blue, Emerald
        borderRadius: 8,
        barPercentage: 0.5,
        borderSkipped: false
      }]
    },
    options: {
      ...commonOptions,
      plugins: { ...commonOptions.plugins, legend: { display: false } }
    }
  });
}

// Gráfico de Pizza (Status)
export function renderStatusChart(ctx, clients, chartInstanceRef) {
  const counts = {};

  clients.forEach(c => {
    let st = c.statusRateio || c.status || 'N/A';
    st = st.toUpperCase();
    counts[st] = (counts[st] ?? 0) + 1;
  });

  const sortedLabels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
  const data = sortedLabels.map(l => counts[l]);

  const backgroundColors = sortedLabels.map(label => {
    if (label.includes('ATIVO')) return '#10b981'; // Emerald
    if (label.includes('INATIVO')) return '#e2e8f0'; // Slate-200
    if (label.includes('PENDENTE') || label.includes('ACOMPANHAR')) return '#f59e0b'; // Amber
    if (label.includes('APTO')) return '#3b82f6'; // Blue
    if (label.includes('CANCEL') || label.includes('INADIMPLENTE')) return '#f43f5e'; // Rose
    return '#94a3b8';
  });

  if (chartInstanceRef.value) chartInstanceRef.value.destroy();

  chartInstanceRef.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sortedLabels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      ...commonOptions,
      cutout: '80%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            font: { family: "'Inter', sans-serif", size: 11 },
            color: '#475569'
          }
        }
      }
    }
  });
}