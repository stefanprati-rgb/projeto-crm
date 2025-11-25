// Renderiza os KPIs (Indicadores Chave de Desempenho)
export function renderKPIs(elIds, clients) {
  const total = clients.length;
  const active = clients.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'ATIVO';
  }).length;

  // Lógica de inadimplentes:
  // Se houver um campo específico, usa-o. Senão, tenta inferir pelo status.
  const overdue = clients.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'INADIMPLENTE' || st === 'EM_COBRANCA' || st === 'ATRASADO';
  }).length;

  // Cálculo de Receita Estimada
  const monthly = clients.reduce((sum, c) => {
    // Tenta ler consumo como número, remove 'kWh' se houver
    let consStr = c.consumption || c.consumoMedio || 0;
    if (typeof consStr === 'string') consStr = consStr.replace(/[^\d.,]/g, '').replace(',', '.');

    const cons = parseFloat(consStr) || 0;

    // Desconto (padrão 15%)
    let discStr = c.discount || c.desconto || 15;
    if (typeof discStr === 'string') discStr = discStr.replace(/[^\d.,]/g, '').replace(',', '.');
    const discount = parseFloat(discStr) / 100;

    const kwhPrice = 0.85; // Valor médio estimado por kWh

    // Fórmula simples: Consumo * Preço * (1 - Desconto)
    return sum + (cons * kwhPrice * (1 - discount));
  }, 0);

  // Atualiza o DOM
  if (document.getElementById(elIds.total)) document.getElementById(elIds.total).textContent = total;
  if (document.getElementById(elIds.active)) document.getElementById(elIds.active).textContent = active;
  if (document.getElementById(elIds.overdue)) document.getElementById(elIds.overdue).textContent = overdue;
  if (document.getElementById(elIds.revenue)) document.getElementById(elIds.revenue).textContent =
    monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Renderiza o Gráfico de Evolução (Linha)
export function renderClientsChart(ctx, clients, chartInstanceRef) {
  // Simulação de dados históricos baseada no total atual
  // Num cenário real, estes dados viriam de um histórico no banco de dados
  const total = clients.length;

  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const data = [
    Math.max(0, Math.floor(total * 0.5)),
    Math.max(0, Math.floor(total * 0.6)),
    Math.max(0, Math.floor(total * 0.7)),
    Math.max(0, Math.floor(total * 0.8)),
    Math.max(0, Math.floor(total * 0.9)),
    total
  ];

  // Destrói gráfico anterior se existir para evitar sobreposição
  if (chartInstanceRef.value) chartInstanceRef.value.destroy();

  chartInstanceRef.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Crescimento da Base',
        data,
        // COR ATUALIZADA: Teal (#0f766e) para combinar com o CSS
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#0f766e',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 10,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { borderDash: [4, 4], color: '#e2e8f0' },
          ticks: { color: '#64748b' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' }
        }
      }
    }
  });
}

// Renderiza o Gráfico de Status (Rosca/Doughnut)
export function renderStatusChart(ctx, clients, chartInstanceRef) {
  const counts = { ATIVO: 0, INATIVO: 0, EM_CANCELAMENTO: 0, PENDENTE: 0 };

  clients.forEach(c => {
    let st = (c.status || 'PENDENTE').toUpperCase();

    // Normalização básica de status
    if (st.includes('ATIV')) st = 'ATIVO';
    else if (st.includes('CANCEL')) st = 'EM_CANCELAMENTO';
    else if (st.includes('INATIV')) st = 'INATIVO';
    else st = 'PENDENTE';

    counts[st] = (counts[st] ?? 0) + 1;
  });

  const data = [counts.ATIVO, counts.INATIVO, counts.EM_CANCELAMENTO, counts.PENDENTE];

  if (chartInstanceRef.value) chartInstanceRef.value.destroy();

  chartInstanceRef.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ativo', 'Inativo', 'Cancelamento', 'Pendente'],
      datasets: [{
        data,
        // CORES ATUALIZADAS (Teal, Slate, Red, Amber)
        backgroundColor: [
          '#10b981', // Emerald 500 (Ativo)
          '#94a3b8', // Slate 400 (Inativo)
          '#ef4444', // Red 500 (Cancelamento)
          '#f59e0b'  // Amber 500 (Pendente)
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            font: { size: 11 },
            color: '#64748b'
          }
        }
      },
      cutout: '75%', // Rosca mais fina e elegante
      layout: { padding: 10 }
    }
  });
}