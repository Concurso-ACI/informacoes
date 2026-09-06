let DATA = { nomeacoesFc: [], nomeacoesPo: [], vacancias: [], semEfeito: [], impacto: null, defesaTecnica: [] };
let CARGO = 'FC'; // 'FC' or 'PO'

async function loadData() {
  const [nomeacoesFc, nomeacoesPo, vacancias, semEfeito, impacto, defesaTecnica] = await Promise.all([
    fetch('data/nomeacoes.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('data/nomeacoes-po.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('data/vacancias.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('data/sem-efeito.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('data/impacto.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('data/defesa-tecnica.json', { cache: 'no-store' }).then(r => r.json()),
  ]);
  DATA = { nomeacoesFc, nomeacoesPo, vacancias, semEfeito, impacto, defesaTecnica };
}

function currentNomeacoes() {
  return CARGO === 'FC' ? DATA.nomeacoesFc : DATA.nomeacoesPo;
}

function cargoLabel() {
  return CARGO === 'FC' ? 'Finanças e Controle' : 'Planejamento e Orçamento';
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

function renderCargoSwitch(containerId, onChange) {
  const el = document.getElementById(containerId);
  el.innerHTML = `
    <button class="cargo-btn ${CARGO === 'FC' ? 'active' : ''}" data-cargo="FC">Finanças e Controle</button>
    <button class="cargo-btn ${CARGO === 'PO' ? 'active' : ''}" data-cargo="PO">Planejamento e Orçamento</button>
  `;
  el.querySelectorAll('.cargo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      CARGO = btn.dataset.cargo;
      document.querySelectorAll('.cargo-switch').forEach(sw => {
        sw.querySelectorAll('.cargo-btn').forEach(b => b.classList.toggle('active', b.dataset.cargo === CARGO));
      });
      onChange();
    });
  });
}

function situacaoBadge(situacao) {
  if (!situacao) return '<span class="badge badge-neutro">—</span>';
  const s = situacao.toUpperCase();
  if (s === 'SIM') return '<span class="badge badge-sim">SIM</span>';
  if (s === 'FIM DE FILA' || s === 'FINAL DE FILA' || s === 'FINAL DE FILA*') return `<span class="badge badge-fimfila">${situacao}</span>`;
  if (['EXONERAÇÃO', 'DESISTÊNCIA', 'DESISTIU DO PROCESSO', 'SUBJUDICE'].includes(s))
    return `<span class="badge badge-negativo">${situacao}</span>`;
  return `<span class="badge badge-neutro">${situacao}</span>`;
}

function jaNomeadoBadge(n) {
  if (!n.foiNomeado) return '<span class="badge badge-neutro">Não</span>';
  const title = n.nomeacaoRef ? ` title="${n.nomeacaoRef}"` : '';
  return `<span class="badge badge-sim"${title}>Sim</span>`;
}

function uniqueValues(arr, key) {
  return [...new Set(arr.map(x => x[key]).filter(v => v !== undefined && v !== null && String(v).trim()))].sort();
}

function fillSelect(select, values, allLabel) {
  select.innerHTML = `<option value="">${allLabel}: todos</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join('');
}

const A_NOMEAR = '__A_NOMEAR__';

function fillSituacaoSelect(select, nomeacoes, allLabel) {
  const values = uniqueValues(nomeacoes, 'situacao');
  select.innerHTML = `<option value="">${allLabel}: todos</option>` +
    `<option value="${A_NOMEAR}">A nomear</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join('');
}

// ---------- Resumo ----------
function renderResumo() {
  const nomeacoes = currentNomeacoes();
  const total = nomeacoes.length;
  const nomeados = nomeacoes.filter(n => n.situacao === 'SIM' || n.situacao === 'SIM**').length;
  const jaNomeados = nomeacoes.filter(n => n.foiNomeado).length;
  const fimDeFila = nomeacoes.filter(n => n.situacao && n.situacao.toUpperCase().includes('FIM DE FILA') || n.situacao && n.situacao.toUpperCase().includes('FINAL DE FILA')).length;
  const aprovadosANomear = nomeacoes.filter(n => !n.situacao || !String(n.situacao).trim()).length;
  const semEfeito = DATA.semEfeito.length;
  const vacancias = DATA.vacancias.length;
  const remanescentes = DATA.impacto.nomeacoesRemanescentes;

  const cards = [
    { label: `Total de candidatos (${cargoLabel()})`, value: total },
    { label: 'Já nomeados (histórico)', value: jaNomeados },
    { label: 'Ativos hoje (SIM)', value: nomeados },
    { label: 'Aprovados a nomear', value: aprovadosANomear },
    { label: 'Fim de fila', value: fimDeFila },
    { label: 'Tornados sem efeito', value: semEfeito },
    { label: 'Vacâncias registradas', value: vacancias },
    { label: 'Nomeações remanescentes (LDO 2026)', value: remanescentes },
  ];
  document.getElementById('resumo-cards').innerHTML = cards.map(c => `
    <div class="card">
      <div class="value">${c.value}</div>
      <div class="label">${c.label}</div>
    </div>`).join('');

  // Situação chart
  const situacaoCounts = {};
  nomeacoes.forEach(n => {
    const key = (n.situacao && String(n.situacao).trim()) || 'Aprovados a nomear';
    situacaoCounts[key] = (situacaoCounts[key] || 0) + 1;
  });
  const maxSit = Math.max(...Object.values(situacaoCounts));
  const situacaoHtml = Object.entries(situacaoCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, val]) => `
      <div class="bar-row">
        <div class="bar-label">${label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(val / maxSit * 100).toFixed(1)}%"></div></div>
        <div class="bar-value">${val}</div>
      </div>`).join('');
  document.getElementById('situacao-chart').innerHTML = situacaoHtml;

  // Vacancias por ano chart
  const anoCounts = {};
  DATA.vacancias.forEach(v => { anoCounts[v.ano] = (anoCounts[v.ano] || 0) + 1; });
  const anos = Object.keys(anoCounts).sort();
  const maxAno = Math.max(...Object.values(anoCounts));
  const anoHtml = anos.map(ano => `
    <div class="bar-row">
      <div class="bar-label">${ano}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(anoCounts[ano] / maxAno * 100).toFixed(1)}%"></div></div>
      <div class="bar-value">${anoCounts[ano]}</div>
    </div>`).join('');
  document.getElementById('vacancias-chart').innerHTML = anoHtml;
}

