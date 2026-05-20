function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistema Operacional Diário')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ========================================
// ===== REGISTROS OPERACIONAIS ==========
// ========================================

function salvarRegistro(dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('Registros');
  if (!aba) throw new Error("Aba 'Registros' não encontrada.");
  
  aba.appendRow([
    dados.data, dados.supervisor, dados.telefone, dados.unidade,
    dados.vtrOrdinario, dados.vtrExtra, dados.motos,
    dados.pmsOrdinario, dados.pmsExtra,
    dados.copomDiurno, dados.copomNoturno, dados.cpu
  ]);
  return "Registro salvo com sucesso!";
}

function salvarMultiplosRegistros(listaDados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('Registros');
  if (!aba) throw new Error("Aba 'Registros' não encontrada.");
  
  const linhas = listaDados.map(function(dados) {
    return [
      dados.data, dados.supervisor, dados.telefone, dados.unidade,
      dados.vtrOrdinario, dados.vtrExtra, dados.motos,
      dados.pmsOrdinario, dados.pmsExtra,
      dados.copomDiurno, dados.copomNoturno, dados.cpu
    ];
  });
  
  if (linhas.length > 0) {
    aba.getRange(aba.getLastRow() + 1, 1, linhas.length, 12).setValues(linhas);
  }
  return "Todos os registros cadastrados com sucesso!";
}

function listarRegistros() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('Registros');
  if (!aba) throw new Error("Aba 'Registros' não encontrada.");
  
  const dados = aba.getDataRange().getValues();
  const registros = [];
  
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (!linha[0] && !linha[1] && !linha[3]) continue;
    
    let dataFormatada = '';
    if (linha[0]) {
      if (linha[0] instanceof Date) {
        const d = linha[0];
        dataFormatada = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
      } else {
        dataFormatada = linha[0].toString();
      }
    }
    
    registros.push({
      rowIndex: i + 1,
      data: dataFormatada,
      dataOriginal: linha[0] instanceof Date ? Utilities.formatDate(linha[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') : (linha[0] || ''),
      supervisor: linha[1] || '', telefone: linha[2] || '', unidade: linha[3] || '',
      vtrOrdinario: linha[4] || 0, vtrExtra: linha[5] || 0, motos: linha[6] || 0,
      pmsOrdinario: linha[7] || 0, pmsExtra: linha[8] || 0,
      copomDiurno: linha[9] || '', copomNoturno: linha[10] || '', cpu: linha[11] || ''
    });
  }
  return registros.reverse();
}

function obterRegistro(rowIndex) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('Registros');
  if (!aba) throw new Error("Aba 'Registros' não encontrada.");
  
  const linha = aba.getRange(rowIndex, 1, 1, 12).getValues()[0];
  let dataOriginal = '';
  if (linha[0] instanceof Date) {
    dataOriginal = Utilities.formatDate(linha[0], Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } else if (linha[0]) {
    dataOriginal = linha[0].toString();
  }
  
  return {
    rowIndex: rowIndex, data: dataOriginal,
    supervisor: linha[1] || '', telefone: linha[2] || '', unidade: linha[3] || '',
    vtrOrdinario: linha[4] || 0, vtrExtra: linha[5] || 0, motos: linha[6] || 0,
    pmsOrdinario: linha[7] || 0, pmsExtra: linha[8] || 0,
    copomDiurno: linha[9] || '', copomNoturno: linha[10] || '', cpu: linha[11] || ''
  };
}

function atualizarRegistro(rowIndex, dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('Registros');
  if (!aba) throw new Error("Aba 'Registros' não encontrada.");
  
  const valores = [
    dados.data, dados.supervisor, dados.telefone, dados.unidade,
    dados.vtrOrdinario, dados.vtrExtra, dados.motos,
    dados.pmsOrdinario, dados.pmsExtra,
    dados.copomDiurno, dados.copomNoturno, dados.cpu
  ];
  aba.getRange(rowIndex, 1, 1, 12).setValues([valores]);
  return "Registro atualizado com sucesso!";
}

