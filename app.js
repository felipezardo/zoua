const CHAVE = 'um-anel-2e-ficha-v2';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ---------- Estrutura da ficha ----------
const ATRIBUTOS = {
  forca:   { nome: 'Força',   derivado: 'Resistência', der: 'res', pericias: ['Fascínio','Atletismo','Vigilância','Caçada','Música','Ofício'], extra: 'prof' },
  coracao: { nome: 'Coração', derivado: 'Esperança',   der: 'esp', pericias: ['Indução','Viagem','Discernimento','Cura','Cortesia','Batalha'], extra: 'rec' },
  astucia: { nome: 'Astúcia', derivado: 'Bloqueio',    der: 'blo', pericias: ['Persuasão','Furtividade','Busca','Exploração','Enigma','História'], extra: 'vir' },
};
const ATR_DE = {}; // perícia -> atributo
for (const id in ATRIBUTOS) ATRIBUTOS[id].pericias.forEach(p => ATR_DE[p] = id);
const ALVOS = [['g0','Arma 1'],['g1','Arma 2'],['g2','Arma 3'],['g3','Arma 4'],['armadura','Armadura'],['elmo','Elmo'],['escudo','Escudo']];
const TIPO_ALVO = (a) => a.startsWith('g') ? 'arma' : a;

// ---------- HTML repetitivo ----------
const pontos = (k) => `<span class="pontos" data-k="${k}">` +
  [1,2,3,4,5,6].map(i => `<button type="button" data-v="${i}" aria-label="Nível ${i}"></button>`).join('') + `</span>`;
const losango = (rotulo, c) => `<label class="losango"><small>${rotulo}</small><span class="d">${c}</span></label>`;
const opts = (lista, vazio) => `<option value="">${vazio || '–'}</option>` + lista.map(([v, t, off]) => `<option value="${v}"${off ? ' disabled' : ''}>${t}</option>`).join('');

function coluna(id, a) {
  const rolar = (nome, atr, kdados) => `<button type="button" class="nome-rolar" data-rolar="${nome}" data-atr="${atr}" data-kd="${kdados}">${nome}</button>`;
  let extra = '';
  if (a.extra === 'prof') extra = `<h3>Proficiências de Combate</h3><ul class="pericias">${PROFS.map(p => `<li><span></span>${rolar(p, 'forca', 'p_' + p)}${pontos('p_' + p)}</li>`).join('')}</ul>`;
  if (a.extra === 'rec') extra = `<h3>Recompensas</h3><div id="slots-rec"></div><details><summary>Ver todas as Recompensas</summary><div id="lista-rec" class="lista"></div></details>
    <div class="inline">${rolar('Valor', 'coracao', 'coracao_valor')}${losango('', `<input type="number" min="1" max="6" data-k="coracao_valor">`)}</div>`;
  if (a.extra === 'vir') extra = `<h3>Virtudes</h3><div id="slots-vir"></div><div id="escolhas-vir"></div><details><summary>Ver todas as Virtudes</summary><div id="lista-vir" class="lista"></div></details>
    <div class="inline">${rolar('Sabedoria', 'astucia', 'astucia_valor')}${losango('', `<input type="number" min="1" max="6" data-k="astucia_valor">`)}</div>`;
  return `<article class="col"><h2>${a.nome}<button type="button" class="btn-info" data-info="${id}" aria-label="O que é ${a.nome}?">i</button></h2>
    <div class="attr">${losango('Nível', `<input type="number" min="0" max="9" data-k="${id}_nivel">`)}${losango('NA', `<output data-na="${id}">–</output>`)}${losango(a.derivado, `<output data-der="${a.der}" title="">–</output>`)}</div>
    ${id === 'coracao' ? '<h3 class="sub">Perícias</h3>' : ''}
    <ul class="pericias">${a.pericias.map(p => `<li><input type="checkbox" data-k="fav_${p}" title="Perícia Favorecida" aria-label="${p}: Favorecida">${rolar(p, id, 'p_' + p)}${pontos('p_' + p)}</li>`).join('')}</ul>
    ${extra}</article>`;
}
$('#colunas').innerHTML = Object.entries(ATRIBUTOS).map(([id, a]) => coluna(id, a)).join('');

$('#guerra').innerHTML = [0,1,2,3].map(i => `<div class="linha g">
  <select data-k="g${i}_sel" aria-label="Arma ${i + 1}"></select>
  <output data-g="${i}_d"></output><output data-g="${i}_f"></output><output data-g="${i}_c"></output>
  <select class="mao" data-k="g${i}_mao" aria-label="Mãos"><option value="1">1 mão</option><option value="2">2 mãos</option></select>
  <input data-k="g${i}_notas" aria-label="Anotações"><button type="button" class="atacar" data-i="${i}" title="Rolar ataque">Atacar</button></div>`).join('');
$('#armadura').innerHTML = [['armadura','Armadura'],['elmo','Elmo'],['escudo','Escudo']].map(([id, n]) => `<div class="linha a">
  <strong>${n}</strong><select data-k="${id}_sel" aria-label="${n}"></select><output data-a="${id}_v"></output><output data-a="${id}_c"></output>
  ${id === 'armadura' ? '<button type="button" id="prot" title="Rolar PROTEÇÃO">Proteção</button>' : '<span></span>'}</div>`).join('');