// ---------- Ordem de Nomeação ----------
function renderNomeacaoFilters() {
  const nomeacoes = currentNomeacoes();
  const el = document.getElementById('nomeacao-filters');
  if (CARGO === 'FC') {
    el.innerHTML = `
      <input type="text" id="f-nome" placeholder="Buscar por nome ou inscrição...">
      <select id="f-tipoVaga"></select>
      <select id="f-situacao"></select>
      <select id="f-jaNomeado"></select>
      <select id="f-cgdfPo"></select>
      <select id="f-tcdfTcu"></select>
      <select id="f-senadoCamara"></select>
      <select id="f-observacao"></select>
      <button id="f-clear">Limpar filtros</button>
      <button id="f-export" class="primary">Exportar CSV</button>
    `;
    fillSelect(document.getElementById('f-tipoVaga'), uniqueValues(nomeacoes, 'tipoVaga'), 'Tipo de vaga');
    fillSituacaoSelect(document.getElementById('f-situacao'), nomeacoes, 'Situação');
    fillSelect(document.getElementById('f-jaNomeado'), ['Sim', 'Não'], 'Já nomeado?');
    fillSelect(document.getElementById('f-cgdfPo'), uniqueValues(nomeacoes, 'cgdfPo'), 'CGDF-PO');
    fillSelect(document.getElementById('f-tcdfTcu'), uniqueValues(nomeacoes, 'tcdfTcu'), 'TCDF/TCU');
    fillSelect(document.getElementById('f-senadoCamara'), uniqueValues(nomeacoes, 'senadoCamara'), 'Senado/Câmara/RFB');
    fillSelect(document.getElementById('f-observacao'), uniqueValues(nomeacoes, 'observacao'), 'Observação');
  } else {
    el.innerHTML = `
      <input type="text" id="f-nome" placeholder="Buscar por nome ou inscrição...">
      <select id="f-tipoVaga"></select>
      <select id="f-situacao"></select>
      <select id="f-jaNomeado"></select>
      <button id="f-clear">Limpar filtros</button>
      <button id="f-export" class="primary">Exportar CSV</button>
    `;
    fillSelect(document.getElementById('f-tipoVaga'), uniqueValues(nomeacoes, 'tipoVaga'), 'Tipo de vaga');
    fillSituacaoSelect(document.getElementById('f-situacao'), nomeacoes, 'Situação');
    fillSelect(document.getElementById('f-jaNomeado'), ['Sim', 'Não'], 'Já nomeado?');
  }

  el.querySelectorAll('select, input').forEach(input => {
    input.addEventListener('input', renderNomeacaoTable);
  });
  document.getElementById('f-clear').addEventListener('click', () => {
    el.querySelectorAll('select').forEach(s => s.value = '');
    el.querySelector('input').value = '';
    renderNomeacaoTable();
  });
  document.getElementById('f-export').addEventListener('click', () => exportCsv(getFilteredNomeacoes(), `ordem-nomeacao-${CARGO.toLowerCase()}.csv`));
}