function excluirRegistro(rowIndex) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('Registros');
  if (!aba) throw new Error("Aba 'Registros' não encontrada.");
  aba.deleteRow(rowIndex);
  return "Registro excluído com sucesso!";
}

// ========================================
// ===== DADOS PARA SELECTS ==============
// ========================================

// Ordem de hierarquia militar (menor número = mais antigo)
const HIERARQUIA = {
  'CORONEL': 1, 'CEL': 1,
  'TENENTE CORONEL': 2, 'TC': 2,
  'MAJOR': 3, 'MAJ': 3,
  'CAPITÃO': 4, 'CAP': 4,
  'CAPITAO': 4,
  '1° TENENTE': 5, '1 TENENTE': 5, '1TEN': 5, '1º TENENTE': 5,
  '2° TENENTE': 6, '2 TENENTE': 6, '2TEN': 6, '2º TENENTE': 6,
  'ASPIRANTE': 7, 'ASP': 7,
  'SUBTENENTE': 8, 'ST': 8,
  '1° SARGENTO': 9, '1SGT': 9, '1 SARGENTO': 9, '1º SARGENTO': 9,
  '2° SARGENTO': 10, '2SGT': 10, '2 SARGENTO': 10, '2º SARGENTO': 10,
  '3° SARGENTO': 11, '3SGT': 11, '3 SARGENTO': 11, '3º SARGENTO': 11,
  'CABO': 12, 'CB': 12,
  'SOLDADO': 13, 'SD': 13
};

function obterOrdemPosto(posto) {
  if (!posto) return 99;
  var p = posto.toString().trim().toUpperCase();
  // Tentar match exato primeiro
  if (HIERARQUIA[p] !== undefined) return HIERARQUIA[p];
  // Tentar match parcial
  for (var key in HIERARQUIA) {
    if (p.indexOf(key) !== -1) return HIERARQUIA[key];
  }
  return 99;
}