// ---------- Estado ----------
// Banco de fichas: várias fichas no mesmo navegador. state aponta para a ficha aberta.
const CHAVE_DB = 'um-anel-2e-fichas-v3';
let db = { ativo: null, fichas: {} };
try { const o = JSON.parse(localStorage.getItem(CHAVE_DB) || 'null'); if (o?.fichas) db = { ativo: null, fichas: o.fichas }; } catch {}
if (!Object.keys(db.fichas).length) { // migra a ficha única da versão anterior
  try { const v2 = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (v2 && Object.keys(v2).length) db.fichas['f' + Date.now().toString(36)] = v2; } catch {}
}
let state = {};
const ultimo = {};
const num = (k) => { const n = parseFloat(state[k]); return isNaN(n) ? null : n; };
const nivel = (k) => Math.min(6, Math.max(1, num(k) || 1));
const cult = () => CULTURAS[state.cultura];
let _tAviso;
const avisar = (m) => { // só mostra avisos relevantes (o salvamento é automático e silencioso)
  if (!m || /^Salvo/.test(m)) return;
  let el = $('#aviso'); if (!el) { el = document.createElement('div'); el.id = 'aviso'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = m; el.hidden = false; clearTimeout(_tAviso); _tAviso = setTimeout(() => { el.hidden = true; }, 4500);
};
function salvar() { try { if (db.ativo && db.fichas[db.ativo]) db.fichas[db.ativo] = state; localStorage.setItem(CHAVE_DB, JSON.stringify(db)); avisar('Salvo neste navegador'); } catch { avisar('Não foi possível salvar (espaço cheio?). Use Exportar JSON.'); } }

// ---------- Criação guiada pela Cultura ----------
function renderCriacao() {
  const c = cult();
  $('#cultura').innerHTML = opts(Object.entries(CULTURAS).map(([k, v]) => [k, v.nome]), 'Escolher Cultura');
  $('#padrao').innerHTML = opts(PADROES.map(p => [p, p]));
  const t = (l) => opts((l || []).map(x => [x, x]), 'Escolher');
  $('#trait1').innerHTML = t(c?.tracos); $('#trait2').innerHTML = t(c?.tracos);
  $('#conjunto').innerHTML = opts((c?.conjuntos || []).map((s, i) => [i, `${i + 1}: Força ${s[0]}, Coração ${s[1]}, Astúcia ${s[2]}`]), 'Escolher conjunto');
  $('#prof_a').innerHTML = t(c?.prof);
  $('#prof_b').innerHTML = opts(PROFS.filter(p => p !== state.prof_a).map(p => [p, p]), 'Escolher');
  $('#fav_escolha').innerHTML = t(c?.fav);
  $('#bonus-box').hidden = !c?.bonusAttr;
  $('#bencao-nome').value = c ? c.bencao[0] : '–';
  $('#bencao-desc').innerHTML = c ? `<strong>${c.bencao[0]}.</strong> ${c.bencao[1]}<small>${marca(AUTO_B.includes(state.cultura))}</small>` : 'Escolha uma Cultura Heróica para ver a Bênção Cultural e preencher a ficha.';
  const ch = CHAMADOS[state.chamado];
  const tr = ch ? ch.traco[0] + (ch.inimigos && state.chamado_ini ? ` (${state.chamado_ini})` : '') : '';
  $('#chamado-nome').value = ch ? ch.nome : '–'; $('#trait-chamado').value = tr; $('#caminho-nome').value = ch ? ch.caminho[0] : '–';
  $('#chamado-info').innerHTML = ch ? `<strong>Chamado: ${ch.nome}.</strong> ${ch.resumo} <strong>${tr}.</strong> ${ch.traco[1]} <strong>Caminho das Sombras: ${ch.caminho[0]}.</strong> ${ch.caminho[1]} <em>Favorecidas pelo Chamado: ${(state.chamado_fav || []).join(', ')}.</em>` : '';
  $('#traco-desc').innerHTML = c?.traco ? `<strong>${c.traco[0]}.</strong> ${c.traco[1]}` : '';
}

function aplicarCultura() {
  const c = cult(); if (!c) return;
  for (const p in ATR_DE) { state['p_' + p] = c.pericias[p] || 0; delete state['fav_' + p]; }
  PROFS.forEach(p => state['p_' + p] = 0);
  ['conjunto','bonus_attr','prof_a','prof_b','fav_escolha','trait1','trait2'].forEach(k => delete state[k]);
  state.padrao = c.padrao;
  Object.keys(state).filter(k => /^(r|rt|v)\d$/.test(k)).forEach(k => delete state[k]);
  state.coracao_valor = state.astucia_valor = 1;
  delete state.exp_ant; delete state.exp_ok;
  ['forca','coracao','astucia'].forEach(a => delete state[a + '_nivel']);
  ['dom_attr','_dom','maest1','maest2','_mf','enc1','enc2','enc3','sit_durin','sit_povo','destino_ok','elb_usos','prem_usos'].forEach(k => delete state[k]);
  state._cf = state.chamado_fav || []; reaplicarFavs();
}
function reaplicarFavs() { [...(state._cf || []), ...(state._mf || [])].forEach(p => state['fav_' + p] = true); }
function aplicarConjunto() {
  const c = cult(), i = state.conjunto;
  if (!c || i === undefined || i === '') return;
  ['forca','coracao','astucia'].forEach((a, n) => state[a + '_nivel'] = c.conjuntos[i][n] + (state.bonus_attr === a ? 1 : 0) + (state._dom === a ? 1 : 0));
}
function aplicarProfs() {
  PROFS.forEach(p => state['p_' + p] = 0);
  if (state.prof_a) state['p_' + state.prof_a] = 2;
  if (state.prof_b && state.prof_b !== state.prof_a) state['p_' + state.prof_b] = 1;
  PROFS.forEach(p => { if (state.exp_ant?.[p]) state['p_' + p] = (state['p_' + p] || 0) + state.exp_ant[p]; });
}
function aplicarFav() {
  const c = cult(); if (!c) return;
  c.fav.forEach(p => delete state['fav_' + p]);
  if (state.fav_escolha) state['fav_' + state.fav_escolha] = true;
  reaplicarFavs();
}

// ---------- Escolhas ligadas a Virtudes (Dom, Maestria, Pedaços de Encantamentos) ----------
// Dom reduz apenas o NA do Atributo escolhido (o Nível, e portanto Resistência, Esperança, Bloqueio e Golpe Pesado, não mudam).
const domAdj = (id) => (tem('dom') && state.dom_attr === id ? 1 : 0);
const naDe = (id) => { const n = num(id + '_nivel'); return n === null ? null : 20 - n - domAdj(id); };
function aplicarDom() { state._dom = state.dom_attr || ''; }
const protegida = (p) => state.fav_escolha === p || (state._cf || []).includes(p);
function aplicarMaestria() {
  (state._mf || []).forEach(p => { if (!protegida(p)) delete state['fav_' + p]; });
  state._mf = [state.maest1, state.maest2].filter(Boolean);
  reaplicarFavs();
}
function sincronizarEscolhas() { // desfaz o efeito se a Virtude deixou de estar escolhida
  if (!tem('dom') && state._dom) { state.dom_attr = ''; aplicarDom(); delete state.dom_attr; }
  if (!tem('maestria') && state._mf?.length) { delete state.maest1; delete state.maest2; aplicarMaestria(); }
  if (!tem('encantamentos')) ['enc1', 'enc2', 'enc3'].forEach(k => delete state[k]);
}
function renderEscolhas() {
  const per = Object.keys(ATR_DE).map(p => [p, p]), sel = (k, l, r) => `<label class="campo">${r}<select data-k="${k}">${opts(l, 'Escolher')}</select></label>`;
  let h = '';
  if (tem('destino')) h += '<label class="cond"><input type="checkbox" data-k="destino_ok"> Grande Destino cumprido (salvo de um ferimento mortal): Esperança máxima +1</label>';
  if (tem('dom')) h += sel('dom_attr', Object.entries(ATRIBUTOS).map(([id, a]) => [id, a.nome]), 'Dom: reduzir o NA de');
  if (tem('maestria')) h += sel('maest1', per, 'Maestria: 1ª Perícia Favorecida') + sel('maest2', per, 'Maestria: 2ª Perícia Favorecida');
  if (tem('encantamentos')) { const ok = per.filter(([p]) => (num('p_' + p) || 0) >= 1); h += [1, 2, 3].map(i => sel('enc' + i, ok, 'Encantamentos: Perícia ' + i)).join(''); }
  $('#escolhas-vir').innerHTML = h;
  let s = '';
  if (tem('durin')) s += '<label class="cond"><input type="checkbox" data-k="sit_durin"> Subsolo ou local apertado: Bloqueio +2 (Caminho de Durin)</label>';
  if (tem('povo')) s += '<label class="cond"><input type="checkbox" data-k="sit_povo"> Corpo a corpo contra criatura maior: Bloqueio +2 (Povo Pequeno)</label>';
  $('#situacoes').innerHTML = s ? '<h3>Situação</h3>' + s : '';
}

// ---------- Recompensas e Virtudes ----------
const virtudesDisponiveis = () => VIRTUDES.filter(v => !v.c || v.c === state.cultura);
function renderSlots() {
  const nr = nivel('coracao_valor'), nv = nivel('astucia_valor');
  const escolhidasV = [0,1,2,3,4,5].map(i => state['v' + i]);
  $('#slots-rec').innerHTML = [0,1,2,3,4,5].map(i => {
    const bloq = i >= nr, r = RECOMPENSAS.find(x => x.id === state['r' + i]);
    const alvos = ALVOS.filter(([k]) => !r || r.alvo.includes(TIPO_ALVO(k))).map(([k, l]) => [k, l, !!r && [0,1,2,3,4,5].some(j => j !== i && state['r' + j] === r.id && state['rt' + j] === k)]);
    return `<div class="slot${bloq ? ' trancado' : !state['r' + i] ? ' pendente' : ''}"><select data-k="r${i}" ${bloq ? 'disabled' : ''} aria-label="Recompensa ${i + 1}">${opts(RECOMPENSAS.map(x => [x.id, `${x.nome} (${x.alvo.join(', ')})`]), bloq ? 'Libera com Valor ' + (i + 1) : 'Escolher Recompensa')}</select>
      <select data-k="rt${i}" ${bloq ? 'disabled' : ''} aria-label="Aplicada a">${opts(alvos, 'Aplicar a…')}</select><p class="desc" data-desc="r${i}"></p></div>`;
  }).join('');
  $('#slots-vir').innerHTML = [0,1,2,3,4,5].map(i => {
    const bloq = i >= nv;
    const comuns = VIRTUDES.filter(v => !v.c).map(v => [v.id, v.nome, escolhidasV.some((e, j) => e === v.id && j !== i)]);
    const culturais = virtudesDisponiveis().filter(v => v.c).map(v => [v.id, v.nome, escolhidasV.some((e, j) => e === v.id && j !== i)]);
    const grupo = (n, l) => `<optgroup label="${n}">${l.map(([v, t, off]) => `<option value="${v}"${off ? ' disabled' : ''}>${t}</option>`).join('')}</optgroup>`;
    return `<div class="slot${bloq ? ' trancado' : !state['v' + i] ? ' pendente' : ''}"><select data-k="v${i}" ${bloq ? 'disabled' : ''} aria-label="Virtude ${i + 1}"><option value="">${bloq ? 'Libera com Sabedoria ' + (i + 1) : 'Escolher Virtude'}</option>${grupo('Virtudes comuns', comuns)}${i >= 1 && cult() ? grupo('Virtudes culturais (Sabedoria 2+)', culturais) : ''}</select><p class="desc" data-desc="v${i}"></p></div>`;
  }).join('');
  $('#lista-rec').innerHTML = '<p class="nota">São 6 tipos de Recompensa. Você ganha uma a cada nível de Valor, e cada tipo só pode ser aplicado uma vez ao mesmo equipamento.</p>' + RECOMPENSAS.map(r => `<p><strong>${r.nome}</strong> <em>Desde Valor 1. Vale para: ${r.alvo.join(', ')}.</em> ${r.desc}</p>`).join('');
  $('#lista-vir').innerHTML = VIRTUDES.filter(v => !v.c).map(v => `<p><strong>${v.nome}</strong> <em>Inicial.</em> ${v.desc}</p>`).join('') +
    (cult() ? `<h4>Culturais: ${cult().nome}</h4>` + virtudesDisponiveis().filter(v => v.c).map(v => `<p class="futura"><strong>${v.nome}</strong> <em>A partir de Sabedoria 2.</em> ${v.desc}</p>`).join('') : '<p class="nota">Escolha uma Cultura para ver as Virtudes Culturais.</p>');
}

function bonusVirtudes() {
  const b = { res: 0, esp: 0, blo: 0 }, nv = nivel('astucia_valor');
  for (let i = 0; i < nv; i++) {
    const v = VIRTUDES.find(x => x.id === state['v' + i]);
    if (v?.ef) for (const k in v.ef) b[k] += v.ef[k] === 'sab' ? Math.max(2, nv) : v.ef[k];
    if (v?.id === 'destino' && state.destino_ok) b.esp += 1;
    if (v?.id === 'durin') b.nota = 'Caminho de Durin: +2 no subsolo.';
  }
  return b;
}
const recompensasEm = (alvo) => [0,1,2,3,4,5].filter(i => i < nivel('coracao_valor') && state['rt' + i] === alvo).map(i => state['r' + i]).filter(Boolean);

// ---------- Equipamento ----------
function renderEquip() {
  const c = cult(), proib = c?.proibidos || [], perm = c?.permitidas;
  const ok = (n) => n === 'Desarmado' || (!proib.includes(n) && (!perm || perm.includes(n)));
  const grupos = ['Briga', ...PROFS].map(p => `<optgroup label="${p === 'Briga' ? 'Briga' : p}">${ARMAS.filter(a => a.p === p && ok(a.n)).map(a => `<option value="${a.n}">${a.n}</option>`).join('')}</optgroup>`).join('');
  $$('[data-k$="_sel"]').forEach(s => { if (s.dataset.k.startsWith('g')) s.innerHTML = '<option value="">Escolher arma</option>' + grupos; });
  const rank = (p) => PADROES.indexOf(p), meu = rank(state.padrao);
  const o = (l, n) => `<option value="">${n}</option>` + l.filter(x => !proib.includes(x.n)).map(x => { const off = x.req && meu >= 0 && rank(x.req) > meu; return `<option value="${x.n}"${off ? ' disabled' : ''}>${x.n}${off ? ' (exige ' + x.req + ')' : ''}</option>`; }).join('');
  $('[data-k="armadura_sel"]').innerHTML = o(ARMADURAS, 'Sem armadura');
  $('[data-k="elmo_sel"]').innerHTML = o(ELMOS, 'Sem elmo');
  $('[data-k="escudo_sel"]').innerHTML = o(ESCUDOS, 'Sem escudo');
}
const metade = (n) => Math.ceil(n / 2);
function itemDefesa(id, lista) {
  const it = lista.find(x => x.n === state[id + '_sel']); if (!it) return null;
  let c = it.c; const rs = recompensasEm(id);
  if (cult() === CULTURAS.anoes && id !== 'escudo') c = metade(c); // Formidável primeiro
  if (rs.includes('fabricacao')) c = Math.max(0, c - 2);          // depois Fabricação Habilidosa (−2)
  return { ...it, c, cb: it.c, p: it.p, b: it.b ? it.b + (rs.includes('reforcado') ? 1 : 0) : 0, aj: rs.includes('ajustado') ? 2 : 0 };
}
function armaAtual(i) {
  const a = ARMAS.find(x => x.n === state['g' + i + '_sel']); if (!a) return null;
  const rs = recompensasEm('g' + i);
  const mao = a.m === 12 ? (state['g' + i + '_mao'] === '2' ? 2 : 1) : a.m; // empunhadura em uso
  const base = mao === 2 ? a.f2 : a.f1;
  return { ...a, mao, duas: mao === 2, d: a.d + (rs.includes('atroz') ? 1 : 0), f: base == null ? '–' : String(base + (rs.includes('cruel') ? 2 : 0)), afiada: rs.includes('afiada') };
}

// Virtudes e Bênçãos que a ficha aplica sozinha (números da ficha ou rolagens). As demais são só informativas.
const AUTO_V = ['confianca','destreza','resiliencia','duro','indomavel','elbereth','ponei','bri_res','patr_res','maos','dom','maestria','durin','povo','baruk','fumo','escuro','passaros','coragem','coragemdes','matador','alvo','disparo','luzir','ermos','encantamentos','invisivel','estranho','destino','elbereth','desaparecer','premonicao'];
const AUTO_B = ['anoes','bardeses','elfos','hobbits','patrulheiros'];
const marca = (auto) => auto ? ' [automático]' : ' [aplique à mão]';

// ---------- Cálculos ----------
function auto(k, v, inicial) {
  if (inicial) { ultimo[k] = v; return; }
  if (ultimo[k] === v) return;
  ultimo[k] = v; state[k] = v; $(`[data-k="${k}"]`).checked = v;
}
function calcular(inicial) {
  renderChecklist();
  const c = cult(), b = bonusVirtudes();
  for (const id in ATRIBUTOS) { const n = num(id + '_nivel'); $(`[data-na="${id}"]`).value = n === null ? '–' : naDe(id); }
  const arm = itemDefesa('armadura', ARMADURAS), elm = itemDefesa('elmo', ELMOS), esc = itemDefesa('escudo', ESCUDOS);
  const set = (sel, t) => { const e = $(sel); if (e) e.value = t; };
  set('[data-a="armadura_v"]', arm ? `${arm.p}d` : '–'); const fc = (i) => !i ? '–' : i.c !== i.cb ? `${i.c} (base ${i.cb})` : i.c;
  set('[data-a="armadura_c"]', fc(arm));
  set('[data-a="elmo_v"]', elm ? `+${elm.p}d` : '–'); set('[data-a="elmo_c"]', fc(elm));
  set('[data-a="escudo_v"]', esc ? `+${esc.b}` : '–'); set('[data-a="escudo_c"]', fc(esc));
  $('#nota-carga').textContent = c === CULTURAS.anoes ? 'Formidável: a Carga de armadura e elmo é reduzida à metade (arredondada para cima). Escudo não. O valor original aparece entre parênteses.' : '';
  let carga = (arm?.c || 0) + (elm?.c || 0) + (esc?.c || 0);
  for (let i = 0; i < 4; i++) {
    const a = armaAtual(i);
    const sm = $(`[data-k="g${i}_mao"]`); sm.disabled = !a || a.m !== 12; if (a && a.m !== 12) sm.value = String(a.m);
    set(`[data-g="${i}_d"]`, a ? a.d : '–'); set(`[data-g="${i}_f"]`, a ? a.f : '–'); set(`[data-g="${i}_c"]`, a ? a.c : '–');
    carga += a?.c || 0;
  }
  $('#carga').value = carga;
  const A = (id) => num(id + '_nivel');
  const sit = (tem('durin') && state.sit_durin ? 2 : 0) + (tem('povo') && state.sit_povo ? 2 : 0);
  const der = (el, base, atr, extra, dica) => { const e = $(`[data-der="${el}"]`); const n = A(atr); e.value = c && n !== null ? n + base + extra : '–'; e.title = c ? dica : ''; };
  if (c) {
    der('res', c.base.res, 'forca', b.res, `Força + ${c.base.res} (Cultura) + ${b.res} (Virtudes)`);
    der('esp', c.base.esp, 'coracao', b.esp, `Coração + ${c.base.esp} (Cultura) + ${b.esp} (Virtudes)`);
    der('blo', c.base.blo, 'astucia', b.blo + (esc?.b || 0) + sit, `Astúcia + ${c.base.blo} (Cultura) + ${b.blo} (Virtudes) + ${esc?.b || 0} (Escudo) + ${sit} (Situação)`);
  } else $$('[data-der]').forEach(e => e.value = '–');
  for (const k of ['res', 'esp']) {
    const m = parseFloat($(`[data-der="${k}"]`).value);
    if (isNaN(m)) continue;
    const cur = num(k + '_atual');
    if (cur === null || cur === state['_max_' + k]) { state[k + '_atual'] = m; $(`[data-k="${k}_atual"]`).value = m; }
    state['_max_' + k] = m;
  }
  // Resistência e Esperança atuais começam no máximo e acompanham o máximo enquanto você não as alterar
  const seguir = (k, max) => {
    if (max === null) return;
    const cur = state[k + '_atual'], prev = state['_max_' + k];
    if (cur === undefined || (cur !== '' && +cur === prev)) state[k + '_atual'] = String(max);
    state['_max_' + k] = max; $(`[data-k="${k}_atual"]`).value = state[k + '_atual'] ?? '';
  };
  if (c) {
    const F = num('forca_nivel'), C = num('coracao_nivel');
    seguir('res', F === null ? null : F + c.base.res + b.res);
    seguir('esp', C === null ? null : C + c.base.esp + b.esp);
  }
  const res = num('res_atual'), fad = num('fadiga') || 0, esp = num('esp_atual'), som = num('sombra');
  auto('exausto', res !== null && res <= carga + fad, inicial);
  auto('arrasado', esp !== null && som !== null && som >= esp, inicial);
  const bv = parseInt($('[data-der="blo"]').value), sb = $('#blo-saraivada');
  if (sb) sb.textContent = isNaN(bv) ? '–' : esc ? `${bv + esc.b} (o escudo dobra: +${esc.b} além dos ${bv})` : `${bv} (sem escudo)`;
  $$('[data-desc]').forEach(p => {
    const k = p.dataset.desc, lista = k[0] === 'r' ? RECOMPENSAS : VIRTUDES, it = lista.find(x => x.id === state[k]);
    p.textContent = it ? it.desc + (k[0] === 'v' ? marca(AUTO_V.includes(it.id)) : '') : '';
  });
}

function renderNotaveis() {
  const nomes = [state.trait1, state.trait2].filter(Boolean);
  $('#notaveis-desc').innerHTML = nomes.length ? '<strong>Características Notáveis:</strong> ' + nomes.map(n => `<em>${n}.</em> ${NOTAVEIS[n] || ''}`).join(' ') + ' <small>(Invoque uma delas numa jogada de Perícia para ficar Inspirado.)</small>' : '';
}
function aplicar(inicial) {
  renderCombate();
  renderCriacao(); renderNotaveis(); renderSlots(); renderEscolhas(); renderEquip();
  $$('[data-k]').forEach(el => {
    const v = state[el.dataset.k];
    if (el.classList.contains('pontos')) el.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v <= (+v || 0)));
    else if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v ?? '';
  });
  calcular(inicial);
}