function getFilteredNomeacoes() {
  const nomeacoes = currentNomeacoes();
  const nome = document.getElementById('f-nome').value.toLowerCase();
  const tipoVaga = document.getElementById('f-tipoVaga').value;
  const situacao = document.getElementById('f-situacao').value;
  const jaNomeado = document.getElementById('f-jaNomeado').value;

  if (CARGO === 'FC') {
    const cgdfPo = document.getElementById('f-cgdfPo').value;
    const tcdfTcu = document.getElementById('f-tcdfTcu').value;
    const senadoCamara = document.getElementById('f-senadoCamara').value;
    const observacao = document.getElementById('f-observacao').value;
    return nomeacoes.filter(n => {
      if (nome && !n.nome.toLowerCase().includes(nome) && !n.inscricao.includes(nome)) return false;
      if (tipoVaga && n.tipoVaga !== tipoVaga) return false;
      if (situacao === A_NOMEAR) { if (n.situacao && String(n.situacao).trim()) return false; }
      else if (situacao && n.situacao !== situacao) return false;
      if (jaNomeado === 'Sim' && !n.foiNomeado) return false;
      if (jaNomeado === 'Não' && n.foiNomeado) return false;
      if (cgdfPo && n.cgdfPo !== cgdfPo) return false;
      if (tcdfTcu && n.tcdfTcu !== tcdfTcu) return false;
      if (senadoCamara && n.senadoCamara !== senadoCamara) return false;
      if (observacao && n.observacao !== observacao) return false;
      return true;
    });
  }
  return nomeacoes.filter(n => {
    if (nome && !n.nome.toLowerCase().includes(nome) && !String(n.inscricao).includes(nome)) return false;
    if (tipoVaga && n.tipoVaga !== tipoVaga) return false;
    if (situacao === A_NOMEAR) { if (n.situacao && String(n.situacao).trim()) return false; }
    else if (situacao && n.situacao !== situacao) return false;
    if (jaNomeado === 'Sim' && !n.foiNomeado) return false;
    if (jaNomeado === 'Não' && n.foiNomeado) return false;
    return true;
  });
}

