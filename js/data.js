/* ==========================================
   data.js — Busca de dados via CSV publicado
   do Google Sheets
   ========================================== */

/**
 * Parser simples de CSV (suporta campos com aspas e vírgulas internas)
 */
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = [];

  // Dividir em linhas respeitando campos multilinha entre aspas
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // Ignorar \r
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  // Parse cada linha em campos
  lines.forEach(function(line) {
    const fields = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    rows.push(fields);
  });

  return rows;
}

/**
 * Busca dados de uma aba específica como CSV e retorna array de objetos
 */
async function fetchSheetData(sheetName) {
  const url = getSheetCsvUrl(sheetName);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro HTTP ' + response.status + ' ao buscar ' + sheetName);
  }

  const text = await response.text();
  const rows = parseCSV(text);

  if (rows.length < 2) return [];

  // Primeira linha = cabeçalhos
  const headers = rows[0];
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const obj = { _rowIndex: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j] || '';
    }
    result.push(obj);
  }

  return result;
}

/**
 * Busca todas as viaturas
 */
async function fetchViaturas() {
  const dados = await fetchSheetData(CONFIG.sheets.viaturas);

  const ordinarias = [];
  const extraordinarias = [];

  const today = new Date();
  today.setHours(today.getHours() - 7); // O turno de 24h vira apenas às 07:00 da manhã
  const todayStr = ('0' + today.getDate()).slice(-2) + '/' + ('0' + (today.getMonth() + 1)).slice(-2) + '/' + today.getFullYear();

  dados.forEach(function(row) {

    // Auxiliar: buscar chave case insensitive
    function getVal(kTarget) {
      if (row[kTarget] !== undefined) return row[kTarget];
      for (const k in row) {
        if (k.trim().toUpperCase() === kTarget.toUpperCase()) return row[k];
      }
      return '';
    }

    const valData = getVal('Data') || getVal('DATA');
    const valPrefixo = getVal('Prefixo');
    const valMissao = getVal('Missão') || getVal('Missao');

    // Ignorar linhas vazias
    if (!valPrefixo && !valData) return;

    // Lidar com datas de qualquer formato (01/01/2026, 2026-01-01, etc)
    const rowData = String(valData).trim();
    let isToday = false;
    
    // YYYY-MM-DD comparison fallback
    const todayIso = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
    
    if (rowData.includes(todayStr) || rowData.includes(todayIso)) {
      isToday = true;
    } else {
       // Se o formato da planilha vier DD/M/YYYY
       let dparts = rowData.split(/[-/T ]/);
       if(dparts.length >= 3) {
         // Formato brasileiro ou americano ou ISO e tentaremos dar match exato nos int's
         let y = parseInt(dparts[2]), m = parseInt(dparts[1]), d = parseInt(dparts[0]);
         if(dparts[0].length === 4) { y = parseInt(dparts[0]); m = parseInt(dparts[1]); d = parseInt(dparts[2]); }
         // US: M/D/YYYY
         if(y > 1000 && m > 12) { let aux=m; m=d; d=aux; } // inverte
         
         if(y === today.getFullYear() && m === (today.getMonth() + 1) && d === today.getDate()) {
            isToday = true;
         }
       }
    }

    if (!isToday) return;

    const vtr = {
      rowIndex: row._rowIndex,
      data: valData,
      prefixo: String(valPrefixo).replace(/\.0$/, ''),
      quadrante: getVal('Quadrante'),
      pms: getVal('PMS'),
      qtr: getVal('QTR'),
      ef: getVal('E.F') || getVal('E.F.'),
      qrfDia: getVal('QRF DIA') || getVal('QRF_DIA'),
      qrfNoite: getVal('QRF NOITE') || getVal('QRF_NOITE'),
      revezamento: getVal('REVEZAMENTO'),
      missao: valMissao,
      unidade: getVal('Unidade'),
      tipo: getVal('Tipo')
    };

    if (String(vtr.tipo).toUpperCase().includes('EXTRA')) {
      extraordinarias.push(vtr);
    } else {
      ordinarias.push(vtr);
    }
  });

  return { ordinarias: ordinarias, extraordinarias: extraordinarias };
}

/**
 * Busca todas as missões
 */
async function fetchMissoes() {
  try {
    const dados = await fetchSheetData(CONFIG.sheets.missoes);
    const ativas = [];
    const historico = [];

    const today = new Date();
    today.setHours(today.getHours() - 7); // O turno de 24h vira apenas às 07:00 da manhã
    const todayStr = ('0' + today.getDate()).slice(-2) + '/' + ('0' + (today.getMonth() + 1)).slice(-2) + '/' + today.getFullYear();

    dados.forEach(function(row) {
      if (!row['Prefixo'] && !row['Missão'] && !row['Missao']) return;

      const dataRow = String(row['Data Início'] || row['Data Inicio'] || '').trim();
      const statusRow = String(row['Status'] || '').toLowerCase();

      // Forçar reset absoluto às 07:00 AM: Nenhuma missão ativa ou histórica do dia anterior sobrevive
      if (dataRow !== todayStr) return;

      const missao = {
        rowIndex: row._rowIndex,
        prefixo: String(row['Prefixo'] || '').replace(/\.0$/, ''),
        viaturaRowIndex: row['Viatura RowIndex'] || '',
        missao: row['Missão'] || row['Missao'] || '',
        tipoMissao: row['Tipo Missão'] || row['Tipo Missao'] || '',
        dataInicio: row['Data Início'] || row['Data Inicio'] || '',
        horaInicio: row['Hora Início'] || row['Hora Inicio'] || '',
        horaFim: row['Hora Fim'] || '',
        status: row['Status'] || ''
      };

      if (String(missao.status).toLowerCase() === 'ativa') {
        ativas.push(missao);
      } else if (missao.status) {
        historico.push(missao);
      }
    });

    historico.reverse();
    return { ativas: ativas, historico: historico };
  } catch (e) {
    // BD_Missoes pode não existir ainda
    console.warn('BD_Missoes não encontrada ou vazia:', e.message);
    return { ativas: [], historico: [] };
  }
}