// ---------- Eventos ----------
const REFAZ = /^(cultura|trait1|trait2|conjunto|bonus_attr|prof_a|prof_b|fav_escolha|padrao|coracao_valor|astucia_valor|dom_attr|maest1|maest2|enc1|enc2|enc3|sit_durin|sit_povo|r\d|rt\d|v\d|(g\d|armadura|elmo|escudo)_sel)$/;
document.addEventListener('input', (e) => {
  const k = e.target.dataset?.k; if (!k) return;
  state[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (k === 'cultura') aplicarCultura();
  if (k === 'conjunto' || k === 'bonus_attr') aplicarConjunto();
  if (k === 'prof_a' || k === 'prof_b') aplicarProfs();
  if (k === 'fav_escolha') aplicarFav();
  if (k === 'dom_attr') aplicarDom();
  if (k === 'maest1' || k === 'maest2') aplicarMaestria();
  if (/^v\d$/.test(k) || k === 'astucia_valor') sincronizarEscolhas();
  if (REFAZ.test(k)) aplicar(); else calcular();
  salvar();
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('.pontos button');
  if (b) { const k = b.parentElement.dataset.k, v = +b.dataset.v; state[k] = (+state[k] || 0) === v ? v - 1 : v; aplicar(true); salvar(); return; }
  const r = e.target.closest('[data-rolar]');
  if (r) preparar(r.dataset.rolar, r.dataset.atr, r.dataset.kd.endsWith('_valor') ? nivel(r.dataset.kd) : num(r.dataset.kd) || 0);
});
$('#sortear').onclick = () => { if (!cult()) return avisar('Escolha uma Cultura primeiro.'); state.conjunto = String(Math.floor(Math.random() * 6)); aplicarConjunto(); aplicar(); salvar(); };


// ---------- Explicações dos Atributos e Perícias ----------
function abrirInfo(id) {
  const d = INFO[id]; if (!d) return;
  $('#info-t').textContent = d.titulo;
  $('#info-corpo').innerHTML = `<p>${d.texto}</p><p><strong>${d.deriva}</strong></p><h3>Perícias de ${d.titulo}</h3><dl>${d.pericias.map(([n, t, x]) => `<dt>${n}</dt><dd>${t} <em>(ex.: ${x})</em></dd>`).join('')}</dl>`;
  $('#dlg-info').showModal(); $('#dlg-info').scrollTop = 0;
}
document.addEventListener('click', (e) => { const b = e.target.closest('.btn-info'); if (b) abrirInfo(b.dataset.info); });
$('#info-fechar').onclick = () => $('#dlg-info').close();
$('#dlg-info').addEventListener('click', (e) => { if (e.target.id === 'dlg-info') e.target.close(); });

// ---------- Saraivadas de Abertura ----------
const armaSaraivada = (a) => !!a && (a.p === 'Arcos' || a.n === 'Lança' || a.n === 'Lança Curta');
function renderSaraivada() {
  const armas = [0, 1, 2, 3].map(i => [i, armaAtual(i)]).filter(([, a]) => armaSaraivada(a));
  const btn = (n, atr) => `<button type="button" class="nome-rolar" data-rolar="${n}" data-atr="${atr}" data-kd="p_${n}">${n}</button>`;
  $('#saraivada').innerHTML = `<h4>Saraivadas de Abertura</h4>
    <p>Primeiro passo do combate, antes das rodadas: se os lados começam separados por uma distância, o Historiador decide quantas saraivadas permitir.</p>
    <ul class="lista">
      <li>Normalmente cada combatente tem direito a ao menos 1 saraivada, com arco ou arma de arremesso (lança ou lança curta). Com grande distância, 2 ou mais, só com arco.</li>
      <li>São ataques à distância normais, sem postura. Os Heróis atiram primeiro, salvo se as circunstâncias favorecerem os adversários.</li>
      <li>Escudo: se você sabe do ataque que se aproxima, o modificador de Bloqueio dele é dobrado.</li>
      <li>Emboscada: quem falhar em ${btn('Vigilância', 'forca')} não faz saraivada nem age na 1ª rodada. Ao emboscar, todos testam ${btn('Furtividade', 'astucia')}.</li>
      <li>Depois das saraivadas, só quem está na Retaguarda segue atacando à distância.</li>
    </ul>
    <p><strong>Suas armas de saraivada:</strong> ${armas.length ? armas.map(([i, a]) => `${a.n} <button type="button" class="atacar-sar" data-i="${i}">Atirar</button>`).join(' &nbsp; ') : '<em>nenhuma arma de arco ou arremesso equipada.</em>'}</p>
    <p><strong>Seu Bloqueio contra saraivada:</strong> <output id="blo-saraivada">–</output></p>`;
}

// ---------- Posturas e Tarefas de Combate ----------
function renderCombate() {
  $('#postura').innerHTML = opts(POSTURAS.map(p => [p.id, `${p.nome} (${p.tipo})`]), 'Nenhuma');
  $('#postura').value = state.postura || '';
  $('#posturas').innerHTML = POSTURAS.map(p => `<article class="postura${state.postura === p.id ? ' atual' : ''}">
    <h4>${p.nome} <small>${p.tipo}</small></h4><p>${p.efeito}</p>
    <p><button type="button" class="nome-rolar" data-rolar="${p.tarefa.per}" data-atr="${p.tarefa.atr}" data-kd="p_${p.tarefa.per}">${p.tarefa.nome}</button> (${p.tarefa.per.toUpperCase()}, ação principal). ${p.tarefa.texto}</p></article>`).join('');
  $('#combate-regras').innerHTML = REGRAS_COMBATE.map(t => `<li>${t}</li>`).join('');
  renderSaraivada();
}

// ---------- Rolagem de dados ----------
const tem = (id) => { for (let i = 0; i < nivel('astucia_valor'); i++) if (state['v' + i] === id) return true; return false; };
let rolCtx = { tipo: 'pericia' };
// Reúne o que Bênçãos, Virtudes e Recompensas fazem nesta rolagem (fav/insp automáticos, opções de contexto, bônus).
function efeitos(tipo, nome, arma) {
  const e = { fav: [], insp: [], ctx: [], notas: [], bonus: 0 }, c = cult();
  const sab = nivel('astucia_valor'), elbUsos = state.elb_usos || 0;
  if (tem('invisivel')) e.ctx.push({ ef: 'dado', rot: 'Jogada forçada por espírito maligno ou fantasma: +1d (Contra o Invisível)' });
  if (tem('estranho') && ['Discernimento', 'Enigma'].includes(nome)) e.ctx.push({ ef: 'dado', rot: 'Na Terra de Bree: +1d (Estranho como Notícias de Bri)' });
  if (tem('elbereth') && elbUsos < sab) e.ctx.push({ ef: 'insp', elb: 1, rot: `Ficar Inspirado (Elbereth Gilthoniel!): restam ${sab - elbUsos} de ${sab} nesta Fase de Aventura` });
  if (tem('desaparecer') && nome === 'Furtividade') e.notas.push('Arte de Desaparecer: com sucesso, você simplesmente desaparece.');
  if (tem('coragem') && (state.arrasado || state.exausto || state.ferido)) e.insp.push('Coragem no Aperto');
  if (tem('escuro')) e.ctx.push({ ef: 'insp', rot: 'No escuro (noite ou subsolo): Inspirado (Escuro para Negócios Obscuros)' });
  if (tem('passaros')) e.ctx.push({ ef: 'insp', rot: 'Ao ar livre, 1 vez por Combate, Conselho ou Viagem: Inspirado (Língua dos Pássaros)' });
  if (tem('coragemdes')) e.ctx.push({ ef: 'insp', sombra: 1, rot: 'Ganhar 1 de Sombra para ficar Inspirado (Coragem Desesperada; exige gastar Esperança)' });
  if (tipo === 'pericia') {
    const lv = num('p_' + nome) || 0, m = [];
    if (c === CULTURAS.elfos && !state.arrasado && lv >= 1) m.push('Perícia Élfica');
    if (tem('ermos') && ['Exploração', 'Caçada', 'Viagem'].includes(nome)) m.push('Vida nos Ermos');
    if (tem('encantamentos') && lv >= 1 && [state.enc1, state.enc2, state.enc3].includes(nome)) m.push('Pedaços de Encantamentos');
    if (m.length) e.ctx.push({ ef: 'magico', rot: 'Sucesso Mágico, gasta 1 Esperança: ' + m.join(' / ') });
  }
  if (tipo === 'ataque') {
    if (tem('baruk')) e.ctx.push({ ef: 'fav', rot: 'Uma vez por combate, em posição de Vanguarda: ataque Favorecido (Baruk Khazâd!)' });
    if (tem('matador')) e.ctx.push({ ef: 'fav', rot: 'Alvo com Poder 2 ou mais: ataque Favorecido (Matador de Dragões)' });
    if (tem('alvo') && arma.p === 'Arcos') e.fav.push('No Alvo');
    if (tem('disparo') && arma.p === 'Arcos') e.notas.push('Disparo Feroz: num Golpe Perfurante à distância, a PROTEÇÃO do alvo é Desfavorecida.');
    if (tem('luzir')) e.notas.push('Luzir de Ira: ao acertar, o adversário perde 1 de Ódio/Determinação, mais 1 por ícone de Sucesso.');
  }
  if (tipo === 'protecao') {
    if (tem('duro') && !state.arrasado) e.fav.push('Duro como Pedra');
    e.notas.push('NA = valor de Ferimento da arma do atacante.');
    e.bonus = ['armadura', 'elmo'].some(i => recompensasEm(i).includes('ajustado')) ? 2 : 0;
    if (e.bonus) e.notas.push('Ajustado: +' + e.bonus + ' no resultado.');
  }
  return e;
}
function preparar(nome, atr, dados, chave, tipo = 'pericia', arma = null) {
  const c = cult(), n = num(atr + '_nivel');
  let fav = !!state['fav_' + nome];
  if ((nome === 'Valor' && c?.favValor) || (nome === 'Sabedoria' && c?.favSab)) fav = true;
  const ef = efeitos(tipo, nome, arma); rolCtx = { tipo, nome, arma };
  if (ef.fav.length) fav = true;
  const proibida = nome === 'Sabedoria' ? 'astucia' : nome === 'Valor' ? 'coracao' : atr;
  $('#r-alvo').textContent = nome + (fav ? ' (Favorecida)' : '');
  $('#r-dados').value = dados; $('#r-na').value = naDe(proibida) ?? '';
  const sombraAlta = state._max_esp != null && (num('sombra') || 0) >= state._max_esp;
  if (sombraAlta) ef.notas.push('Sombra igual à Esperança máxima: todas as jogadas ficam Desfavorecidas.');
  $('#r-modo').value = fav ? (sombraAlta ? 'n' : 'f') : (sombraAlta ? 'd' : 'n'); $('#r-mod').value = 0; $('#r-extra').value = 0;
  $('#r-insp').checked = ef.insp.length > 0; $('#r-esp').checked = false; $('#r-bonus').value = ef.bonus;
  $('#r-notas').innerHTML = [...ef.fav.map(x => x + ': Favorecida.'), ...ef.insp.map(x => x + ': Inspirado.'), ...ef.notas].join('<br>');
  $('#r-ctx').innerHTML = ef.ctx.map(c => `<label class="cond"><input type="checkbox" data-ef="${c.ef}" data-sombra="${c.sombra || 0}" data-elb="${c.elb || 0}"> ${c.rot}</label>`).join('');
  $('#r-res').textContent = ''; rolCtx.ult = null; atualizarPrem(); abrirPainel(true);
}
document.addEventListener('click', (e) => {
  const at = e.target.closest('.atacar, .atacar-sar');
  if (at?.classList.contains('atacar-sar')) { // saraivada de abertura: ataque à distância normal, sem postura
    const a = armaAtual(+at.dataset.i); if (!a) return;
    preparar('Saraivada: ' + a.n, 'forca', num('p_' + a.p) || 0, '', 'ataque', a);
    $('#r-extra').value = 0; $('#r-notas').innerHTML += (($('#r-notas').innerHTML) ? '<br>' : '') + 'Saraivada de abertura: ataque à distância normal (sem postura).';
  } else if (at) { const a = armaAtual(+at.dataset.i); if (!a) return avisar('Escolha uma arma.'); const prof = a.p === 'Briga' ? Math.max(...PROFS.map(p => num('p_' + p) || 0)) : num('p_' + a.p) || 0;
    preparar('Ataque: ' + a.n, 'forca', prof, '', 'ataque', a);
    const pst = POSTURAS.find(x => x.id === state.postura), ex = (a.p === 'Briga' ? -1 : 0) + (pst ? pst.mod : 0);
    $('#r-extra').value = ex;
    const nt = [];
    if (a.p === 'Briga') nt.push('Briga: perde (1d).');
    if (pst && pst.mod) nt.push(`Postura ${pst.nome}: ${pst.mod > 0 ? 'ganha' : 'perde'} (1d)${pst.mod < 0 ? ' (para cada oponente que o enfrentar; ajuste em Dados extras)' : ''}.`);
    if (pst?.id === 'retag' && a.p !== 'Arcos') nt.push('Na Retaguarda só se ataca com armas à distância.');
    if (pst && pst.tipo === 'corpo a corpo' && a.p === 'Arcos') nt.push('Postura corpo a corpo: confira se pode atacar à distância.');
    if (nt.length) $('#r-notas').innerHTML += (($('#r-notas').innerHTML) ? '<br>' : '') + nt.join('<br>'); }
  if (e.target.id === 'prot') { const a = itemDefesa('armadura', ARMADURAS), h = itemDefesa('elmo', ELMOS);
    preparar('Proteção', 'forca', (a?.p || 0) + (h?.p || 0), '', 'protecao'); $('#r-na').value = ''; $('#r-na').focus(); }
});

let refazer = false;
function atualizarPrem() {
  const b = $('#r-prem'); b.hidden = !tem('premonicao');
  b.textContent = `Premonição: refazer a jogada (restam ${Math.max(0, nivel('astucia_valor') - (state.prem_usos || 0))})`;
}
$('#r-prem').onclick = () => {
  if (!rolCtx.ult) return ($('#r-res').textContent = 'Faça uma rolagem antes de usar a Premonição.');
  if ((state.prem_usos || 0) >= nivel('astucia_valor')) return ($('#r-res').textContent = 'Premonição esgotada nesta Fase de Aventura.');
  state.prem_usos = (state.prem_usos || 0) + 1; refazer = true; $('#r-rolar').click(); atualizarPrem();
};
const d = (n) => 1 + Math.floor(Math.random() * n);
$('#r-rolar').onclick = () => {
  const na = parseFloat($('#r-na').value) + (parseFloat($('#r-mod').value) || 0);
  if (isNaN(na)) return ($('#r-res').textContent = 'Defina o NA (preencha o Nível do Atributo ou digite o NA).');
  const re = refazer; refazer = false; // Premonição: repete os mesmos dados
  const ctx = $$('#r-ctx input:checked'), tem_ef = (x) => ctx.some(i => i.dataset.ef === x);
  let modo = $('#r-modo').value;
  if (tem_ef('fav')) modo = modo === 'd' ? 'n' : 'f';
  const magico = !re && tem_ef('magico');
  let insp = $('#r-insp').checked || tem_ef('insp');
  let n = (parseInt($('#r-dados').value) || 0) + (parseInt($('#r-extra').value) || 0);
  const gastou = !re && ($('#r-esp').checked || magico);
  if (!gastou) insp = $('#r-insp').checked || ctx.some(i => i.dataset.ef === 'insp' && !+i.dataset.sombra);
  if (gastou) {
    if (num('esp_atual') === null) return ($('#r-res').textContent = 'Preencha a Esperança atual na ficha (ou escolha a Cultura e os Atributos).');
    if (num('esp_atual') <= 0) return ($('#r-res').textContent = 'Sua Esperança atual é 0.');
    state.esp_atual = String(num('esp_atual') - 1);
    ctx.forEach(i => { if (+i.dataset.sombra) state.sombra = String((num('sombra') || 0) + 1); });
    if (!magico) n += insp ? 2 : 1;
  }
  if (tem_ef('dado')) n += 1;
  n = Math.max(0, n);
  if (re && rolCtx.ult) { n = rolCtx.ult.n; modo = rolCtx.ult.modo; }
  rolCtx.ult = { n, modo };
  if (!re && ctx.some(i => +i.dataset.elb)) state.elb_usos = (state.elb_usos || 0) + 1;
  const peso = (v) => v === 12 ? -1 : v; // 12 = Olho (pior), 11 = Runa (melhor)
  let f = [d(12)]; if (modo !== 'n') f.push(d(12));
  const fac = modo === 'f' ? f.reduce((a, b) => peso(b) > peso(a) ? b : a) : modo === 'd' ? f.reduce((a, b) => peso(b) < peso(a) ? b : a) : f[0];
  const exausto = !!state.exausto, arrasado = !!state.arrasado;
  const suc = Array.from({ length: n }, () => d(6));
  const soma = suc.reduce((s, v) => s + (exausto && v <= 3 ? 0 : v), 0);
  const runa = fac === 11, olho = fac === 12, icones = suc.filter(v => v === 6).length;
  const total = (olho ? 0 : fac) + soma + (parseInt($('#r-bonus').value) || 0);
  const ok = runa || magico || (!(arrasado && olho) && total >= na);
  const grau = magico ? 'Sucesso Mágico' : !ok ? 'Falha' : icones >= 2 ? 'Sucesso extraordinário' : icones === 1 ? 'Grande sucesso' : 'Sucesso';
  const fmt = (v) => v === 11 ? 'Runa' : v === 12 ? 'Olho' : v;
  const txt = `${$('#r-alvo').textContent}: ${grau}. Façanha ${f.map(fmt).join('/')}${modo !== 'n' ? ' (' + fmt(fac) + ')' : ''} + Sucesso [${suc.map(v => v === 6 ? '6✦' : v).join(', ')}] = ${runa ? 'automático' : total} contra NA ${na}${exausto ? ' | Exausto' : ''}${arrasado ? ' | Arrasado' : ''}`;
  $('#r-res').innerHTML = `<strong class="${ok ? 'ok' : 'falha'}">${grau}</strong>${insp && !gastou ? '<br><em>Inspirado só tem efeito ao gastar Esperança.</em>' : ''}<br>${txt.split(': ').slice(1).join(': ').replace(/^[^.]+\. /, '')}`;
  let extra = '';
  if (rolCtx.tipo === 'ataque' && ok && rolCtx.arma) {
    const a = rolCtx.arma, mi = tem('maos'), pesado = (num('forca_nivel') || 0) + (mi ? 1 : 0) + (a.duas ? 1 : 0);
    const maos = a.duas ? ' (já inclui +1 por usar duas mãos)' : a.m === 12 ? ' (+1 se empunhar com duas mãos)' : '';
    const perf = !olho && a.n !== 'Desarmado' && (runa || fac >= (a.afiada ? 9 : 10));
    extra = `<br>Perda de Resistência do alvo: <strong>${a.d}</strong>. Cada ícone ✦ pode ser um Golpe Pesado: +${pesado}${maos}.` +
      ` <em>Outras opções por ícone:${a.p !== 'Arcos' ? ` Defender (Bloqueio +${a.p === 'Lanças' ? 3 : a.p === 'Espadas' ? 2 : 1} na rodada);` : ''}${itemDefesa('escudo', ESCUDOS) ? ' Pancada de Escudo (se sua FORÇA superar o Nível de Atributo do alvo, ele perde 1d na rodada);' : ''}</em>` +
      (mi ? ' Mãos Inclementes: já somei +1 ao Golpe Pesado; ao usar Perfurar, some +1 ao resultado do Dado de Façanha.' : '') +
      (!perf && icones >= 1 && !olho && a.n !== 'Desarmado' && (['Arcos', 'Lanças', 'Espadas'].includes(a.p) || a.n === 'Adaga') ? ' <em>Opção: gaste 1 ícone em Perfurar para elevar o resultado do Dado de Façanha (até 10) e causar Golpe Perfurante.</em>' : '') +
      (perf ? ` <strong class="falha">Golpe Perfurante!</strong> O alvo joga PROTEÇÃO contra Ferimento ${a.f}.` : '');
  }
  $('#r-res').innerHTML += extra;
  $('#r-esp').checked = false;
  const li = document.createElement('li'); li.textContent = txt; $('#r-log').prepend(li); while ($('#r-log').children.length > 6) $('#r-log').lastChild.remove();
  aplicar(); salvar();
};


// ---------- Painel de rolagem: minimizar e fechar ----------
function abrirPainel(expandido) {
  const p = $('#rolagem'); p.classList.remove('oculta'); p.classList.toggle('aberta', expandido);
  $('#r-min').textContent = expandido ? '–' : '+';
}
$('#r-min').onclick = () => abrirPainel(!$('#rolagem').classList.contains('aberta'));
$('#r-fechar').onclick = () => $('#rolagem').classList.add('oculta');

// ---------- Lista de progresso da criação ----------
function renderChecklist() {
  const c = cult(), g = [0,1,2,3].map(i => state['g' + i + '_sel']).filter(Boolean);
  const profsOk = PROFS.filter(p => (num('p_' + p) || 0) > 0).every(p => g.some(n => ARMAS.find(a => a.n === n)?.p === p)) && g.length > 0;
  const rest = state.exp_ok ? EXP_TOTAL - gastoSalvo() : null;
  const itens = [
    ['Nome', !!state.nome], ['Cultura Heróica', !!c],
    ['Conjunto de Atributos' + (c?.bonusAttr ? ' e +1 em um Atributo' : ''), state.conjunto !== undefined && state.conjunto !== '' && (!c?.bonusAttr || !!state.bonus_attr)],
    ['Perícia Favorecida da Cultura', !!state.fav_escolha], ['Proficiências de Combate', !!state.prof_a && !!state.prof_b],
    ['Duas Características Notáveis', !!state.trait1 && !!state.trait2 && state.trait1 !== state.trait2],
    ['Chamado e suas Perícias Favorecidas', !!state.chamado && (state.cham_fav || state.chamado_fav || []).length === 2],
    ['Experiência Anterior' + (rest !== null ? ` (restam ${rest} pontos)` : ''), !!state.exp_ok],
    ['Recompensa e Virtude iniciais', !!state.r0 && !!state.rt0 && !!state.v0],
    ['Equipamento de Guerra: uma arma por Proficiência', profsOk && !!(state.armadura_sel || state.elmo_sel || state.escudo_sel)],
  ];
  const feitos = itens.filter(i => i[1]).length;
  const ALVO = ['[data-k="nome"]', '#cultura', '#conjunto', '#fav_escolha', '#prof_a', '#trait1', '#abrir-chamado', '#abrir-exp', '[data-k="r0"]', '[data-k="g0_sel"]'];
  $('#checklist').innerHTML = itens.map(([t, ok], i) => `<li class="${ok ? 'feito' : ''}" data-alvo='${ALVO[i]}' tabindex="0" role="button"><span aria-hidden="true">${ok ? '✓' : '○'}</span> ${t}</li>`).join('');
  const prox = $('#proximo'); if (prox) prox.hidden = feitos === itens.length;
  $('#progresso').textContent = feitos === itens.length ? 'Personagem pronto para jogar.' : `Criação: ${feitos} de ${itens.length} passos`;
}

function irPara(sel) {
  const el = $(sel); if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (el.tagName === 'BUTTON') el.click(); else el.focus({ preventScroll: true });
}
document.addEventListener('click', (e) => { const li = e.target.closest('#checklist li'); if (li) irPara(li.dataset.alvo); });
document.addEventListener('keydown', (e) => { const li = e.target.closest?.('#checklist li'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); irPara(li.dataset.alvo); } });
document.addEventListener('click', (e) => { if (e.target.id === 'proximo') { const li = $('#checklist li:not(.feito)'); if (li) irPara(li.dataset.alvo); } });

