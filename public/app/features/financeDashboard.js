import { daysBetween, todayISO, getAgingBucket } from "../utils/date.js";

const chartRefs = new Map(); // Armazena instâncias dos gráficos para destruição correta

const sum = (arr, sel = (x) => x) => arr.reduce((s, v) => s + (Number(sel(v)) || 0), 0);

// Pega a REF "mais recente" (YYYY-MM) para filtrar os KPIs do mês atual
const latestRef = (invoices) => {
  const refs = [...new Set(invoices.map(i => i.ref).filter(Boolean))].sort();
  return refs.length ? refs[refs.length - 1] : null;
};

// Configuração Visual dos Gráficos (Estilo Moderno)
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { family: "'Inter', sans-serif", size: 11 },
        usePointStyle: true,
        boxWidth: 8,
        color: '#64748b' // Slate-500
      }
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.95)', // Slate-800
      padding: 12,
      titleFont: { family: "'Inter', sans-serif", size: 13 },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9', borderDash: [4, 4] }, // Grid muito sutil (Slate-100)
      ticks: {
        font: { family: "'Inter', sans-serif", size: 10 },
        color: '#94a3b8',
        callback: (value) => value >= 1000 ? `${value / 1000}k` : value // Simplifica números grandes
      },
      border: { display: false }
    },
    x: {
      grid: { display: false },
      ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748b' },
      border: { display: false }
    }
  },
  layout: { padding: 10 },
  elements: {
    line: { tension: 0.4 }, // Curvas suaves
    point: { radius: 3, hitRadius: 10, hoverRadius: 6 }
  }
};

export function renderFinanceKPIs(elIds, invoices) {
  const refAlvo = latestRef(invoices);
  const doRef = refAlvo ? invoices.filter(i => i.ref === refAlvo) : invoices;

  const emitido = sum(doRef, x => x.valorEmitido);
  const pago = sum(doRef, x => x.valorPago);
  const inadR$ = Math.max(0, emitido - pago);
  const inadPct = emitido > 0 ? (inadR$ / emitido) : 0;
  // energia não está sendo usado no HTML novo, mas mantemos o cálculo caso precise
  // const energia = sum(doRef, x => x.energiaKwh);

  // DSO: média de (pagamento - vencimento) onde há pagamento
  const atrasos = doRef
    .map(i => daysBetween(i.dataVenc, i.dataPag))
    .filter(v => v !== null && !isNaN(v) && v >= 0);
  const dso = atrasos.length ? Math.round(sum(atrasos) / atrasos.length) : 0;

  const fmtR$ = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const put = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

  put(elIds.emitido, fmtR$(emitido));
  put(elIds.pago, fmtR$(pago));
  put(elIds.inadimplencia, `${(inadPct * 100).toFixed(1)}%`);
  put(elIds.dso, `${dso} d`);
}

export function renderRevenueTrend(ctx, invoices) {
  // Agrega por REF (Mês)
  const map = {};
  invoices.forEach(i => {
    if (!i.ref) return;
    map[i.ref] ??= { emitido: 0, pago: 0 };
    map[i.ref].emitido += Number(i.valorEmitido) || 0;
    map[i.ref].pago += Number(i.valorPago) || 0;
  });

  // Ordena cronologicamente
  const refs = Object.keys(map).sort();
  const emit = refs.map(r => map[r].emitido);
  const pay = refs.map(r => map[r].pago);
  const inad = refs.map((_, idx) => Math.max(0, emit[idx] - pay[idx]));

  const id = ctx.canvas.id;
  if (chartRefs.get(id)) { chartRefs.get(id).destroy(); chartRefs.delete(id); }

  chartRefs.set(id, new Chart(ctx, {
    type: 'line',
    data: {
      labels: refs,
      datasets: [
        {
          label: 'Emitido',
          data: emit,
          borderColor: '#0d9488', // Teal-600
          backgroundColor: 'rgba(13, 148, 136, 0.05)',
          fill: true
        },
        {
          label: 'Pago',
          data: pay,
          borderColor: '#10b981', // Emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          fill: true
        },
        {
          label: 'Em Aberto',
          data: inad,
          borderColor: '#f43f5e', // Rose-500
          borderDash: [5, 5],     // Linha tracejada para diferenciar
          backgroundColor: 'transparent',
          fill: false
        }
      ]
    },
    options: {
      ...commonOptions,
      interaction: {
        mode: 'index',
        intersect: false,
      }
    }
  }));
}

export function renderAgingChart(ctx, invoices) {
  const today = todayISO();
  // Buckets: Em Dia, 1-15, 16-30, etc.
  const buckets = { 'Em Dia': 0, '1–15': 0, '16–30': 0, '31–60': 0, '61–90': 0, '>90': 0 };

  invoices.forEach(i => {
    // Considera apenas o que está em aberto
    const aberto = (Number(i.valorEmitido) || 0) - (Number(i.valorPago) || 0);
    if (aberto <= 0.01) return; // Ignora valores zerados ou negativos (pagamento a maior)

    // Calcula dias de atraso em relação a hoje
    const dias = daysBetween(i.dataVenc, today);
    const b = getAgingBucket(dias);

    // Só soma se o bucket existir no nosso mapa (filtra 'Sem Data' se necessário)
    if (buckets[b] !== undefined) {
      buckets[b] += aberto;
    }
  });

  const labels = Object.keys(buckets);
  const values = labels.map(k => buckets[k]);

  // Cores dinâmicas para o Aging (Verde para "Em dia", gradiente de Vermelho para atrasos)
  const bgColors = labels.map(l => {
    if (l === 'Em Dia') return '#10b981'; // Emerald
    if (l === '1–15') return '#fca5a5';   // Rose-300
    if (l === '16–30') return '#f87171';  // Rose-400
    if (l === '31–60') return '#ef4444';  // Rose-500
    if (l === '61–90') return '#dc2626';  // Rose-600
    return '#9f1239';                     // Rose-800 (>90)
  });

  const id = ctx.canvas.id;
  if (chartRefs.get(id)) { chartRefs.get(id).destroy(); chartRefs.delete(id); }

  chartRefs.set(id, new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor em Aberto',
        data: values,
        backgroundColor: bgColors,
        borderRadius: 4,
        barPercentage: 0.6
      }]
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        legend: { display: false } // Sem legenda para barras simples
      }
    }
  }));
}