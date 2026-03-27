/* ==========================================
   app.js — Lógica principal do Dashboard
   Auto-load + Auto-refresh incorporados
   ========================================== */

let refreshTimer = null;
let dashData = {
  viaturas: { ordinarias: [], extraordinarias: [] },
  missoes: { ativas: [], historico: [] }
};

// ========================
// INICIALIZAÇÃO
// ========================
document.addEventListener('DOMContentLoaded', function() {
  initThemeIcon();
  initClock();

  // Carregar dados automaticamente ao abrir
  loadDashboard();

  // Auto-refresh a cada 60 segundos
  startAutoRefresh();
});

// ========================
// TEMA (CLARO/ESCURO)
// ========================
function initThemeIcon() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('copom-theme', newTheme);
  
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = newTheme === 'light' ? '🌙' : '☀️';
}

// ========================
// RELÓGIO
// ========================
function initClock() {
  function update() {
    var now = new Date();
    var timeEl = document.getElementById('clockTime');
    var dateEl = document.getElementById('clockDate');
    if (timeEl) {
      timeEl.textContent =
        ('0' + now.getHours()).slice(-2) + ':' +
        ('0' + now.getMinutes()).slice(-2) + ':' +
        ('0' + now.getSeconds()).slice(-2);
    }
    if (dateEl) {
      var dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      var meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      dateEl.textContent =
        dias[now.getDay()] + ', ' +
        ('0' + now.getDate()).slice(-2) + ' ' +
        meses[now.getMonth()] + ' ' +
        now.getFullYear();
    }
  }
  update();
  setInterval(update, 1000);
}

// ========================
// AUTO-REFRESH
// ========================
function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(function() {
    loadDashboard();
  }, CONFIG.refreshInterval);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// ========================
// CARREGAR DADOS
// ========================
async function loadDashboard() {
  var btn = document.getElementById('btnRefresh');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Atualizando...';
  }
  showStatus('Buscando dados...', 'info');

  try {
    // Buscar dados em paralelo
    var results = await Promise.all([
      fetchViaturas(),
      fetchMissoes()
    ]);

    dashData.viaturas = results[0];
    dashData.missoes = results[1];

    renderDashboard();
    showStatus('✅ Atualizado às ' + new Date().toLocaleTimeString('pt-BR'), 'success');
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    showStatus('❌ Erro: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🔄 Atualizar';
    }
  }
}

// ========================
// RENDERIZAR DASHBOARD
// ========================
function renderDashboard() {
  renderScorecards();
  renderCharts();
  renderDisponibilidadePorUnidade();
  renderViaturasTable();
  renderMissoesAtivas();
  renderHistorico();
}

function renderDisponibilidadePorUnidade() {
  var grid = document.getElementById('iduGrid');
  var summary = document.getElementById('idxSummary');
  if (!grid) return;

  var todas = dashData.viaturas.ordinarias.concat(dashData.viaturas.extraordinarias);
  var porUnidade = {};

  todas.forEach(function(v) {
    var uni = v.unidade || 'Sem unidade';
    if (!porUnidade[uni]) porUnidade[uni] = { disponivel: 0, indisponivel: 0 };
    var temMissao = v.missao && String(v.missao).trim() !== '' && String(v.missao).trim() !== '-' && String(v.missao).trim() !== '—';
    if (temMissao) porUnidade[uni].indisponivel++;
    else porUnidade[uni].disponivel++;
  });

  var totalD = 0, totalI = 0;
  var html = '';

  Object.keys(porUnidade).sort().forEach(function(uni) {
    var u = porUnidade[uni];
    var total = u.disponivel + u.indisponivel;
    var pct = total > 0 ? Math.round((u.disponivel / total) * 100) : 0;
    var cor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    totalD += u.disponivel;
    totalI += u.indisponivel;

    html += '<div style="background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">';
    html +=   '<div>';
    html +=     '<div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);">' + uni + '</div>';
    html +=     '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">' + total + ' viatura' + (total !== 1 ? 's' : '') + '</div>';
    html +=   '</div>';
    html +=   '<span style="font-size:0.78rem;font-weight:700;color:' + cor + ';">' + pct + '%</span>';
    html += '</div>';
    html += '<div style="height:5px;background:var(--border);border-radius:999px;margin-bottom:10px;overflow:hidden;">';
    html +=   '<div style="height:100%;width:' + pct + '%;background:' + cor + ';border-radius:999px;"></div>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:space-between;">';
    html +=   '<span style="font-size:0.72rem;color:#10b981;font-weight:700;">🟢 ' + u.disponivel + ' disp.</span>';
    html +=   '<span style="font-size:0.72rem;color:#ef4444;font-weight:700;">🔴 ' + u.indisponivel + ' missão</span>';
    html += '</div>';
    html += '</div>';
  });

  grid.innerHTML = html;
  if (summary) summary.textContent = totalD + ' disponíveis · ' + totalI + ' em missão';
}

