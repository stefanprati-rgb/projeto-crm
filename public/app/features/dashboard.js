import { getTargetGeneration } from "../config/projects.js";

// Renderiza os KPIs e Lógica de Negócio
export function renderKPIs(elIds, clients, currentBase) {
  const total = clients.length;
  const active = clients.filter(c => (c.status || '').toUpperCase() === 'ATIVO').length;

  // Inadimplentes
  const overdue = clients.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'INADIMPLENTE' || st === 'EM_COBRANCA';
  }).length;

  // Cálculo de Receita Estimada (Soma do valor contratual)
  const monthly = clients.reduce((sum, c) => {
    // Tratamento robusto para números que vêm como string "1.200,50" ou number
    let cons = 0;
    if (typeof c.consumption === 'string') {
      cons = parseFloat(c.consumption.replace('.', '').replace(',', '.')) || 0;
    } else {
      cons = c.consumption || 0;
    }

    let disc = 0;
    if (typeof c.discount === 'string') {
      disc = parseFloat(c.discount.replace(',', '.')) || 0;
    } else {
      disc = c.discount || 0;
    }

    // Lógica: Consumo * Tarifa Cheia (0.85 ref) * (1 - Desconto)
    // Ajuste o 0.85 conforme a tarifa média real da região se necessário
    return sum + (cons * 0.85 * (1 - (disc / 100)));
  }, 0);

  // --- CÁLCULO DE VACÂNCIA CONTRATUAL ---
  // 1. Soma do consumo médio dos clientes ATIVOS
  const totalConsumoMedio = clients
    .filter(c => (c.status || '').toUpperCase() === 'ATIVO')
    .reduce((sum, c) => {
      let val = 0;
      if (typeof c.consumption === 'string') {
        val = parseFloat(c.consumption.replace('.', '').replace(',', '.')) || 0;
      } else {
        val = c.consumption || 0;
      }
      return sum + val;
    }, 0);

  // 2. Geração Alvo (Vem do arquivo de configuração)
  const geracaoAlvo = getTargetGeneration(currentBase);

  // 3. Cálculo (%)
  let vacanciaContratual = 100; // Começa 100% vazio
  if (geracaoAlvo > 0) {
    // Ocupação = Consumo / Alvo
    const ocupacao = (totalConsumoMedio / geracaoAlvo) * 100;
    vacanciaContratual = Math.max(0, 100 - ocupacao);
  }

  // Atualiza elementos do DOM
  updateText(elIds.total, total);
  updateText(elIds.active, active);
  updateText(elIds.overdue, overdue);
  updateText(elIds.revenue, monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

  // Se existir o elemento de vacância no HTML (sugerido adicionar depois)
  // Por enquanto, mostramos no console para validar
  console.log(`Base: ${currentBase} | Alvo: ${geracaoAlvo} | Ocupado: ${totalConsumoMedio} | Vacância: ${vacanciaContratual.toFixed(1)}%`);
}

function updateText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Configuração comum para gráficos
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
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      padding: 12,
      titleFont: { family: "'Inter', sans-serif", size: 13 },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      cornerRadius: 8,
      displayColors: false
    }
  },
  layout: { padding: 10 }
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
        backgroundColor: ['#94a3b8', '#f59e0b', '#3b82f6', '#0d9488'],
        borderRadius: 6,
        barPercentage: 0.6,
        borderSkipped: false
      }]
    },
    options: {
      ...commonOptions,
      plugins: { ...commonOptions.plugins, legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9', borderDash: [4, 4] },
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
    if (label.includes('ATIVO')) return '#10b981';
    if (label.includes('INATIVO')) return '#cbd5e1';
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
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      ...commonOptions,
      cutout: '75%',
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