// ---------- Experiência Anterior (10 pontos na criação) ----------
const EXP_TOTAL = 10, CUSTO_PER = [0, 1, 2, 3, 5], CUSTO_PROF = [0, 2, 4, 6];
let expBase = {}, expDraft = {};
const maxExp = (n) => PROFS.includes(n) ? 3 : 4;
const custoNivel = (n, lvl) => (PROFS.includes(n) ? CUSTO_PROF : CUSTO_PER)[lvl];
const gastoDe = (inc, base) => Object.entries(inc).reduce((t, [n, k]) => { for (let i = 1; i <= k; i++) t += custoNivel(n, (base[n] || 0) + i); return t; }, 0);
function gastoSalvo() { const b = {}; Object.keys(state.exp_ant || {}).forEach(n => b[n] = (num('p_' + n) || 0) - state.exp_ant[n]); return gastoDe(state.exp_ant || {}, b); }
function desenharExp() {
  const saldo = EXP_TOTAL - gastoDe(expDraft, expBase);
  const linha = (n) => {
    const k = expDraft[n] || 0, atual = expBase[n] + k, prox = atual + 1, custo = prox <= maxExp(n) ? custoNivel(n, prox) : null;
    return `<div class="exp-linha"><span>${n}</span><span class="exp-nivel">${atual}${k ? ` (+${k})` : ''}</span>
      <button type="button" data-exp="-" data-n="${n}" ${k ? '' : 'disabled'} aria-label="Reduzir ${n}">−</button>
      <button type="button" data-exp="+" data-n="${n}" ${custo !== null && custo <= saldo ? '' : 'disabled'} aria-label="Aumentar ${n}">+${custo !== null ? ' ' + custo : ''}</button></div>`;
  };
  $('#exp-saldo').textContent = saldo;
  $('#exp-lista').innerHTML = Object.entries(ATRIBUTOS).map(([id, a]) => `<h4>${a.nome}</h4>` + a.pericias.map(linha).join('')).join('') + '<h4>Proficiências de Combate</h4>' + PROFS.map(linha).join('');
}
$('#abrir-exp').onclick = () => {
  if (!cult()) return avisar('Escolha uma Cultura primeiro.');
  const inc = state.exp_ant || {}; expDraft = { ...inc }; expBase = {};
  [...Object.keys(ATR_DE), ...PROFS].forEach(n => expBase[n] = (num('p_' + n) || 0) - (inc[n] || 0));
  desenharExp(); $('#dlg-exp').showModal();
};
$('#dlg-exp').addEventListener('click', (e) => {
  const b = e.target.closest('[data-exp]'); if (!b) return;
  const n = b.dataset.n; expDraft[n] = Math.max(0, (expDraft[n] || 0) + (b.dataset.exp === '+' ? 1 : -1));
  if (!expDraft[n]) delete expDraft[n]; desenharExp();
});
$('#exp-zerar').onclick = () => { expDraft = {}; desenharExp(); };
$('#exp-cancelar').onclick = () => $('#dlg-exp').close();
$('#exp-ok').onclick = () => {
  Object.keys(expBase).forEach(n => state['p_' + n] = expBase[n] + (expDraft[n] || 0));
  state.exp_ant = { ...expDraft }; state.exp_ok = true;
  $('#dlg-exp').close(); aplicar(); salvar();
};