function obterDadosFormulario() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  
  // Unidades da aba 'Viaturas'
  let unidadesUnicas = [];
  const abaViaturas = planilha.getSheetByName('Viaturas');
  if (abaViaturas) {
    const dadosViaturas = abaViaturas.getDataRange().getValues();
    const unidadesSet = new Set();
    for (let i = 1; i < dadosViaturas.length; i++) {
      let unidade = dadosViaturas[i][2];
      if (unidade && unidade.toString().trim() !== "") {
        unidadesSet.add(unidade.toString().trim());
      }
    }
    unidadesUnicas = Array.from(unidadesSet).sort();
  }

  // Policiais da aba 'Base2' — com RG, Posto e Nome
  // Colunas: A=# B=CRPM C=QTD D=Posto(3) E=Quadro(4) F=RG(5) G=Nome(6)
  let policiais = [];
  const abaBase2 = planilha.getSheetByName('Base2');
  if (abaBase2) {
    const dadosBase2 = abaBase2.getDataRange().getValues();
    for (let i = 3; i < dadosBase2.length; i++) {
      let posto = dadosBase2[i][3];
      let rg = dadosBase2[i][5];
      let nome = dadosBase2[i][6];
      if (posto && nome) {
        let postoStr = posto.toString().trim();
        let rgStr = rg ? rg.toString().trim() : '';
        // Limpar RG numérico (remover .0)
        if (rgStr.endsWith('.0')) rgStr = rgStr.slice(0, -2);
        if (!isNaN(rg) && rg) rgStr = Math.floor(Number(rg)).toString();
        let nomeStr = nome.toString().trim();
        let postoOrdem = obterOrdemPosto(postoStr);
        
        policiais.push({
          rg: rgStr,
          posto: postoStr,
          nome: nomeStr,
          postoOrdem: postoOrdem,
          display: (rgStr ? rgStr + ' - ' : '') + postoStr + ' ' + nomeStr
        });
      }
    }
    // Ordenar por hierarquia (mais antigo primeiro)
    policiais.sort(function(a, b) {
      return a.postoOrdem - b.postoOrdem;
    });
  }

  // Setores/Quadrantes da aba 'Viaturas'
  let setores = [];
  if (abaViaturas) {
    const dadosVtr = abaViaturas.getDataRange().getValues();
    const setoresSet = new Set();
    for (let i = 1; i < dadosVtr.length; i++) {
      let setor = dadosVtr[i][1];
      if (setor && setor.toString().trim() !== "") {
        setoresSet.add(setor.toString().trim());
      }
    }
    setores = Array.from(setoresSet).sort();
  }

  // Prefixos da aba 'Viaturas' — Coluna F (índice 5)
  let prefixos = [];
  if (abaViaturas) {
    const dadosVtr = abaViaturas.getDataRange().getValues();
    const prefixosSet = new Set();
    for (let i = 1; i < dadosVtr.length; i++) {
      let prefixo = dadosVtr[i][4];
      if (prefixo) {
        let pStr = prefixo.toString().trim();
        if (pStr.endsWith('.0')) pStr = pStr.slice(0, -2);
        if (!isNaN(prefixo)) pStr = Math.floor(Number(prefixo)).toString();
        if (pStr !== "" && pStr !== "0") {
          prefixosSet.add(pStr);
        }
      }
    }
    prefixos = Array.from(prefixosSet).sort();
  }

  // Bairros da aba 'Bairros'
  let bairrosAisp14 = []; // Área Norte
  let bairrosAisp15 = []; // Área Sul
  let quadrantes = [];
  let cidades = [];
  const abaBairros = planilha.getSheetByName('Bairros');
  if (abaBairros) {
    const dadosBairros = abaBairros.getDataRange().getValues();
    const cidadesSet = new Set();
    for (let i = 1; i < dadosBairros.length; i++) {
      let b14 = dadosBairros[i][0];
      if (b14 && b14.toString().trim() !== '') {
        bairrosAisp14.push(b14.toString().trim());
      }
      let b15 = dadosBairros[i][1];
      if (b15 && b15.toString().trim() !== '') {
        bairrosAisp15.push(b15.toString().trim());
      }
      let quad = dadosBairros[i][2];
      if (quad && quad.toString().trim() !== '') {
        quadrantes.push(quad.toString().trim());
      }
      // Cidades da Coluna D
      let cid = dadosBairros[i][3];
      if (cid && cid.toString().trim() !== '') {
        cidadesSet.add(cid.toString().trim());
      }
    }
    cidades = Array.from(cidadesSet).sort();
  }

  return {
    unidades: unidadesUnicas,
    policiais: policiais,
    setores: setores,
    prefixos: prefixos,
    bairrosAisp14: bairrosAisp14,
    bairrosAisp15: bairrosAisp15,
    quadrantes: quadrantes,
    cidades: cidades
  };
}

// ========================================
// ===== CADASTRO DE VIATURAS ===========
// ========================================

function salvarViatura(dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName('BD_Viaturas');
  
  // Se a aba não existir, cria com cabeçalho
  if (!aba) {
    aba = planilha.insertSheet('BD_Viaturas');
    aba.appendRow([
      'Data', 'Prefixo', 'Quadrante', 'PMS', 'QTR',
      'E.F', 'QRF DIA', 'QRF NOITE', 'REVEZAMENTO', 'Missão',
      'Unidade', 'Tipo'
    ]);
    const headerRange = aba.getRange(1, 1, 1, 12);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a252f');
    headerRange.setFontColor('#ffffff');
  }
  
  // Combinar policiais em uma string
  let pms = [dados.pm1, dados.pm2, dados.pm3, dados.pm4]
    .filter(function(p) { return p && p.trim() !== ''; })
    .join(' / ');
  
  aba.appendRow([
    dados.data,
    dados.prefixo,
    dados.quadrante + (dados.setor ? ' - ' + dados.setor : ''),
    pms,
    dados.qtr,
    dados.ef || '',
    dados.qrfDia || '',
    dados.qrfNoite || '',
    dados.revezamento || '',
    dados.missao || '',
    dados.unidade,
    dados.tipo
  ]);
  
  return "Viatura cadastrada com sucesso!";
}

