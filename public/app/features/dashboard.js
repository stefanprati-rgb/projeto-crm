export function renderKPIs(elIds, clients) {
  const total = clients.length;
  const active = clients.filter(c => c.status === 'ATIVO').length;
  const overdue = clients.filter(c => c.isOverdue === true).length; // campo real
  const monthly = clients.reduce((sum, c) => {
    const cons = parseFloat(c.consumption || 0);
    const discount = parseFloat(c.discount || 15) / 100;
    const kwh = parseFloat(c.kwhPrice ?? 0.85);
    return sum + (cons * kwh * (1 - discount));
  }, 0);

  document.getElementById(elIds.total).textContent = total;
  document.getElementById(elIds.active).textContent = active;
  document.getElementById(elIds.overdue).textContent = overdue;
  document.getElementById(elIds.revenue).textContent =
    monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function renderClientsChart(ctx, clients, chartInstanceRef) {
  const labels = ['Jan','Fev','Mar','Abr','Mai','Jun'];
  const data = [
    Math.max(0, clients.length - 50),
    Math.max(0, clients.length - 40),
    Math.max(0, clients.length - 30),
    Math.max(0, clients.length - 20),
    Math.max(0, clients.length - 10),
    clients.length
  ];
  if (chartInstanceRef.value) chartInstanceRef.value.destroy();
  chartInstanceRef.value = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Clientes Ativos', data, borderColor: 'rgb(37,99,235)', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.4 }]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }}, scales: { y: { beginAtZero: true } } }
  });
}

export function renderStatusChart(ctx, clients, chartInstanceRef) {
  const counts = { ATIVO:0, INATIVO:0, EM_CANCELAMENTO:0, PENDENTE:0 };
  clients.forEach(c => { counts[c.status || 'PENDENTE'] = (counts[c.status || 'PENDENTE'] ?? 0) + 1; });
  if (chartInstanceRef.value) chartInstanceRef.value.destroy();
  chartInstanceRef.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ativo','Inativo','Em Cancelamento','Pendente'],
      datasets: [{ data: [counts.ATIVO, counts.INATIVO, counts.EM_CANCELAMENTO, counts.PENDENTE] }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}
