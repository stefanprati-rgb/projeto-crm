// Renderiza os KPIs e Lógica de Negócio
export function renderKPIs(elIds, clients) {
  const total = clients.length;
  const active = clients.filter(c => (c.status || '').toUpperCase() === 'ATIVO').length;

  // Inadimplentes (Lógica mantida)
  const overdue = clients.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'INADIMPLENTE' || st === 'EM_COBRANCA';
  }).length;

  // Cálculo de Receita (Lógica mantida)
  const monthly = clients.reduce((sum, c) => {
    let cons = parseFloat(String(c.consumption || 0).replace(',', '.')) || 0;
    let disc = parseFloat(String(c.discount || 15).replace(',', '.')) / 100;
    return sum + (cons * 0.85 * (1 - disc));
  }, 0);

  // Atualiza elementos do DOM com formatação
  updateText(elIds.total, total);
  updateText(elIds.active, active);
  updateText(elIds.overdue, overdue);
  updateText(elIds.revenue, monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
}

function updateText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Configuração comum para gráficos modernos
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { family: "'Inter', sans-serif", size: 11 },
        usePointStyle: true,
        boxWidth: 8,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.9)', // Slate-800
      padding: 12,
      titleFont: { family: "'Inter', sans-serif", size: 13 },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      cornerRadius: 8,
      displayColors: false
    }
  },
  layout: { padding: 10 }
};

// Gráfico de Barras (Funil de Vendas)
export function renderClientsChart(ctx, clients, chartInstanceRef) {
  // Lógica de etapas mantida
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
        backgroundColor: [
          '#94a3b8', // Novo (Slate-400)
          '#f59e0b', // Enviado (Amber-500)
          '#3b82f6', // Cadastrado (Blue-500)
          '#0d9488'  // Faturado (Teal-600 - Cor Principal)
        ],
        borderRadius: 6,
        barPercentage: 0.6,
        borderSkipped: false
      }]
    },
    options: {
      ...commonOptions,
      plugins: { ...commonOptions.plugins, legend: { display: false } }, // Esconde legenda no funil
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9', borderDash: [4, 4] }, // Grid muito sutil
          ticks: { font: { family: "'Inter', sans-serif", size: 10 }, color: '#64748b' },
          border: { display: false }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748b' },
          border: { display: false }
        }
      }
    }
  });
}

// Gráfico de Pizza (Status da Carteira)
export function renderStatusChart(ctx, clients, chartInstanceRef) {
  const counts = {};

  clients.forEach(c => {
    let st = c.statusRateio || c.status || 'N/A';
    st = st.toUpperCase();
    counts[st] = (counts[st] ?? 0) + 1;
  });

  const sortedLabels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
  const data = sortedLabels.map(l => counts[l]);

  // Cores mapeadas para o tema novo
  const backgroundColors = sortedLabels.map(label => {
    if (label.includes('ATIVO')) return '#10b981'; // Emerald-500
    if (label.includes('INATIVO')) return '#cbd5e1'; // Slate-300
    if (label.includes('PENDENTE') || label.includes('ACOMPANHAR')) return '#f59e0b'; // Amber-500
    if (label.includes('APTO')) return '#3b82f6'; // Blue-500
    if (label.includes('CANCEL') || label.includes('INADIMPLENTE')) return '#f43f5e'; // Rose-500
    return '#94a3b8'; // Default Slate
  });

  if (chartInstanceRef.value) chartInstanceRef.value.destroy();

  chartInstanceRef.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sortedLabels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0, // Sem bordas para look flat
        hoverOffset: 4
      }]
    },
    options: {
      ...commonOptions,
      cutout: '75%', // Rosca mais fina e moderna
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            font: { family: "'Inter', sans-serif", size: 11 },
            color: '#475569'
          }
        }
      }
    }
  });
}