// Formatar valores de celulas que podem ser Date
function formatarCelula(valor) {
  if (!valor) return '';
  if (valor instanceof Date) {
    // Se tiver ano > 1970, é data real → dd/MM/yyyy
    if (valor.getFullYear() > 1970) {
      return ('0' + valor.getDate()).slice(-2) + '/' + ('0' + (valor.getMonth() + 1)).slice(-2) + '/' + valor.getFullYear();
    }
    // Se for hora (ano 1899/1900 = hora do sheets) → HH:mm
    return ('0' + valor.getHours()).slice(-2) + ':' + ('0' + valor.getMinutes()).slice(-2);
  }
  return valor.toString().trim();
}

function listarViaturas(filtroData) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Viaturas');
  
  if (!aba) {
    return { ordinarias: [], extraordinarias: [] };
  }
  
  const dados = aba.getDataRange().getValues();
  const ordinarias = [];
  const extraordinarias = [];
  
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (!linha[0] && !linha[1]) continue;
    
    let dataFormatada = '';
    let dataOriginal = '';
    if (linha[0]) {
      if (linha[0] instanceof Date) {
        const d = linha[0];
        dataFormatada = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
        dataOriginal = Utilities.formatDate(linha[0], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        dataFormatada = linha[0].toString();
        dataOriginal = linha[0].toString();
      }
    }
    
    if (filtroData && dataOriginal !== filtroData) continue;
    
    // Colunas: Data(0) Prefixo(1) Quadrante(2) PMS(3) QTR(4) E.F(5) QRF_DIA(6) QRF_NOITE(7) REVEZ(8) Missão(9) Unidade(10) Tipo(11)
    const reg = {
      rowIndex: i + 1,
      data: dataFormatada,
      prefixo: formatarCelula(linha[1]),
      quadrante: formatarCelula(linha[2]),
      pms: formatarCelula(linha[3]),
      qtr: formatarCelula(linha[4]),
      ef: formatarCelula(linha[5]),
      qrfDia: formatarCelula(linha[6]),
      qrfNoite: formatarCelula(linha[7]),
      revezamento: formatarCelula(linha[8]),
      missao: formatarCelula(linha[9]),
      unidade: formatarCelula(linha[10]),
      tipo: formatarCelula(linha[11])
    };
    
    if (reg.tipo.toUpperCase().includes('EXTRA')) {
      extraordinarias.push(reg);
    } else {
      ordinarias.push(reg);
    }
  }
  
  return { ordinarias: ordinarias, extraordinarias: extraordinarias };
}

function atualizarViatura(rowIndex, dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Viaturas');
  if (!aba) throw new Error("Aba 'BD_Viaturas' não encontrada.");
  
  let pms = [dados.pm1, dados.pm2, dados.pm3, dados.pm4]
    .filter(function(p) { return p && p.trim() !== ''; })
    .join(' / ');
  
  const valores = [
    dados.data, dados.prefixo,
    dados.quadrante + (dados.setor ? ' - ' + dados.setor : ''),
    pms, dados.qtr, dados.ef,
    dados.qrfDia, dados.qrfNoite,
    dados.revezamento, dados.missao,
    dados.unidade, dados.tipo
  ];
  aba.getRange(rowIndex, 1, 1, 12).setValues([valores]);
  return "Viatura atualizada com sucesso!";
}

function atualizarCampoViatura(rowIndex, colIndex, valor) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Viaturas');
  if (!aba) throw new Error("Aba 'BD_Viaturas' não encontrada.");
  aba.getRange(rowIndex, colIndex).setValue(valor);
  return "Campo atualizado!";
}

function excluirViatura(rowIndex) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Viaturas');
  if (!aba) throw new Error("Aba 'BD_Viaturas' não encontrada.");
  aba.deleteRow(rowIndex);
  return "Viatura excluída com sucesso!";
}

// ========================================
// ===== CONTROLE DE MISSÕES =============
// ========================================

function obterOuCriarAbaMissoes() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName('BD_Missoes');
  if (!aba) {
    aba = planilha.insertSheet('BD_Missoes');
    aba.appendRow([
      'Prefixo', 'Viatura RowIndex', 'Missão', 'Tipo Missão',
      'Data Início', 'Hora Início', 'Hora Fim', 'Status'
    ]);
    const headerRange = aba.getRange(1, 1, 1, 8);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a252f');
    headerRange.setFontColor('#ffffff');
  }
  return aba;
}