function renderNomeacaoTable() {
  const filtered = getFilteredNomeacoes();
  document.getElementById('nomeacao-count').textContent =
    `${filtered.length} de ${currentNomeacoes().length} candidatos exibidos (${cargoLabel()})`;

  const tableFc = document.getElementById('nomeacao-table-fc');
  const tablePo = document.getElementById('nomeacao-table-po');

  if (CARGO === 'FC') {
    tableFc.style.display = '';
    tablePo.style.display = 'none';
    const tbody = tableFc.querySelector('tbody');
    tbody.innerHTML = filtered.map((n, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${n.ordem}</td>
        <td>${n.tipoVaga}</td>
        <td>${n.classTipo}</td>
        <td>${n.inscricao}</td>
        <td>${n.nome}</td>
        <td>${n.pontuacao.toFixed(2)}</td>
        <td>${situacaoBadge(n.situacao)}</td>
        <td>${jaNomeadoBadge(n)}</td>
        <td>${n.subjudice || '—'}</td>
        <td>${n.cgdfPo || '—'}</td>
        <td>${n.tcdfTcu || '—'}</td>
        <td>${n.senadoCamara || '—'}</td>
        <td>${n.observacao || '—'}</td>
      </tr>`).join('');
  } else {
    tableFc.style.display = 'none';
    tablePo.style.display = '';
    const tbody = tablePo.querySelector('tbody');
    tbody.innerHTML = filtered.map((n, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${n.ordem ?? '—'}</td>
        <td>${n.tipoVaga || '—'}</td>
        <td>${n.inscricao ?? '—'}</td>
        <td>${n.nome}</td>
        <td>${n.notaAntesCF ?? '—'}</td>
        <td>${n.notaCF ?? '—'}</td>
        <td>${n.notaFinal ?? '—'}</td>
        <td>${situacaoBadge(n.situacao)}</td>
        <td>${jaNomeadoBadge(n)}</td>
        <td>${n.observacao || '—'}</td>
      </tr>`).join('');
  }
}

// ---------- Vacâncias ----------
function renderVacanciasFilters() {
  const el = document.getElementById('vacancias-filters');
  el.innerHTML = `
    <select id="v-ano"></select>
    <select id="v-ato"></select>
    <button id="v-clear">Limpar filtros</button>
    <button id="v-export" class="primary">Exportar CSV</button>
  `;
  fillSelect(document.getElementById('v-ano'), uniqueValues(DATA.vacancias, 'ano').map(String), 'Ano');
  fillSelect(document.getElementById('v-ato'), uniqueValues(DATA.vacancias, 'ato'), 'Tipo de ato');
  el.querySelectorAll('select').forEach(input => input.addEventListener('input', renderVacanciasTable));
  document.getElementById('v-clear').addEventListener('click', () => {
    el.querySelectorAll('select').forEach(s => s.value = '');
    renderVacanciasTable();
  });
  document.getElementById('v-export').addEventListener('click', () => exportCsv(getFilteredVacancias(), 'vacancias.csv'));
}

function getFilteredVacancias() {
  const ano = document.getElementById('v-ano').value;
  const ato = document.getElementById('v-ato').value;
  return DATA.vacancias.filter(v => {
    if (ano && String(v.ano) !== ano) return false;
    if (ato && v.ato !== ato) return false;
    return true;
  });
}

function renderVacanciasTable() {
  const filtered = getFilteredVacancias();
  document.getElementById('vacancias-count').textContent =
    `${filtered.length} de ${DATA.vacancias.length} vacâncias registradas`;
  const tbody = document.querySelector('#vacancias-table tbody');
  tbody.innerHTML = filtered.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${v.ano}</td>
      <td>${v.matricula}</td>
      <td>${v.nome}</td>
      <td>${v.ato}</td>
      <td>${v.publicacao}</td>
    </tr>`).join('');
}

// ---------- Sem Efeito ----------
function renderSemEfeitoFilters() {
  const el = document.getElementById('sem-efeito-filters');
  el.innerHTML = `
    <select id="s-especialidade"></select>
    <select id="s-vaga"></select>
    <button id="s-clear">Limpar filtros</button>
    <button id="s-export" class="primary">Exportar CSV</button>
  `;
  fillSelect(document.getElementById('s-especialidade'), uniqueValues(DATA.semEfeito, 'especialidade'), 'Especialidade');
  fillSelect(document.getElementById('s-vaga'), uniqueValues(DATA.semEfeito, 'vaga'), 'Vaga');
  el.querySelectorAll('select').forEach(input => input.addEventListener('input', renderSemEfeitoTable));
  document.getElementById('s-clear').addEventListener('click', () => {
    el.querySelectorAll('select').forEach(s => s.value = '');
    renderSemEfeitoTable();
  });
  document.getElementById('s-export').addEventListener('click', () => exportCsv(getFilteredSemEfeito(), 'sem-efeito.csv'));
}

function getFilteredSemEfeito() {
  const especialidade = document.getElementById('s-especialidade').value;
  const vaga = document.getElementById('s-vaga').value;
  return DATA.semEfeito.filter(s => {
    if (especialidade && s.especialidade !== especialidade) return false;
    if (vaga && s.vaga !== vaga) return false;
    return true;
  });
}

function renderSemEfeitoTable() {
  const filtered = getFilteredSemEfeito();
  document.getElementById('sem-efeito-count').textContent =
    `${filtered.length} de ${DATA.semEfeito.length} registros exibidos`;
  const tbody = document.querySelector('#sem-efeito-table tbody');
  tbody.innerHTML = filtered.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.especialidade}</td>
      <td>${s.vaga}</td>
      <td>${s.nome}</td>
      <td><a href="${s.link}" target="_blank" rel="noopener">DODF</a></td>
    </tr>`).join('');
}