// ---------- Chamado (janela de escolha) ----------
function abrirChamado() {
  $('#dlg-lista').innerHTML = Object.entries(CHAMADOS).map(([id, c]) => `<fieldset class="cartao">
    <label class="titulo"><input type="radio" name="ch" value="${id}" ${state.chamado === id ? 'checked' : ''}> <strong>${c.nome}</strong></label>
    <p>${c.resumo}</p>
    <p><em>Perícias Favorecidas (marque duas):</em> ${c.pericias.map(p => `<label class="chk"><input type="checkbox" data-ch="${id}" value="${p}" ${state.chamado === id && (state.chamado_fav || []).includes(p) ? 'checked' : ''}> ${p}</label>`).join(' ')}</p>
    <p><strong>Característica Notável: ${c.traco[0]}.</strong> ${c.traco[1]}${c.inimigos ? `<br><label>Inimigo: <select data-ini="${id}">${c.inimigos.map(i => `<option${state.chamado_ini === i ? ' selected' : ''}>${i}</option>`).join('')}</select></label>` : ''}</p>
    <p><strong>Caminho das Sombras: ${c.caminho[0]}.</strong> ${c.caminho[1]}</p></fieldset>`).join('');
  $('#dlg-erro').textContent = ''; $('#dlg-chamado').showModal();
}
$('#abrir-chamado').onclick = abrirChamado;
$('#dlg-cancelar').onclick = () => $('#dlg-chamado').close();
$('#dlg-lista').addEventListener('change', (e) => {
  const t = e.target, id = t.dataset.ch || t.dataset.ini; if (!id) return;
  $(`#dlg-lista input[name="ch"][value="${id}"]`).checked = true;
  if (t.dataset.ch && $$(`#dlg-lista input[data-ch="${id}"]:checked`).length > 2) t.checked = false;
});
$('#dlg-ok').onclick = () => {
  const erro = (m) => { $('#dlg-erro').textContent = m; };
  const id = $('#dlg-lista input[name="ch"]:checked')?.value; if (!id) return erro('Escolha um Chamado.');
  const f = $$(`#dlg-lista input[data-ch="${id}"]:checked`).map(x => x.value);
  if (f.length !== 2) return erro('Marque exatamente duas Perícias Favorecidas.');
  (state._cf || []).forEach(p => { if (p !== state.fav_escolha) delete state['fav_' + p]; });
  state.chamado = id; state.chamado_fav = f; state._cf = f; f.forEach(p => state['fav_' + p] = true);
  state.chamado_ini = CHAMADOS[id].inimigos ? $(`#dlg-lista select[data-ini="${id}"]`).value : '';
  $('#dlg-chamado').close(); aplicar(); salvar();
};

abrirPainel(false);
aplicar(true);