// ========================
// SCORECARDS
// ========================
function renderScorecards() {
  var vtr = dashData.viaturas;
  var mis = dashData.missoes;
  var totalVtr = vtr.ordinarias.length + vtr.extraordinarias.length;
  var totalEfetivo = countEfetivo(vtr);

  animateValue('scVtrTotal', totalVtr);
  animateValue('scEfetivo', totalEfetivo);
  animateValue('scMissoesAtivas', mis.ativas.length);
  animateValue('scMissoesEncerradas', mis.historico.length);

  var subOrd = document.getElementById('scVtrSub');
  if (subOrd) {
    subOrd.textContent = vtr.ordinarias.length + ' ord. + ' + vtr.extraordinarias.length + ' extra';
  }
}

function countEfetivo(vtr) {
  var total = 0;
  var todas = vtr.ordinarias.concat(vtr.extraordinarias);
  todas.forEach(function(v) {
    if (v.pms) {
      var pms = v.pms.split('/');
      total += pms.length;
    }
  });
  return total;
}

function animateValue(id, end) {
  var el = document.getElementById(id);
  if (!el) return;
  var start = parseInt(el.textContent) || 0;
  if (start === end) { el.textContent = end; return; }

  var duration = 600;
  var startTime = performance.now();

  function step(currentTime) {
    var elapsed = currentTime - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (end - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ========================
// GRÁFICOS
// ========================
function renderCharts() {
  renderChartVtrUnidade(dashData.viaturas);
  renderChartVtrTipo(dashData.viaturas);
  renderChartMissaoTipo(dashData.missoes);
}

// ========================
// TABELA DE VIATURAS
// ========================
function renderViaturasTable() {
  var container = document.getElementById('viaturasTableBody');
  if (!container) return;

  var todas = dashData.viaturas.ordinarias.concat(dashData.viaturas.extraordinarias);

  if (todas.length === 0) {
    container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">Nenhuma viatura encontrada</td></tr>';
    return;
  }

  var html = '';
  todas.forEach(function(v) {
    var temMissao = v.missao && String(v.missao).trim() !== '' && String(v.missao).trim() !== '-';
    var statusClass = temMissao ? 'unavailable' : 'available';
    var statusText = temMissao ? '🔴 INDISPONÍVEL' : '🟢 DISPONÍVEL';

    html += '<tr' + (temMissao ? ' style="background:rgba(239,68,68,0.04);"' : '') + '>';
    html += '<td><span class="prefixo-badge">' + (v.prefixo || '-') + '</span></td>';
    html += '<td>' + (v.quadrante || '-') + '</td>';
    html += '<td>' + (v.unidade || '-') + '</td>';
    html += '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;" title="' + (v.pms || '') + '">' + (v.pms || '-') + '</td>';
    html += '<td>' + (temMissao ? '<strong style="color:#ef4444;">' + v.missao + '</strong>' : '—') + '</td>';
    html += '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>';
    html += '<td style="text-align:center;">' + (v.tipo || '-') + '</td>';
    html += '</tr>';
  });

  container.innerHTML = html;
}

// ========================
// MISSÕES ATIVAS
// ========================
function renderMissoesAtivas() {
  var container = document.getElementById('missoesAtivasCards');
  if (!container) return;

  var ativas = dashData.missoes.ativas;

  if (ativas.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">✅</div><p>Nenhuma missão ativa</p></div>';
    return;
  }

  var html = '';
  ativas.forEach(function(m) {
    html += '<div class="mission-card">';
    html += '<div class="mc-info">';
    html += '<span class="mc-prefixo">' + m.prefixo + '</span>';
    html += '<span class="mc-name">' + m.missao + '</span>';
    if (m.tipoMissao) {
      html += '<span class="mc-type">' + m.tipoMissao + '</span>';
    }
    html += '<span class="mc-time">⏰ ' + m.horaInicio + '</span>';
    html += '</div>';
    html += '<span class="mc-timer" id="timer_' + m.rowIndex + '">--:--</span>';
    html += '</div>';
  });

  container.innerHTML = html;

  // Iniciar cronômetros
  ativas.forEach(function(m) {
    startTimer(m);
  });
}

function startTimer(missao) {
  var el = document.getElementById('timer_' + missao.rowIndex);
  if (!el) return;

  var parts = String(missao.horaInicio).split(':');
  if (parts.length < 2) return;
  var h = parseInt(parts[0]) || 0;
  var m = parseInt(parts[1]) || 0;

  function update() {
    var now = new Date();
    var inicioMin = h * 60 + m;
    var agoraMin = now.getHours() * 60 + now.getMinutes();
    var diff = agoraMin - inicioMin;
    if (diff < 0) diff += 1440;
    var dh = Math.floor(diff / 60);
    var dm = diff % 60;
    el.textContent = ('0' + dh).slice(-2) + ':' + ('0' + dm).slice(-2);
  }
  update();
  setInterval(update, 30000);
}

// ========================
// HISTÓRICO
// ========================
function renderHistorico() {
  var container = document.getElementById('historicoList');
  if (!container) return;

  var hist = dashData.missoes.historico;

  if (hist.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nenhuma missão encerrada</p></div>';
    return;
  }

  var html = '<table class="dash-table"><thead><tr>';
  html += '<th>PREFIXO</th><th>MISSÃO</th><th>TIPO</th><th>INÍCIO</th><th>FIM</th><th>DURAÇÃO</th>';
  html += '</tr></thead><tbody>';

  hist.forEach(function(m) {
    var duracao = calcDuration(m.horaInicio, m.horaFim);
    html += '<tr>';
    html += '<td><span class="prefixo-badge">' + m.prefixo + '</span></td>';
    html += '<td>' + m.missao + '</td>';
    html += '<td>' + (m.tipoMissao || '-') + '</td>';
    html += '<td>' + m.horaInicio + '</td>';
    html += '<td>' + (m.horaFim || '-') + '</td>';
    html += '<td><span class="badge available">' + (duracao || '-') + '</span></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function calcDuration(start, end) {
  if (!start || !end) return '';
  var ps = String(start).split(':');
  var pe = String(end).split(':');
  if (ps.length < 2 || pe.length < 2) return '';
  var minS = (parseInt(ps[0]) || 0) * 60 + (parseInt(ps[1]) || 0);
  var minE = (parseInt(pe[0]) || 0) * 60 + (parseInt(pe[1]) || 0);
  var diff = minE - minS;
  if (diff < 0) diff += 1440;
  var h = Math.floor(diff / 60);
  var m = diff % 60;
  return h > 0 ? h + 'h ' + m + 'min' : m + 'min';
}

// ========================
// STATUS
// ========================
function showStatus(msg, type) {
  var el = document.getElementById('statusMessage');
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-msg ' + type;
}