// ---------- Cálculo de Impacto ----------
function pct(v) { return (v * 100).toFixed(2) + '%'; }
function brl(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function renderImpactoValues(n) {
  const d = DATA.impacto;
  const b = d.base;
  const totalN = d.totalIndividual3Meses * n;
  const novoPercentual = (b.despesaLiquidaPessoal + totalN) / b.rclAjustada;
  const novaFolga = b.limitePrudencial - novoPercentual;
  const impactoPercentual = totalN / b.rclAjustada;

  document.getElementById('impacto-slider-value').textContent = n;
  document.getElementById('impacto-dynamic').innerHTML = `
    <div class="impacto-grid">
      <div class="card"><div class="value">${brl(totalN)}</div><div class="label">Total geral (${n} nomeaç${n === 1 ? 'ão' : 'ões'})</div></div>
      <div class="card"><div class="value">${pct(impactoPercentual)}</div><div class="label">Impacto na despesa total com pessoal</div></div>
      <div class="card"><div class="value">${pct(novoPercentual)}</div><div class="label">Novo % Total da despesa com Pessoal</div></div>
      <div class="card"><div class="value">${pct(novaFolga)}</div><div class="label">Nova "folga" pro limite prudencial</div></div>
    </div>
  `;
}

function renderImpacto() {
  const d = DATA.impacto;
  const b = d.base;

  document.getElementById('impacto-content').innerHTML = `
    <p class="impacto-note"><strong>${d.titulo}</strong> — ${d.descricao}.</p>

    <div class="panel-box slider-box">
      <h3>Simulador de nomeações</h3>
      <p class="impacto-note">Arraste a régua para simular o impacto orçamentário de acordo com a quantidade de nomeações, dentro do limite de ${d.nomeacoesRemanescentes} autorizações da LDO 2026.</p>
      <div class="slider-row">
        <input type="range" id="impacto-slider" min="0" max="${d.nomeacoesRemanescentes}" value="${d.nomeacoesRemanescentes}">
        <span class="slider-value-badge"><span id="impacto-slider-value">${d.nomeacoesRemanescentes}</span> nomeações</span>
      </div>
    </div>

    <h3>Base orçamentária</h3>
    <div class="impacto-grid">
      <div class="card"><div class="value">${brl(b.rclAjustada)}</div><div class="label">RCL Ajustada (I)</div></div>
      <div class="card"><div class="value">${brl(b.despesaLiquidaPessoal)}</div><div class="label">Despesa Líquida de Pessoal (II)</div></div>
      <div class="card"><div class="value">${pct(b.percentualDespesaPessoal)}</div><div class="label">% Total da despesa com Pessoal (II/I)</div></div>
      <div class="card"><div class="value">${pct(b.limiteAlerta)}</div><div class="label">Limite de Alerta</div></div>
      <div class="card"><div class="value">${pct(b.limitePrudencial)}</div><div class="label">Limite Prudencial</div></div>
      <div class="card"><div class="value">${pct(b.limiteMaximo)}</div><div class="label">Limite Máximo</div></div>
      <div class="card"><div class="value">${pct(b.folgaLimitePrudencial)}</div><div class="label">"Folga" pro limite prudencial</div></div>
    </div>

    <h3>Impacto orçamentário das nomeações</h3>
    <p class="impacto-note">${d.criterios}</p>
    <div class="impacto-grid">
      <div class="card"><div class="value">${brl(d.vencimentoGratificacoes)}</div><div class="label">Vencimento + gratificações permanentes</div></div>
      <div class="card"><div class="value">${brl(d.obrigacaoPatronal)}</div><div class="label">Obrigação patronal</div></div>
      <div class="card"><div class="value">${brl(d.decimoTerceiroFerias)}</div><div class="label">13º salário + férias</div></div>
      <div class="card"><div class="value">${brl(d.totalIndividual3Meses)}</div><div class="label">Total individual (3 meses)</div></div>
    </div>

    <div id="impacto-dynamic"></div>

    <p style="color:var(--muted); font-size:0.8rem;">Fonte: ${d.fonte}</p>
  `;

  const slider = document.getElementById('impacto-slider');
  renderImpactoValues(Number(slider.value));
  slider.addEventListener('input', () => renderImpactoValues(Number(slider.value)));
}

// ---------- Defesa Técnica ----------
function renderDefesaTecnica() {
  const cardsHtml = DATA.defesaTecnica.map(d => `
    <div class="panel-box defesa-card">
      <h3>${d.titulo}</h3>
      <p class="defesa-resumo">${d.resumo}</p>
      <a href="${d.link}" target="_blank" rel="noopener">Acessar documento →</a>
    </div>`).join('');

  document.getElementById('defesa-tecnica-content').innerHTML = `
    <p class="impacto-note">Fundamentação jurídica para as nomeações no período eleitoral.</p>
    <div class="defesa-grid">${cardsHtml}</div>
  `;
}

// ---------- CSV export ----------
function exportCsv(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(';')].concat(
    rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(';'))
  ).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function refreshAll() {
  renderResumo();
  renderNomeacaoFilters();
  renderNomeacaoTable();
}

async function init() {
  await loadData();
  setupTabs();
  renderCargoSwitch('resumo-cargo-switch', refreshAll);
  renderCargoSwitch('nomeacao-cargo-switch', refreshAll);
  renderResumo();
  renderNomeacaoFilters();
  renderNomeacaoTable();
  renderVacanciasFilters();
  renderVacanciasTable();
  renderSemEfeitoFilters();
  renderSemEfeitoTable();
  renderImpacto();
  renderDefesaTecnica();
}

init();
