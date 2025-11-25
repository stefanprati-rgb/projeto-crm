// Renderiza os KPIs e Lógica de Negócio
export function renderKPIs(elIds, clients) {
  const total = clients.length;
  const active = clients.filter(c => (c.status || '').toUpperCase() === 'ATIVO').length;

  // Inadimplentes
  const overdue = clients.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'INADIMPLENTE' || st === 'EM_COBRANCA';
  }).length;

  // Cálculo de Receita
  const monthly = clients.reduce((sum, c) => {
    let cons = parseFloat(String(c.consumption || 0).replace(',', '.')) || 0;
    let disc = parseFloat(String(c.discount || 15).replace(',', '.')) / 100;
    return sum + (cons * 0.85 * (1 - disc));
  }, 0);

  // --- CÁLCULO DE VACÂNCIA (Solicitação da Chefe) ---
  // 1. Soma do consumo médio dos clientes ATIVOS
  const totalConsumoMedio = clients
    .filter(c => (c.status || '').toUpperCase() === 'ATIVO')
    .reduce((sum, c) => sum + (parseFloat(String(c.consumption || 0).replace(',', '.')) || 0), 0);

  // 2. Geração Alvo (Contratual) das Usinas
  // IMPORTANTE: Como não temos a tabela de usinas ainda, vou fixar um valor alvo.
  // No futuro, isso deve vir da soma da 'Potência' ou 'Geração Estimada' das usinas cadastradas.
  const geracaoAlvo = 75000; // Exemplo: 75.000 kWh (Ajustar conforme realidade)

  // 3. Cálculo da Vacância Contratual (%)
  // Fórmula: 1 - (Soma Consumo / Geração Alvo)
  // Se Consumo = 50k e Alvo = 75k, ocupação é 66%, vacância é 33%
  let vacanciaContratual = 0;
  if (geracaoAlvo > 0) {
    vacanciaContratual = Math.max(0, 100 - ((totalConsumoMedio / geracaoAlvo) * 100));
  }

  // Atualiza elementos do DOM
  updateText(elIds.total, total);
  updateText(elIds.active, active);
  updateText(elIds.overdue, overdue);
  updateText(elIds.revenue, monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

  // Se houver elementos de vacância no HTML (sugestão de adição futura)
  if (document.getElementById('kpi-vacancia')) {
    document.getElementById('kpi-vacancia').textContent = vacanciaContratual.toFixed(1) + '%';
  }
}

function updateText(id, val) {
  if (document.getElementById(id)) document.getElementById(id).textContent = val;
}

// Gráfico de Evolução (Clientes por Etapa)
export function renderClientsChart(ctx, clients, chartInstanceRef) {
  // Etapas do Processo (Solicitação da Chefe)
  // Mapeamos o status ou uma coluna 'etapaUc' para estas categorias
  const etapas = {
    'Novo': 0,
    'Enviado Rateio': 0,
    'Rateio Cadastrado': 0,
    'Faturado': 0
  };

  clients.forEach(c => {
    // Lógica de classificação baseada em status ou etapa
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
    type: 'bar', // Mudamos para barras para mostrar funil/etapas
    data: {
      labels,
      datasets: [{
        label: 'Clientes por Etapa',
        data,
        backgroundColor: [
          '#94a3b8', // Novo (Cinza)
          '#f59e0b', // Enviado (Amarelo)
          '#3b82f6', // Cadastrado (Azul)
          '#10b981'  // Faturado (Verde)
        ],
        borderRadius: 6,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { borderDash: [4, 4] } }, x: { grid: { display: false } } }
    }
  });
}

// Gráfico de Status do Rateio (Novo)
export function renderStatusChart(ctx, clients, chartInstanceRef) {
  const counts = {};

  clients.forEach(c => {
    // Usa o campo STATUS RATEIO se existir, senão usa STATUS DO CLIENTE
    let st = c.statusRateio || c.status || 'N/A';
    st = st.toUpperCase();
    counts[st] = (counts[st] ?? 0) + 1;
  });

  // Pega os top 5 status para não poluir o gráfico
  const sortedLabels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
  const data = sortedLabels.map(l => counts[l]);

  if (chartInstanceRef.value) chartInstanceRef.value.destroy();

  chartInstanceRef.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sortedLabels,
      datasets: [{
        data,
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#94a3b8'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } }
      }
    }
  });
}