import { daysBetween, todayISO, getAgingBucket } from "../utils/date.js";

const chartRefs = new Map(); // guarda instâncias Chart por canvas id

const sum = (arr, sel = (x)=>x) => arr.reduce((s, v) => s + (Number(sel(v)) || 0), 0);

// Pega REF “mais recente” (lexicográfico funciona para yyyy-mm)
const latestRef = (invoices) => {
  const refs = [...new Set(invoices.map(i => i.ref).filter(Boolean))].sort();
  return refs.length ? refs[refs.length - 1] : null;
};

export function renderFinanceKPIs(elIds, invoices) {
  const refAlvo = latestRef(invoices);
  const doRef = refAlvo ? invoices.filter(i => i.ref === refAlvo) : invoices;

  const emitido = sum(doRef, x => x.valorEmitido);
  const pago    = sum(doRef, x => x.valorPago);
  const inadR$  = Math.max(0, emitido - pago);
  const inadPct = emitido > 0 ? (inadR$ / emitido) : 0;
  const energia = sum(doRef, x => x.energiaKwh);

  // DSO: média de (pagamento - vencimento) onde há pagamento
  const atrasos = doRef
    .map(i => daysBetween(i.dataVenc, i.dataPag))
    .filter(v => v !== null && !isNaN(v) && v >= 0);
  const dso = atrasos.length ? Math.round(sum(atrasos) / atrasos.length) : 0;

  const fmtR$ = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const put = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

  put(elIds.emitido, fmtR$(emitido));
  put(elIds.pago, fmtR$(pago));
  put(elIds.inadimplencia, `${(inadPct*100).toFixed(1)}%`);
  put(elIds.dso, `${dso} d`);
  put(elIds.energia, `${energia.toLocaleString('pt-BR')} kWh`);
}

export function renderRevenueTrend(ctx, invoices) {
  // Agrega por REF
  const map = {};
  invoices.forEach(i => {
    if (!i.ref) return;
    map[i.ref] ??= { emitido: 0, pago: 0 };
    map[i.ref].emitido += Number(i.valorEmitido) || 0;
    map[i.ref].pago    += Number(i.valorPago)    || 0;
  });
  const refs = Object.keys(map).sort();
  const emit = refs.map(r => map[r].emitido);
  const pay  = refs.map(r => map[r].pago);
  const inad = refs.map((_, idx) => Math.max(0, emit[idx] - pay[idx]));

  // Destroy se já existe
  const id = ctx.canvas.id;
  if (chartRefs.get(id)) { chartRefs.get(id).destroy(); chartRefs.delete(id); }

  chartRefs.set(id, new Chart(ctx, {
    type: 'line',
    data: {
      labels: refs,
      datasets: [
        { label: 'Emitido', data: emit, borderColor: 'rgb(37,99,235)', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.35 },
        { label: 'Pago',    data: pay,  borderColor: 'rgb(16,185,129)', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.35 },
        { label: 'Inad.',   data: inad, borderColor: 'rgb(239,68,68)',   backgroundColor: 'rgba(239,68,68,0.1)',  fill: true, tension: 0.35 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  }));
}

export function renderAgingChart(ctx, invoices) {
  const today = todayISO();
  // Para cada título em aberto (emitido > pago), calcula atraso = (hoje - venc)
  const buckets = { 'Em Dia':0, '1–15':0, '16–30':0, '31–60':0, '61–90':0, '>90':0, 'Sem Data':0 };
  invoices.forEach(i => {
    const aberto = (Number(i.valorEmitido)||0) - (Number(i.valorPago)||0);
    if (aberto <= 0) return;
    const dias = daysBetween(i.dataVenc, today);
    const b = getAgingBucket(dias);
    buckets[b] = (buckets[b] || 0) + aberto;
  });

  const labels = Object.keys(buckets);
  const values = labels.map(k => buckets[k]);

  const id = ctx.canvas.id;
  if (chartRefs.get(id)) { chartRefs.get(id).destroy(); chartRefs.delete(id); }

  chartRefs.set(id, new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Em aberto (R$)', data: values }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  }));
}