function iniciarMissao(viaturaRowIndex, missao, tipoMissao) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  
  // Verificar se viatura existe
  const abaVtr = planilha.getSheetByName('BD_Viaturas');
  if (!abaVtr) throw new Error("Aba 'BD_Viaturas' não encontrada.");
  const linhaVtr = abaVtr.getRange(viaturaRowIndex, 1, 1, 12).getValues()[0];
  const prefixo = formatarCelula(linhaVtr[1]);
  
  // Verificar se já tem missão ativa
  const abaMissoes = obterOuCriarAbaMissoes();
  const dadosMissoes = abaMissoes.getDataRange().getValues();
  for (let i = 1; i < dadosMissoes.length; i++) {
    if (dadosMissoes[i][1] == viaturaRowIndex && dadosMissoes[i][7] === 'ativa') {
      throw new Error("Esta viatura já possui uma missão ativa! Encerre a missão atual antes de iniciar outra.");
    }
  }
  
  // Pegar data/hora atuais
  const agora = new Date();
  const dataInicio = ('0' + agora.getDate()).slice(-2) + '/' + ('0' + (agora.getMonth() + 1)).slice(-2) + '/' + agora.getFullYear();
  const horaInicio = ('0' + agora.getHours()).slice(-2) + ':' + ('0' + agora.getMinutes()).slice(-2);
  
  // Salvar missão
  abaMissoes.appendRow([
    prefixo,
    viaturaRowIndex,
    missao,
    tipoMissao || '',
    dataInicio,
    horaInicio,
    '',
    'ativa'
  ]);
  
  // Atualizar coluna Missão da viatura (coluna 10)
  abaVtr.getRange(viaturaRowIndex, 10).setValue(missao);
  
  return "Missão iniciada com sucesso! Viatura " + prefixo + " em missão: " + missao;
}

function encerrarMissao(missaoRowIndex, horaFim) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaMissoes = planilha.getSheetByName('BD_Missoes');
  if (!abaMissoes) throw new Error("Aba 'BD_Missoes' não encontrada.");
  
  // Obter dados da missão
  const linhaMissao = abaMissoes.getRange(missaoRowIndex, 1, 1, 8).getValues()[0];
  const viaturaRowIndex = linhaMissao[1];
  
  if (linhaMissao[7] !== 'ativa') {
    throw new Error("Esta missão já foi encerrada.");
  }
  
  // Definir hora fim
  let horaFinal = horaFim;
  if (!horaFinal) {
    const agora = new Date();
    horaFinal = ('0' + agora.getHours()).slice(-2) + ':' + ('0' + agora.getMinutes()).slice(-2);
  }
  
  // Atualizar missão: hora fim + status encerrada
  abaMissoes.getRange(missaoRowIndex, 7).setValue(horaFinal);
  abaMissoes.getRange(missaoRowIndex, 8).setValue('encerrada');
  
  // Limpar missão da viatura (coluna 10)
  const abaVtr = planilha.getSheetByName('BD_Viaturas');
  if (abaVtr) {
    // Verificar se o rowIndex ainda é válido
    try {
      abaVtr.getRange(viaturaRowIndex, 10).setValue('');
    } catch(e) {
      // Viatura pode ter sido removida
    }
  }
  
  return "Missão encerrada com sucesso às " + horaFinal + "!";
}

