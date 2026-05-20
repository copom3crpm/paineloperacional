/* ==========================================
   charts.js — Criação de gráficos (Chart.js)
   ========================================== */

// Referências globais aos gráficos
let chartVtrUnidade = null;
let chartVtrTipo = null;
let chartMissaoTipo = null;

// Paleta de cores
const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#14b8a6',
  '#f97316', '#6366f1', '#84cc16', '#e11d48'
];

/**
 * Configuração base do Chart.js para tema escuro
 */
function getChartDefaults() {
  return {
    color: '#94a3b8',
    borderColor: 'rgba(255,255,255,0.06)',
    font: { family: "'Inter', sans-serif" }
  };
}

/**
 * Gráfico: Viaturas por Unidade (bar)
 */
function renderChartVtrUnidade(viaturas) {
  const ctx = document.getElementById('chartVtrUnidade');
  if (!ctx) return;

  // Agrupar por unidade
  const porUnidade = {};
  const todas = viaturas.ordinarias.concat(viaturas.extraordinarias);
  todas.forEach(function(v) {
    const uni = v.unidade || 'Sem unidade';
    porUnidade[uni] = (porUnidade[uni] || 0) + 1;
  });

  const labels = Object.keys(porUnidade);
  const data = Object.values(porUnidade);

  if (chartVtrUnidade) chartVtrUnidade.destroy();

  chartVtrUnidade = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Viaturas',
        data: data,
        backgroundColor: labels.map(function(_, i) {
          return CHART_COLORS[i % CHART_COLORS.length] + '40';
        }),
        borderColor: labels.map(function(_, i) {
          return CHART_COLORS[i % CHART_COLORS.length];
        }),
        borderWidth: 2,
        borderRadius: 6,
        maxBarThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#64748b',
            stepSize: 1,
            font: { size: 11 }
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

/**
 * Gráfico: Ordinárias vs Extraordinárias (doughnut)
 */
function renderChartVtrTipo(viaturas) {
  const ctx = document.getElementById('chartVtrTipo');
  if (!ctx) return;

  const ordCount = viaturas.ordinarias.length;
  const extCount = viaturas.extraordinarias.length;

  if (chartVtrTipo) chartVtrTipo.destroy();

  chartVtrTipo = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ordinárias', 'Extraordinárias'],
      datasets: [{
        data: [ordCount, extCount],
        backgroundColor: ['#3b82f640', '#f59e0b40'],
        borderColor: ['#3b82f6', '#f59e0b'],
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            padding: 16,
            font: { size: 12, weight: '600' },
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 8
        }
      }
    }
  });
}

/**
 * Gráfico: Missões por Tipo (horizontal bar)
 */
function renderChartMissaoTipo(missoes) {
  const ctx = document.getElementById('chartMissaoTipo');
  if (!ctx) return;

  // Agrupar por tipo
  const porTipo = {};
  const todas = missoes.ativas.concat(missoes.historico);
  todas.forEach(function(m) {
    const tipo = m.tipoMissao || 'Sem tipo';
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  });

  const labels = Object.keys(porTipo);
  const data = Object.values(porTipo);

  if (chartMissaoTipo) chartMissaoTipo.destroy();

  chartMissaoTipo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Missões',
        data: data,
        backgroundColor: labels.map(function(_, i) {
          return CHART_COLORS[i % CHART_COLORS.length] + '40';
        }),
        borderColor: labels.map(function(_, i) {
          return CHART_COLORS[i % CHART_COLORS.length];
        }),
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#64748b', stepSize: 1, font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}
