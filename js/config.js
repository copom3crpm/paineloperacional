/* ==========================================
   config.js — Configuração do Dashboard
   Planilha já incorporada, sem necessidade
   de configuração manual.
   ========================================== */

const CONFIG = {
  // Chave de publicação da planilha (incorporada)
  publishedKey: '2PACX-1vSTYNrdmrkJmwP9oN280znnLm9MlcTsi04BW_iEt_dj93JQTXWUcqntmgwTEzorPplft5DowcxuxQww',

  // GIDs das abas do Google Sheets (Obrigatório pois "sheet=Nome" não funciona para exportação CSV de doc publicado)
  gids: {
    'BD_Viaturas': '974479529',
    'BD_Missoes': '1133050275'
  },

  // Nomes das abas
  sheets: {
    viaturas: 'BD_Viaturas',
    missoes: 'BD_Missoes'
  },

  // Intervalo de auto-refresh (ms) — 60 segundos
  refreshInterval: 60000
};

/**
 * Monta a URL de CSV publicado para uma aba específica
 */
function getSheetCsvUrl(sheetName) {
  const gid = CONFIG.gids[sheetName] || '0';
  return 'https://docs.google.com/spreadsheets/d/e/' +
    CONFIG.publishedKey +
    '/pub?single=true&gid=' + gid +
    '&output=csv&t=' + Date.now(); // cache-bust para dados frescos
}