function listarMissoes(filtroData) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaMissoes = planilha.getSheetByName('BD_Missoes');
  const abaVtr = planilha.getSheetByName('BD_Viaturas');
  
  if (!abaMissoes) {
    return { ativas: [], historico: [] };
  }
  
  const dados = abaMissoes.getDataRange().getValues();
  const ativas = [];
  const historico = [];
  
  // Formatar data de filtro para comparação (dd/MM/yyyy)
  let dataFiltro = '';
  if (filtroData) {
    const parts = filtroData.split('-');
    if (parts.length === 3) {
      dataFiltro = parts[2] + '/' + parts[1] + '/' + parts[0];
    }
  }
  
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (!linha[0] && !linha[2]) continue;
    
    const dataInicio = formatarCelula(linha[4]);
    
    // Filtrar por data se fornecida
    if (dataFiltro && dataInicio !== dataFiltro) continue;
    
    var viaturaRowIndex = parseInt(linha[1], 10);
    var unidade = '';
    if (viaturaRowIndex && abaVtr) {
      try {
        var dadosVtr = abaVtr.getRange(viaturaRowIndex, 1, 1, 12).getValues()[0];
        if (dadosVtr && dadosVtr.length >= 11) {
          unidade = formatarCelula(dadosVtr[10]); // Coluna K (11ª)
        }
      } catch(e) {
        console.log('Erro ao buscar unidade: ' + e.message);
      }
    }
    
    const reg = {
      rowIndex: i + 1,
      prefixo: formatarCelula(linha[0]),
      viaturaRowIndex: viaturaRowIndex,
      unidade: unidade,
      missao: formatarCelula(linha[2]),
      tipoMissao: formatarCelula(linha[3]),
      dataInicio: dataInicio,
      horaInicio: formatarCelula(linha[5]),
      horaFim: formatarCelula(linha[6]),
      status: formatarCelula(linha[7])
    };
    
    if (reg.status === 'ativa') {
      ativas.push(reg);
    } else {
      historico.push(reg);
    }
  }
  
  // Histórico mais recente primeiro
  historico.reverse();
  
  return { ativas: ativas, historico: historico };
}

// ========================================
// ===== CADASTRO DE OCORRÊNCIAS/RESENHA ==
// ========================================

function salvarOcorrencia(dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName('BD_Ocorrencias');
  
  if (!aba) {
    aba = planilha.insertSheet('BD_Ocorrencias');
    aba.appendRow([
      'Data', 'Hora', 'Categoria', 'Crime Específico', 'Local', 'Cidade', 
      'Descrição', 'Equipe/Viatura', 'Status', 'RAI', 'Observações',
      'Unidade', 'Flagrante', 'Foragido', 'Armas', 'TCO'
    ]);
    const headerRange = aba.getRange(1, 1, 1, 16);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a252f');
    headerRange.setFontColor('#ffffff');
  }
  
  aba.appendRow([
    dados.data,
    dados.hora,
    dados.categoria || dados.tipo,
    dados.crime || dados.subtipo,
    dados.local,
    dados.cidade,
    dados.descricao,
    dados.equipe,
    dados.status,
    dados.rai,
    dados.observacoes,
    dados.unidade || '',
    dados.flagrante || 'NÃO',
    dados.foragido || 'NÃO',
    dados.armas || 0,
    dados.tco || 'NÃO'
  ]);
  
  return "Ocorrência registrada com sucesso!";
}

function salvarMultiplasOcorrencias(listaOcorrencias) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName('BD_Ocorrencias');
  
  if (!aba) {
    aba = planilha.insertSheet('BD_Ocorrencias');
    aba.appendRow([
      'Data', 'Hora', 'Categoria', 'Crime Específico', 'Local', 'Cidade', 
      'Descrição', 'Equipe/Viatura', 'Status', 'RAI', 'Observações',
      'Unidade', 'Flagrante', 'Foragido', 'Armas', 'TCO'
    ]);
  }
  
  const linhas = listaOcorrencias.map(function(d) {
    return [
      d.data, d.hora, d.categoria || '', d.crime || '', d.local || '', d.cidade || '',
      d.descricao || '', d.equipe || '', d.status || 'Em andamento', d.rai || '', d.observacoes || '',
      d.unidade || '', d.flagrante || 'NÃO', d.foragido || 'NÃO', d.armas || 0, d.tco || 'NÃO'
    ];
  });
  
  if (linhas.length > 0) {
    aba.getRange(aba.getLastRow() + 1, 1, listaOcorrencias.length, 16).setValues(linhas);
  }
  return linhas.length + " ocorrência(s) registrada(s) com sucesso!";
}

function listarOcorrencias(filtroData) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Ocorrencias');
  
  if (!aba) return [];
  
  const dados = aba.getDataRange().getValues();
  const ocorrencias = [];
  
  let dataFiltro = '';
  if (filtroData) {
    const parts = filtroData.split('-');
    if (parts.length === 3) {
      dataFiltro = parts[2] + '/' + parts[1] + '/' + parts[0];
    } else {
      dataFiltro = filtroData;
    }
  }
  
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (!linha[0] && !linha[2]) continue;
    
    let dataFormatada = formatarCelula(linha[0]);
    if (dataFiltro && dataFormatada !== dataFiltro) continue;
    
    ocorrencias.push({
      rowIndex: i + 1,
      data: dataFormatada,
      hora: formatarCelula(linha[1]),
      categoria: formatarCelula(linha[2]),
      crime: formatarCelula(linha[3]),
      local: formatarCelula(linha[4]),
      cidade: formatarCelula(linha[5]),
      descricao: formatarCelula(linha[6]),
      equipe: formatarCelula(linha[7]),
      status: formatarCelula(linha[8]),
      rai: formatarCelula(linha[9]),
      observacoes: formatarCelula(linha[10]),
      unidade: formatarCelula(linha[11] || ''),
      flagrante: formatarCelula(linha[12] || 'NÃO'),
      foragido: formatarCelula(linha[13] || 'NÃO'),
      armas: formatarCelula(linha[14] || 0),
      tco: formatarCelula(linha[15] || 'NÃO')
    });
  }
  
  return ocorrencias.reverse();
}

function atualizarStatusOcorrencia(rowIndex) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Ocorrencias');
  if (!aba) return "Erro: Aba não encontrada.";
  
  const statusAtual = aba.getRange(rowIndex, 9).getValue();
  const novoStatus = (statusAtual === 'Em andamento') ? 'Finalizada' : 'Em andamento';
  
  aba.getRange(rowIndex, 9).setValue(novoStatus);
  return novoStatus;
}

function obterOcorrencia(rowIndex) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Ocorrencias');
  if (!aba) throw new Error("Aba 'BD_Ocorrencias' não encontrada.");
  
  const linha = aba.getRange(rowIndex, 1, 1, 16).getValues()[0];
  return {
    rowIndex: rowIndex,
    data: formatarCelula(linha[0]),
    hora: formatarCelula(linha[1]),
    categoria: formatarCelula(linha[2]),
    crime: formatarCelula(linha[3]),
    local: formatarCelula(linha[4]),
    cidade: formatarCelula(linha[5]),
    descricao: formatarCelula(linha[6]),
    equipe: formatarCelula(linha[7]),
    status: formatarCelula(linha[8]),
    rai: formatarCelula(linha[9]),
    observacoes: formatarCelula(linha[10]),
    unidade: formatarCelula(linha[11] || ''),
    flagrante: formatarCelula(linha[12] || 'NÃO'),
    foragido: formatarCelula(linha[13] || 'NÃO'),
    armas: formatarCelula(linha[14] || 0),
    tco: formatarCelula(linha[15] || 'NÃO')
  };
}

function atualizarOcorrencia(rowIndex, dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Ocorrencias');
  if (!aba) throw new Error("Aba 'BD_Ocorrencias' não encontrada.");
  
  const valores = [
    dados.data, dados.hora, dados.categoria, dados.crime,
    dados.local, dados.cidade, dados.descricao, dados.equipe,
    dados.status, dados.rai, dados.observacoes, dados.unidade,
    dados.flagrante || 'NÃO', dados.foragido || 'NÃO',
    dados.armas || 0, dados.tco || 'NÃO'
  ];
  aba.getRange(rowIndex, 1, 1, 16).setValues([valores]);
  return "Ocorrência atualizada com sucesso!";
}

function excluirOcorrencia(rowIndex) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName('BD_Ocorrencias');
  if (!aba) throw new Error("Aba 'BD_Ocorrencias' não encontrada.");
  aba.deleteRow(rowIndex);
  return "Ocorrência excluída com sucesso!";
}