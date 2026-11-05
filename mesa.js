// ============ Mesa do Historiador: companhia, adversários e combate ============
// Roda só no navegador (sem servidor). Os jogadores exportam a ficha (JSON) e o Historiador importa aqui.
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d = 0) => { const n = parseFloat(v); return isNaN(n) ? d : n; };
const dado = (n) => 1 + Math.floor(Math.random() * n);
const sinal = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

// ---------- estado e salvamento ----------
const CHAVE = 'um-anel-mesa-v1';
const vazio = () => ({ v: 1, herois: {}, advs: [], custom: [], cena: { id: 'c' + Math.random().toString(36).slice(2, 7), ativa: false, titulo: 'Cena', fundo: { tipo: 'mapa', modo: 'jogadores' }, tokens: [], encaixar: true, mostrarVida: false, aoVivo: false }, combate: { ativo: false, rodada: 0, fase: 'posicao', saraivada: true }, log: [] });
let mesa = (() => { try { const o = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (o && o.v === 1) return Object.assign(vazio(), o); } catch {} return vazio(); })();
let tSalvar;
function salvar() { clearTimeout(tSalvar); tSalvar = setTimeout(() => { try { localStorage.setItem(CHAVE, JSON.stringify(mesa)); } catch { aviso('Não foi possível salvar neste navegador (espaço cheio?). Use "Salvar mesa" para guardar um backup.'); } }, 120); }
let tAviso;
function aviso(m) { let el = $('#aviso'); if (!el) { el = document.createElement('div'); el.id = 'aviso'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = m; el.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => { el.hidden = true; }, 5000); }
function confirmar(titulo, msg, acao, rotulo = 'Confirmar') {
  $('#confirma-t').textContent = titulo; $('#confirma-msg').textContent = msg; $('#confirma-sim').textContent = rotulo;
  $('#confirma-sim').onclick = () => { $('#dlg-confirma').close(); acao(); }; $('#confirma-nao').onclick = () => $('#dlg-confirma').close(); $('#dlg-confirma').showModal();
}
function registrar(txt) { mesa.log.unshift({ t: Date.now(), r: mesa.combate.ativo ? mesa.combate.rodada : null, txt }); mesa.log.length = Math.min(mesa.log.length, 120); salvar(); }
const hora = (t) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// ---------- regras: valores derivados de uma ficha exportada ----------
function derivar(f) {
  const c = CULTURAS[f.cultura] || null, n = (k) => num(f[k]);
  const val = clamp(n('coracao_valor') || 1, 1, 6), sab = clamp(n('astucia_valor') || 1, 1, 6);
  const virt = []; for (let i = 0; i < sab; i++) { const v = VIRTUDES.find((x) => x.id === f['v' + i]); if (v) virt.push(v); }
  const tem = (id) => virt.some((v) => v.id === id);
  const ef = { res: 0, esp: 0, blo: 0 };
  virt.forEach((v) => { if (v.ef) for (const k in v.ef) ef[k] += v.ef[k] === 'sab' ? Math.max(2, sab) : v.ef[k]; });
  const rec = []; for (let i = 0; i < val; i++) if (f['r' + i]) rec.push({ id: f['r' + i], alvo: f['rt' + i] });
  const recEm = (a) => rec.filter((r) => r.alvo === a).map((r) => r.id);
  const nivel = { forca: n('forca_nivel'), coracao: n('coracao_nivel'), astucia: n('astucia_nivel') };
  const na = {}; for (const k in nivel) na[k] = 20 - nivel[k] - (tem('dom') && f.dom_attr === k ? 1 : 0);
  const escudo = ESCUDOS.find((x) => x.n === f.escudo_sel), arm = ARMADURAS.find((x) => x.n === f.armadura_sel), elm = ELMOS.find((x) => x.n === f.elmo_sel);
  let blo = nivel.astucia + (c ? c.base.blo : 0) + ef.blo;
  if (escudo) blo += escudo.b + (recEm('escudo').includes('reforcado') ? 1 : 0);
  if (tem('durin') && f.sit_durin) blo += 2; if (tem('povo') && f.sit_povo) blo += 2;
  const armas = [0, 1, 2, 3].map((i) => {
    const a = ARMAS.find((x) => x.n === f['g' + i + '_sel']); if (!a) return null;
    const rs = recEm('g' + i), mao = a.m === 12 ? (f['g' + i + '_mao'] === '2' ? 2 : 1) : a.m, base = mao === 2 ? a.f2 : a.f1;
    return { n: a.n, p: a.p, mao, d: a.d + (rs.includes('atroz') ? 1 : 0), f: base == null ? null : base + (rs.includes('cruel') ? 2 : 0) };
  }).filter(Boolean);
  return { c, nivel, na, tem, virt, rec, recEm, val, sab, escudo, arm, elm, armas, blo,
    resMax: nivel.forca + (c ? c.base.res : 0) + ef.res, espMax: nivel.coracao + (c ? c.base.esp : 0) + ef.esp,
    protDados: (arm ? arm.p : 0) + (elm ? elm.p : 0), protAjuste: 2 * ['armadura', 'elmo'].filter((a) => recEm(a).includes('ajustado')).length };
}
const chamadoDe = (f) => (Array.isArray(CHAMADOS) ? CHAMADOS.find((c) => c.id === f.chamado) : CHAMADOS?.[f.chamado]) || null;

// ---------- companhia ----------
const COR_HEROI = '#b3322c';
function novoHeroi(f) {
  const d = derivar(f), cur = (k, max) => (f[k] === undefined || f[k] === '' ? max : clamp(num(f[k]), 0, 99));
  return { id: 'h' + uid(), nome: (f.nome || 'Sem nome').trim(), ficha: f, res: cur('res_atual', d.resMax), esp: cur('esp_atual', d.espMax), sombra: num(f.sombra), cic: num(f.cicatrizes),
    exausto: !!f.exausto, arrasado: !!f.arrasado, ferido: !!f.ferido, postura: f.postura || '', agiu: false, atualizado: Date.now() };
}
function importarFicha(f, silencioso = false) {
  const nome = (f.nome || 'Sem nome').trim(), ex = Object.values(mesa.herois).find((h) => h.nome === nome);
  if (ex) { const n = novoHeroi(f); Object.assign(ex, { ficha: f, res: n.res, esp: n.esp, sombra: n.sombra, cic: n.cic, exausto: n.exausto, arrasado: n.arrasado, ferido: n.ferido, postura: n.postura || ex.postura, atualizado: Date.now() }); if (!silencioso) registrar(`Ficha de ${nome} atualizada.`); return 'atualizada'; }
  const h = novoHeroi(f); mesa.herois[h.id] = h; registrar(`${nome} entrou na Companhia.`); return 'nova';
}
async function importarArquivos(files) {
  let novos = 0, atual = 0;
  for (const file of files) {
    try {
      const o = JSON.parse(await file.text());
      if (o && o.v === 1 && o.herois && o.advs) { confirmar('Carregar a mesa?', `"${file.name}" é um backup da Mesa e vai substituir a mesa atual.`, () => { mesa = Object.assign(vazio(), o); salvar(); render(); aviso('Mesa carregada.'); }, 'Carregar'); continue; }
      for (const f of Array.isArray(o) ? o : [o]) {
        if (f && typeof f === 'object' && (f.cultura || f.forca_nivel !== undefined || f.nome)) { importarFicha(f) === 'nova' ? novos++ : atual++; } else aviso(`${file.name}: não parece uma ficha de O Um Anel.`);
      }
    } catch { aviso(`${file.name}: arquivo inválido.`); }
  }
  if (novos || atual) { aviso(`${novos ? novos + ' personagem(ns) novo(s)' : ''}${novos && atual ? ' e ' : ''}${atual ? atual + ' atualizado(s)' : ''}.`); salvar(); render(); }
}

// ---------- sala em tempo real: avisos para o jogador ----------
const redeOn = () => typeof Rede !== 'undefined' && Rede.conectado();
function enviarAplicar(h, campo, valor) { if (redeOn()) Rede.enviar('aplicar', { alvo: h.nome, campo, valor }); }
const heroiOnline = (h) => redeOn() && [...Rede.presentes.values()].some((p) => p.papel === 'jogador' && p.nome === h.nome);
function mostrarGM(r, alvo) { mostrarRolagem(r, alvo, false); if (window.RedeUI) RedeUI.publicarRolagem(r, 'Historiador'); }

// ---------- adversários ----------
const COR_CAT = { 'Orcs': '#4a3a28', 'Trolls': '#5b4a35', 'Mortos-vivos': '#3d4a55', 'Lobos e feras': '#6b5a3a', 'Rufiões': '#7a3b2e', 'Homens do Sul': '#8a5a2b', 'Criaturas': '#3f5a45' };
const bestiario = () => [...ADVERSARIOS, ...mesa.custom.map((c) => ({ ...c, personalizado: true }))];
function adicionarAdv(baseId, qtd = 1) {
  const b = bestiario().find((x) => x.id === baseId); if (!b) return;
  for (let i = 0; i < qtd; i++) {
    const mesmos = mesa.advs.filter((a) => a.baseId === baseId).length;
    mesa.advs.push({ id: 'a' + uid(), baseId, nome: b.nome + (qtd > 1 || mesmos ? ' ' + (mesmos + 1) : ''), categoria: b.categoria, tracos: b.tracos || [], nivel: b.nivel, resMax: b.resistencia, res: b.resistencia, poder: b.poder, feridas: 0,
      tipo: b.tipo, ptsMax: b.pontos, pts: b.pontos, bloqueio: b.bloqueio, armadura: b.armadura, profs: b.proficiencias || [], hab: b.habilidades || [], cor: COR_CAT[b.categoria] || '#5a4a3a', img: '', zona: 'reserva', engajaCom: [], agiu: false, notas: '' });
  }
  registrar(`${qtd > 1 ? qtd + '× ' : ''}${b.nome} entra${qtd > 1 ? 'm' : ''} na luta.`); salvar(); render();
}
const rotOdio = (a) => (a.tipo === 'odio' ? 'Ódio' : 'Determinação');
const ehHeroi = (id) => !!mesa.herois[id];
const nomeEnt = (id) => (mesa.herois[id] || mesa.advs.find((a) => a.id === id) || {}).nome || '?';

// ---------- ajustes de valores (heróis e adversários) ----------
function entidade(tp, id) { return tp === 'h' ? mesa.herois[id] : mesa.advs.find((a) => a.id === id); }
function maximo(tp, e, campo) {
  if (tp === 'h') { const d = derivar(e.ficha); return campo === 'res' ? d.resMax : campo === 'esp' ? d.espMax : campo === 'sombra' ? d.espMax : 99; }
  return campo === 'res' ? e.resMax : campo === 'pts' ? e.ptsMax : campo === 'feridas' ? e.poder : 99;
}
function definir(tp, id, campo, valor) {
  const e = entidade(tp, id); if (!e) return;
  const antes = e[campo]; e[campo] = clamp(Math.round(num(valor)), 0, maximo(tp, e, campo));
  if (tp === 'h' && (campo === 'esp' || campo === 'sombra')) e.arrasado = e.sombra >= e.esp && e.sombra > 0;
  if (e[campo] !== antes) { if (campo === 'res') registrar(`${e.nome}: Resistência ${antes} → ${e[campo]}${e.res <= 0 ? (tp === 'a' ? ' (fora de combate)' : ' (a zero)') : ''}.`); }
  if (tp === 'a' && campo === 'feridas' && e.feridas >= e.poder && antes < e.feridas) { e.res = 0; registrar(`${e.nome} sofreu Ferimentos demais e está fora de combate.`); }
  if (tp === 'h') { enviarAplicar(e, campo, e[campo]); if (campo === 'esp' || campo === 'sombra') enviarAplicar(e, 'arrasado', e.arrasado); }
  salvar(); render(); if (tkAtual) redesenharToken();
}

// ---------- tokens (avatar redondo com anel de Resistência) ----------
const iniciais = (n) => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const imgDe = (tp, e) => (tp === 'h' ? e.ficha.retrato || '' : e.img || '');
const corRing = (p) => (p > 60 ? 'var(--ok)' : p > 30 ? '#c9902a' : '#b3322c');
const resMaxDe = (tp, e) => (tp === 'h' ? derivar(e.ficha).resMax : e.resMax);
const avatar = (tp, e, cls = '') => { const img = imgDe(tp, e); return `<span class="av ${cls}" style="--cor:${tp === 'h' ? COR_HEROI : e.cor}">${img ? `<img src="${esc(img)}" alt="" draggable="false">` : `<span>${esc(iniciais(e.nome))}</span>`}</span>`; };
function tokenHTML(tp, e) {
  const max = resMaxDe(tp, e), p = max ? clamp(Math.round(e.res / max * 100), 0, 100) : 0;
  const enfrentado = tp === 'h' ? mesa.advs.filter((a) => a.res > 0 && a.engajaCom.includes(e.id)).length : 0;
  const badges = tp === 'h' ? [e.exausto && 'Exausto', e.arrasado && 'Arrasado', e.ferido && 'Ferido', enfrentado && `Enfrentado por ${enfrentado}`].filter(Boolean) : [e.feridas > 0 && `Feridas ${e.feridas}/${e.poder}`].filter(Boolean);
  const eng = tp === 'a' ? e.engajaCom.filter((id) => mesa.herois[id]).map((id) => avatar('h', mesa.herois[id], 'mini')).join('') : '';
  const fora = e.res <= 0 ? ' fora' : '';
  return `<div class="token ${tp === 'h' ? 'heroi' : 'adv'}${fora}${e.agiu ? ' agiu' : ''}" draggable="true" data-drag="${tp}:${e.id}">
    <div class="tk-abrir" data-tk="${tp}:${e.id}" tabindex="0" role="button" aria-label="${esc(e.nome)}, Resistência ${e.res} de ${max}. Abrir painel">
      <div class="tk-anel" style="--p:${p}%;--rc:${corRing(p)}">${avatar(tp, e, 'grande')}</div>
      <span class="tk-nome">${esc(e.nome)}</span>
    </div>
    <span class="tk-hp"><button type="button" data-step="${tp}:${e.id}:res:-1" aria-label="Menos 1 de Resistência de ${esc(e.nome)}">−</button><b>${e.res}</b><small>/${max}</small><button type="button" data-step="${tp}:${e.id}:res:1" aria-label="Mais 1 de Resistência de ${esc(e.nome)}">+</button></span>
    ${eng ? `<span class="tk-eng" title="Enfrenta">${eng}</span>` : ''}${badges.length ? `<span class="tk-badges">${badges.map((b) => `<i>${b}</i>`).join('')}</span>` : ''}${fora ? '<span class="tk-fora">fora de combate</span>' : ''}
  </div>`;
}

// ---------- vista: companhia ----------
const stepper = (tp, id, campo, rot, val, max) => `<div class="stp"><span class="stp-rot">${rot}</span><button type="button" data-step="${tp}:${id}:${campo}:-1" aria-label="Diminuir ${rot}">−</button><input type="number" value="${val}" min="0"${max != null ? ` max="${max}"` : ''} data-set="${tp}:${id}:${campo}" aria-label="${rot}"><span class="stp-max">${max != null ? '/ ' + max : ''}</span><button type="button" data-step="${tp}:${id}:${campo}:1" aria-label="Aumentar ${rot}">+</button></div>`;
const COND = [['exausto', 'Exausto'], ['arrasado', 'Arrasado'], ['ferido', 'Ferido']];
const condHTML = (h) => `<div class="conds" role="group" aria-label="Condições de ${esc(h.nome)}">${COND.map(([k, n]) => `<button type="button" class="cond-btn${h[k] ? ' on' : ''}" aria-pressed="${!!h[k]}" data-cond="${h.id}:${k}">${n}</button>`).join('')}</div>`;
const selPostura = (h) => `<label class="campo">Postura<select data-postura="${h.id}"><option value="">Sem posição</option>${POSTURAS.map((p) => `<option value="${p.id}"${h.postura === p.id ? ' selected' : ''}>${p.nome} (${p.tipo})</option>`).join('')}</select></label>`;
function cartaoHeroi(h) {
  const d = derivar(h.ficha), ch = chamadoDe(h.ficha), cn = d.c ? d.c.nome : 'Cultura não escolhida';
  return `<article class="card-heroi">
    <div class="ch-topo"><button type="button" class="av-bt" data-ficha="${h.id}" aria-label="Abrir a ficha de ${esc(h.nome)}">${avatar('h', h, 'card')}</button><div><h3>${esc(h.nome)} ${heroiOnline(h) ? '<span class="online" title="Conectado à sala" aria-label="Conectado à sala"></span>' : ''}</h3><p>${esc(cn)}${ch ? ', ' + esc(ch.nome) : ''}</p></div></div>
    <div class="barras">${stepper('h', h.id, 'res', 'Resistência', h.res, d.resMax)}${stepper('h', h.id, 'esp', 'Esperança', h.esp, d.espMax)}${stepper('h', h.id, 'sombra', 'Sombra', h.sombra, d.espMax)}</div>
    <div class="chips"><span class="chip forte">Bloqueio ${d.blo}</span><span class="chip">Proteção ${d.protDados}d${d.protAjuste ? ' ' + sinal(d.protAjuste) : ''}</span><span class="chip">NA Força ${d.na.forca}</span><span class="chip">NA Coração ${d.na.coracao}</span><span class="chip">NA Astúcia ${d.na.astucia}</span></div>
    ${condHTML(h)}${selPostura(h)}
    <div class="ch-acoes"><button type="button" data-ficha="${h.id}">Ver ficha</button><button type="button" class="sec" data-token-png="h:${h.id}">Token PNG</button><button type="button" class="sec perigo" data-remover-h="${h.id}">Remover</button></div>
  </article>`;
}
function renderCompanhia() {
  const hs = Object.values(mesa.herois);
  $('#v-companhia').innerHTML = `<header class="mesa-topo"><h2>Companhia</h2><div class="acoes"><button type="button" data-acao="importar-fichas">Importar fichas</button><button type="button" class="sec" data-acao="salvar-mesa">Salvar mesa</button><button type="button" class="sec" data-acao="carregar-mesa">Carregar mesa</button></div></header>
    <p class="nota">Cada jogador exporta a ficha (página inicial, botão Exportar) e envia o arquivo .json. Importe aqui, ou arraste os arquivos para esta página. Importar de novo a mesma ficha atualiza o personagem e traz os valores atuais dela.</p>
    ${hs.length ? `<div class="grade-cards">${hs.map(cartaoHeroi).join('')}</div>` : '<div class="vazio-box"><p>Nenhum personagem ainda.</p><div class="acoes" style="justify-content:center"><button type="button" data-acao="importar-fichas">Importar fichas</button><button type="button" class="sec" data-acao="exemplo">Carregar exemplo</button></div></div>'}`;
}

// ---------- vista: adversários ----------
let filtro = { q: '', cat: '' };
const profTxt = (p) => `${esc(p.nome)} ${p.dados} (${p.dano}/${p.ferimento}${p.especial?.length ? ', ' + p.especial.map(esc).join(', ') : ''})`;
function cartaoAdv(b) {
  const o = b.tipo === 'odio' ? 'Ódio' : 'Determinação';
  return `<article class="card-adv"><header><h3>${esc(b.nome)}</h3><small>${esc(b.categoria)}${b.tracos?.length ? ' · ' + b.tracos.map(esc).join(', ') : ''}${b.personalizado ? ' · personalizado' : ''}</small></header>
    <div class="chips"><span class="chip">Nível ${b.nivel}</span><span class="chip forte">Resistência ${b.resistencia}</span><span class="chip">Poder ${b.poder}</span><span class="chip">${o} ${b.pontos}</span><span class="chip">Bloqueio ${sinal(b.bloqueio)}</span><span class="chip">Armadura ${b.armadura}</span></div>
    <p class="profs">${(b.proficiencias || []).map(profTxt).join('; ') || '–'}</p>
    <footer class="ch-acoes"><button type="button" class="sec" data-det="${b.id}">Ficha</button><button type="button" data-add="${b.id}">+ Combate</button>${b.personalizado ? `<button type="button" class="sec perigo" data-remover-custom="${b.id}">Excluir</button>` : ''}</footer></article>`;
}
function listaAdv() {
  const q = filtro.q.toLowerCase(), l = bestiario().filter((b) => (!filtro.cat || b.categoria === filtro.cat) && (!q || (b.nome + ' ' + (b.tracos || []).join(' ')).toLowerCase().includes(q)));
  $('#adv-lista').innerHTML = l.map(cartaoAdv).join('') || '<div class="vazio-box">Nenhum adversário encontrado.</div>';
}
function renderAdversarios() {
  const cats = [...new Set(bestiario().map((b) => b.categoria))];
  $('#v-adversarios').innerHTML = `<header class="mesa-topo"><h2>Adversários</h2><div class="acoes"><button type="button" data-acao="criar-adv">+ Criar adversário</button></div></header>
    <div class="filtros"><label class="campo">Buscar<input id="adv-q" type="search" placeholder="Nome ou traço" value="${esc(filtro.q)}" autocomplete="off"></label>
    <div class="chips-cat" role="group" aria-label="Categoria"><button type="button" data-cat="" class="chip-cat${!filtro.cat ? ' on' : ''}">Todos</button>${cats.map((c) => `<button type="button" data-cat="${esc(c)}" class="chip-cat${filtro.cat === c ? ' on' : ''}">${esc(c)}</button>`).join('')}</div></div>
    <div id="adv-lista" class="grade-cards"></div>`;
  listaAdv();
}
function abrirAdv(id) {
  const b = bestiario().find((x) => x.id === id); if (!b) return; const o = b.tipo === 'odio' ? 'Ódio' : 'Determinação';
  $('#da-corpo').innerHTML = `<h2 id="da-t" tabindex="-1" autofocus>${esc(b.nome)}</h2><p class="nota">${esc(b.categoria)}${b.tracos?.length ? ' · ' + b.tracos.map(esc).join(', ') : ''}</p>
    <dl class="statblock"><div><dt>Nível de Atributo</dt><dd>${b.nivel}</dd></div><div><dt>Resistência</dt><dd>${b.resistencia}</dd></div><div><dt>Poder</dt><dd>${b.poder}</dd></div><div><dt>${o}</dt><dd>${b.pontos}</dd></div><div><dt>Bloqueio</dt><dd>${sinal(b.bloqueio)}</dd></div><div><dt>Armadura</dt><dd>${b.armadura}</dd></div></dl>
    <h3>Proficiências de combate</h3><ul class="lista">${(b.proficiencias || []).map((p) => `<li>${profTxt(p)}</li>`).join('') || '<li>–</li>'}</ul>
    <h3>Habilidades mortais</h3><ul class="lista">${(b.habilidades || []).map((h) => `<li><b>${esc(h.nome)}.</b> ${esc(h.texto)}</li>`).join('') || '<li>Nenhuma.</li>'}</ul>
    <p class="nota">Poder: número de Ferimentos que derrubam a criatura e de ataques por rodada. Ao chegar a 0 de Resistência, ela sai da luta.</p>
    <div class="add-qtd"><label class="campo">Quantidade<input type="number" id="add-qtd" min="1" max="20" value="1"></label><button type="button" data-add-dlg="${esc(b.id)}">Adicionar ao combate</button></div>`;
  $('#dlg-adv').showModal(); $('#dlg-adv').scrollTop = 0;
}

// ---------- vista: combate ----------
const LANES = [['van', 'Vanguarda', 'corpo a corpo'], ['aberta', 'Aberta', 'corpo a corpo'], ['def', 'Defensiva', 'corpo a corpo'], ['retag', 'Retaguarda', 'à distância'], ['', 'Sem posição', 'ainda não escolheram']];
const ZONAS = [['engajado', 'Engajados', 'corpo a corpo com os heróis'], ['distancia', 'À distância', 'arqueiros e lançadores'], ['reserva', 'Chegando', 'ainda fora da luta']];
const FASES = [['saraivada', 'Saraivadas'], ['posicao', 'Posição'], ['engajamento', 'Engajamento'], ['resolucao', 'Resolução']];
const DICAS = {
  saraivada: 'Antes das rodadas: quem tem arco ou arma de arremesso pode atirar (os Heróis primeiro, salvo se as circunstâncias favorecerem os adversários). Contra uma saraivada de que sabe, o escudo dobra o bônus de Bloqueio.',
  posicao: 'Cada herói escolhe sua posição: Vanguarda, Aberta, Defensiva ou Retaguarda. A Retaguarda só existe se os inimigos não passarem do dobro dos aventureiros, e cada herói nela exige dois lutando corpo a corpo.',
  engajamento: 'Defina quem enfrenta quem. Um herói enfrenta até 3 criaturas humanas (ou 2 grandes); até 3 heróis podem enfrentar um oponente humano (5 contra um grande).',
  resolucao: 'Os Heróis agem primeiro, da Vanguarda à Retaguarda, e depois os adversários. Cada um faz uma ação principal e uma secundária. Marque "agiu" na lista de ordem.',
};
const laneDe = (h) => LANES.find(([id]) => id === (h.postura || '')) || LANES[4];
function avisosEngajamento() {
  const av = [];
  Object.values(mesa.herois).forEach((h) => { const n = mesa.advs.filter((a) => a.res > 0 && a.engajaCom.includes(h.id)).length; if (n > 3) av.push(`${esc(h.nome)} enfrenta ${n} adversários (o limite é 3 humanos ou 2 grandes).`); });
  mesa.advs.forEach((a) => { const n = a.engajaCom.filter((id) => mesa.herois[id]).length; if (n > 5) av.push(`${esc(a.nome)} é enfrentado por ${n} heróis (o limite é 5).`); });
  return av.length ? `<p class="alerta" role="status">⚠ ${av.join(' ')}</p>` : '';
}
function renderCombate() {
  const c = mesa.combate, hs = Object.values(mesa.herois), onde = (e) => mesa.advs.length ? '' : '';
  const proximo = c.fase === 'saraivada' ? 'Ir para a Posição' : c.fase === 'posicao' ? 'Ir para o Engajamento' : c.fase === 'engajamento' ? 'Ir para a Resolução' : `Começar a rodada ${c.rodada + 1}`;
  const tracker = !c.ativo
    ? `<div class="tracker"><div><strong>Combate não iniciado.</strong> <label class="cond-lbl"><input type="checkbox" id="c-saraivada" ${c.saraivada ? 'checked' : ''}> Começar com Saraivadas de Abertura</label></div><button type="button" data-acao="iniciar">Iniciar combate</button></div>`
    : `<div class="tracker ativo"><div class="rodada"><small>Rodada</small><b>${c.fase === 'saraivada' ? '–' : c.rodada}</b></div>
        <ol class="fases">${FASES.filter(([id]) => id !== 'saraivada' || c.saraivada || c.fase === 'saraivada').map(([id, n]) => `<li class="${c.fase === id ? 'on' : ''}"${c.fase === id ? ' aria-current="step"' : ''}>${n}</li>`).join('')}</ol>
        <div class="acoes"><button type="button" data-acao="proxima">${proximo}</button><button type="button" class="sec" data-acao="encerrar">Encerrar</button></div>
        <p class="dica">${DICAS[c.fase]}</p>${avisosEngajamento()}</div>`;
  const lanes = LANES.filter(([id]) => id || hs.some((h) => !h.postura)).map(([id, nome, sub]) => {
    const t = hs.filter((h) => (h.postura || '') === id);
    return `<div class="lane" data-lane="${id}"><header><h4>${nome}</h4><small>${sub}</small></header><div class="lane-itens">${t.map((h) => tokenHTML('h', h)).join('') || '<p class="lane-vazio">arraste um herói até aqui</p>'}</div></div>`;
  }).join('');
  const zonas = ZONAS.map(([id, nome, sub]) => {
    const t = mesa.advs.filter((a) => a.zona === id);
    return `<div class="zona" data-zona="${id}"><header><h4>${nome}</h4><small>${sub}</small></header><div class="lane-itens">${t.map((a) => tokenHTML('a', a)).join('') || '<p class="lane-vazio">nenhum adversário</p>'}</div></div>`;
  }).join('');
  const ordem = [...LANES.flatMap(([id]) => hs.filter((h) => (h.postura || '') === id).map((h) => ['h', h, laneDe(h)[1]])), ...ZONAS.flatMap(([id, n]) => mesa.advs.filter((a) => a.zona === id).map((a) => ['a', a, n]))];
  $('#v-combate').innerHTML = `<header class="mesa-topo"><h2>Combate</h2><div class="acoes"><button type="button" class="sec" data-acao="ver-bestiario">+ Adversário</button></div></header>${tracker}
    <div class="board"><section class="lado" aria-label="Heróis"><h3 class="lado-t">Heróis</h3>${hs.length ? `<div class="lanes">${lanes}</div>` : '<div class="vazio-box"><p>Importe as fichas dos jogadores na aba Companhia, ou veja um exemplo pronto.</p><div class="acoes" style="justify-content:center"><button type="button" data-acao="exemplo">Carregar exemplo</button></div></div>'}</section>
    <section class="lado" aria-label="Adversários"><h3 class="lado-t">Adversários</h3><div class="zonas">${zonas}</div></section></div>
    <div class="duas"><section class="ordem"><h3>Ordem de resolução</h3>${ordem.length ? `<ol>${ordem.map(([tp, e, onde]) => `<li class="${e.agiu ? 'feito' : ''}"><label><input type="checkbox" data-agiu="${tp}:${e.id}" ${e.agiu ? 'checked' : ''}> ${avatar(tp, e, 'mini')} <b>${esc(e.nome)}</b> <small>${esc(onde)}</small></label></li>`).join('')}</ol>` : '<p class="nota">Ninguém na mesa ainda.</p>'}</section>
    <section class="registro"><div class="reg-topo"><h3>Registro</h3>${mesa.log.length ? '<button type="button" class="link-btn" data-acao="limpar-log">Limpar</button>' : ''}</div>${mesa.log.length ? `<ul class="log">${mesa.log.slice(0, 40).map((l) => `<li><time>${hora(l.t)}</time>${l.r != null ? ` <span class="r">R${l.r}</span>` : ''} ${esc(l.txt)}</li>`).join('')}</ul>` : '<p class="nota">As ações e rolagens aparecem aqui.</p>'}</section></div>`;
}
function iniciarCombate() { const c = mesa.combate; c.ativo = true; c.rodada = c.saraivada ? 0 : 1; c.fase = c.saraivada ? 'saraivada' : 'posicao'; limparAgiu(); registrar(c.saraivada ? 'Combate iniciado: Saraivadas de Abertura.' : 'Combate iniciado: rodada 1, Posição.'); salvar(); render(); }
function limparAgiu() { Object.values(mesa.herois).forEach((h) => { h.agiu = false; }); mesa.advs.forEach((a) => { a.agiu = false; }); }
function proximaFase() {
  const c = mesa.combate;
  if (c.fase === 'saraivada') { c.fase = 'posicao'; c.rodada = 1; } else if (c.fase === 'posicao') c.fase = 'engajamento'; else if (c.fase === 'engajamento') c.fase = 'resolucao'; else { c.fase = 'posicao'; c.rodada++; limparAgiu(); }
  registrar(`Rodada ${c.rodada}: ${FASES.find(([id]) => id === c.fase)[1]}.`); salvar(); render();
}
function carregarExemplo() {
  if (typeof MESA_EXEMPLO === 'undefined') return aviso('Os dados de exemplo não foram carregados.');
  MESA_EXEMPLO.forEach(importarFicha); const hs = Object.values(mesa.herois);
  adicionarAdv('chefe-orc', 1); adicionarAdv('guarda-orc', 2);
  const orcs = mesa.advs.slice(-3); orcs[0].zona = 'engajado'; orcs[0].engajaCom = [hs[0].id]; orcs[1].zona = 'engajado'; orcs[1].engajaCom = [hs[0].id]; orcs[2].zona = 'distancia';
  salvar(); render(); aviso('Exemplo carregado: 3 heróis e 3 orcs. Toque nos tokens para ver o painel.');
}
function render() { renderCombate(); renderCompanhia(); }

// ---------- ficha resumida de um herói ----------
const ALVO_ROT = { g0: 'Arma 1', g1: 'Arma 2', g2: 'Arma 3', g3: 'Arma 4', armadura: 'Armadura', elmo: 'Elmo', escudo: 'Escudo' };
const losangos = (n, max = 6) => '◆'.repeat(n) + '◇'.repeat(Math.max(0, max - n));
function abrirFicha(id) {
  const h = mesa.herois[id]; if (!h) return; const f = h.ficha, d = derivar(f), ch = chamadoDe(f);
  const lin = (r, v) => (v ? `<div><dt>${r}</dt><dd>${esc(v)}</dd></div>` : '');
  const sec = (t, c) => `<section class="fs"><h3>${t}</h3>${c}</section>`;
  const traits = [f.trait1, f.trait2, ch ? ch.feat?.[0] : ''].filter(Boolean);
  const attrs = [['forca', 'Força', 'Resistência', `${h.res} / ${d.resMax}`], ['coracao', 'Coração', 'Esperança', `${h.esp} / ${d.espMax}`], ['astucia', 'Astúcia', 'Bloqueio', d.blo]].map(([k, n, der, dv]) => {
    const per = INFO[k].pericias.map(([nome]) => ({ nome, nv: num(f['p_' + nome]), fav: !!f['fav_' + nome] })).filter((p) => p.nv > 0 || p.fav);
    return `<div class="fs-attr"><h4>${n} ${d.nivel[k]} <small>NA ${d.na[k]}</small></h4><p class="fs-der">${der}: <b>${dv}</b></p><ul>${per.map((p) => `<li>${p.fav ? '★ ' : ''}${esc(p.nome)} <span class="dots">${losangos(p.nv)}</span></li>`).join('') || '<li class="nota">sem perícias treinadas</li>'}</ul></div>`;
  }).join('');
  const profs = PROFS.map((p) => ({ p, nv: num(f['p_' + p]) })).filter((x) => x.nv > 0);
  const recs = d.rec.map((r) => { const x = RECOMPENSAS.find((y) => y.id === r.id); const alvo = r.alvo ? (/^g\d$/.test(r.alvo) ? f[r.alvo + '_sel'] || ALVO_ROT[r.alvo] : ALVO_ROT[r.alvo]) : ''; return `<li><b>${esc(x ? x.nome : r.id)}</b>${alvo ? ` (${esc(alvo)})` : ''}</li>`; });
  const comp = [0, 1, 2, 3, 4, 5, 6].filter((i) => f['c' + i + '_nome']).map((i) => `<li>${esc(f['c' + i + '_nome'])}${f['c' + i + '_papel'] ? ' — ' + esc(f['c' + i + '_papel']) : ''}${num(f['c' + i + '_fad']) ? ` <small>Fadiga ${num(f['c' + i + '_fad'])}</small>` : ''}</li>`);
  const pon = [0, 1, 2, 3, 4, 5, 6].filter((i) => f['p' + i + '_nome']).map((i) => `<li>${esc(f['p' + i + '_nome'])}${f['p' + i + '_vigor'] ? ` <small>Vigor ${esc(f['p' + i + '_vigor'])}</small>` : ''}</li>`);
  const evs = [1, 2, 3, 4, 5, 6].filter((n) => f['e' + n + '_alvo'] || f['e' + n + '_evento'] || f['e' + n + '_res']).map((n) => `<li><b>Evento ${n}.</b> ${esc([f['e' + n + '_alvo'], f['e' + n + '_evento'], f['e' + n + '_res']].filter(Boolean).join(' / '))}</li>`);
  const hist = (f.rol_hist || []).slice(0, 12).map((e) => `<li class="${e.ok ? 'h-ok' : 'h-falha'}"><span class="h-marca">${e.ok ? '✓' : '✕'}</span> ${esc(e.nome)} <small>${e.auto ? 'automático' : `${e.total} / NA ${e.na}`}</small></li>`);
  const marcas = Object.keys(f.mapa_eriador || {}).length;
  $('#df-corpo').innerHTML = `<div class="fs-topo">${avatar('h', h, 'card')}<div><h2 id="df-t" tabindex="-1" autofocus>${esc(h.nome)}</h2><p class="nota">${esc(d.c ? d.c.nome : '')}${ch ? ' · ' + esc(ch.nome) : ''}${f.padrao ? ' · Padrão de Vida ' + esc(f.padrao) : ''}</p></div></div>
    <dl class="statblock"><div><dt>Resistência</dt><dd>${h.res}/${d.resMax}</dd></div><div><dt>Esperança</dt><dd>${h.esp}/${d.espMax}</dd></div><div><dt>Sombra</dt><dd>${h.sombra}</dd></div><div><dt>Bloqueio</dt><dd>${d.blo}</dd></div><div><dt>Proteção</dt><dd>${d.protDados}d${d.protAjuste ? ' ' + sinal(d.protAjuste) : ''}</dd></div><div><dt>Condições</dt><dd>${COND.filter(([k]) => h[k]).map(([, n]) => n).join(', ') || 'nenhuma'}</dd></div></dl>
    <dl class="fs-info">${lin('Idade', f.idade)}${lin('Patrono', f.patrono)}${lin('Características Notáveis', traits.join(', '))}${lin('Caminho das Sombras', ch?.caminho?.[0])}${lin('Falhas', f.falhas)}${lin('Tesouro', f.tesouro)}</dl>
    ${sec('Atributos e Perícias', `<div class="fs-grade">${attrs}</div>`)}
    ${sec('Proficiências de Combate', profs.length ? `<ul class="lista">${profs.map((x) => `<li>${x.p} <span class="dots">${losangos(x.nv)}</span></li>`).join('')}</ul>` : '<p class="nota">Nenhuma.</p>')}
    ${sec(`Virtudes (Sabedoria ${d.sab})`, d.virt.length ? `<ul class="lista">${d.virt.map((v) => `<li><b>${esc(v.nome)}.</b> ${esc(v.desc)}</li>`).join('')}</ul>` : '<p class="nota">Nenhuma.</p>')}
    ${sec(`Recompensas (Valor ${d.val})`, recs.length ? `<ul class="lista">${recs.join('')}</ul>` : '<p class="nota">Nenhuma.</p>')}
    ${sec('Equipamento de guerra', `<ul class="lista">${d.armas.map((a) => `<li>${esc(a.n)}: Dano ${a.d}, Ferimento ${a.f ?? '–'} <small>(${a.mao === 2 ? '2 mãos' : '1 mão'})</small></li>`).join('') || '<li class="nota">Sem armas escolhidas.</li>'}<li>Armadura: ${esc(f.armadura_sel || 'nenhuma')}; Elmo: ${esc(f.elmo_sel || 'nenhum')}; Escudo: ${esc(f.escudo_sel || 'nenhum')}</li></ul>`)}
    ${f.equip_viagem ? sec('Equipamento de viagem', `<p class="pre">${esc(f.equip_viagem)}</p>`) : ''}
    ${sec('Jornada', `<dl class="fs-info">${lin('Ano', f.j_ano)}${lin('Estação', f.j_estacao)}${lin('Jornada de', f.j_de)}${lin('Destino', f.j_destino)}${lin('Dias de viagem', f.j_dias)}${lin('Hexágonos no mapa', marcas ? String(marcas) : '')}</dl>${comp.length ? `<h4>A Companhia</h4><ul class="lista">${comp.join('')}</ul>` : ''}${pon.length ? `<h4>Pôneis e cavalos</h4><ul class="lista">${pon.join('')}</ul>` : ''}${evs.length ? `<h4>Eventos</h4><ul class="lista">${evs.join('')}</ul>` : ''}${f.diario ? `<h4>Diário</h4><p class="pre">${esc(f.diario)}</p>` : ''}`)}
    ${sec('Últimas rolagens (da ficha importada)', hist.length ? `<ol class="r-log aberto">${hist.join('')}</ol>` : '<p class="nota">Sem rolagens registradas na ficha.</p>')}
    <p class="nota">Valores atuais podem ser ajustados na aba Companhia. Esta é uma cópia da ficha do momento da importação.</p>`;
  $('#dlg-ficha').showModal(); $('#dlg-ficha').scrollTop = 0;
}

// ---------- rolagens do Historiador ----------
function lancar(n, modo, inv) {
  const rank = inv ? (v) => (v === 12 ? 99 : v === 11 ? -1 : v) : (v) => (v === 12 ? -1 : v);
  const f = [dado(12)]; if (modo !== 'n') f.push(dado(12));
  const fac = modo === 'f' ? f.reduce((a, b) => (rank(b) > rank(a) ? b : a)) : modo === 'd' ? f.reduce((a, b) => (rank(b) < rank(a) ? b : a)) : f[0];
  const suc = Array.from({ length: Math.max(0, n) }, () => dado(6));
  return { f, fac, suc, soma: suc.reduce((s, v) => s + v, 0), icones: suc.filter((v) => v === 6).length, runa: fac === 11, olho: fac === 12 };
}
const graus = (ok, ic, positivo, negativo) => (!ok ? negativo : ic >= 2 ? positivo + ' extraordinário' : ic === 1 ? 'Grande ' + positivo.toLowerCase() : positivo);

// ---------- painel do token ----------
let tkAtual = null, ultimoAtaque = null;
const MANTER = ['tk-res', 'tk-efeito', 'tk-res2', 'tk-res3'];
function abrirToken(tp, id) { tkAtual = { tp, id }; ultimoAtaque = null; desenharToken(); const d = $('#dlg-token'); d.showModal(); d.scrollTop = 0; }
function redesenharToken() {
  if (!tkAtual || !entidade(tkAtual.tp, tkAtual.id)) { $('#dlg-token').close(); return; }
  const d = $('#dlg-token'), sc = d.scrollTop, guardado = MANTER.map((id) => [id, $('#' + id)?.innerHTML]);
  desenharToken(); guardado.forEach(([id, h]) => { const el = $('#' + id); if (el && h) el.innerHTML = h; }); d.scrollTop = sc;
}
function desenharToken() {
  const { tp, id } = tkAtual, e = entidade(tp, id); $('#dt-corpo').innerHTML = tp === 'h' ? painelHeroi(e) : painelAdv(e);
  if (tp === 'a') atualizarTN();
}
const rapidoHTML = (tp, e) => `<div class="rapido"><label class="campo">Perda de Resistência<input type="number" id="dano-rapido" min="0" value="0"></label><button type="button" data-dano-rapido="${tp}:${e.id}">Aplicar</button><button type="button" class="sec" data-cura-rapida="${tp}:${e.id}">Recuperar</button></div>`;
function painelHeroi(h) {
  const d = derivar(h.ficha), lane = laneDe(h), eng = mesa.advs.filter((a) => a.engajaCom.includes(h.id));
  return `<h2 id="dt-t" tabindex="-1" autofocus>${esc(h.nome)}</h2><p class="nota">${esc(d.c ? d.c.nome : '')} · posição: ${esc(lane[1])}</p>
    <div class="barras">${stepper('h', h.id, 'res', 'Resistência', h.res, d.resMax)}${stepper('h', h.id, 'esp', 'Esperança', h.esp, d.espMax)}${stepper('h', h.id, 'sombra', 'Sombra', h.sombra, d.espMax)}</div>
    ${rapidoHTML('h', h)}${condHTML(h)}${selPostura(h)}
    <div class="chips"><span class="chip forte">Bloqueio ${d.blo}</span><span class="chip">Proteção ${d.protDados}d${d.protAjuste ? ' ' + sinal(d.protAjuste) : ''}</span></div>
    <h3>Enfrentado por</h3>${eng.length ? `<ul class="lista">${eng.map((a) => `<li>${esc(a.nome)} <small>(${a.res}/${a.resMax})</small></li>`).join('')}</ul>` : '<p class="nota">Nenhum adversário engajado. Defina no painel de cada adversário.</p>'}
    <div class="ch-acoes"><button type="button" data-ficha="${h.id}">Ver ficha</button><button type="button" class="sec" data-token-png="h:${h.id}">Token PNG</button></div>`;
}
function painelAdv(a) {
  const heroes = Object.values(mesa.herois), o = rotOdio(a);
  const optAlvo = heroes.map((h) => `<option value="${h.id}"${a.engajaCom[0] === h.id ? ' selected' : ''}>${esc(h.nome)}</option>`).join('');
  return `<h2 id="dt-t" tabindex="-1" autofocus>${esc(a.nome)}</h2><p class="nota">${esc(a.categoria)}${a.tracos?.length ? ' · ' + a.tracos.map(esc).join(', ') : ''}</p>
    <label class="campo">Nome neste combate<input type="text" data-nome-adv="${a.id}" value="${esc(a.nome)}"></label>
    <div class="barras">${stepper('a', a.id, 'res', 'Resistência', a.res, a.resMax)}${stepper('a', a.id, 'pts', o, a.pts, a.ptsMax)}${stepper('a', a.id, 'feridas', 'Ferimentos', a.feridas, a.poder)}</div>
    ${rapidoHTML('a', a)}
    <div class="chips"><span class="chip">Nível ${a.nivel}</span><span class="chip" title="Poder: ataques por rodada e Ferimentos para derrubá-lo">Poder ${a.poder}</span><span class="chip forte">Bloqueio ${sinal(a.bloqueio)}</span><span class="chip">Armadura ${a.armadura}</span></div>
    <div class="form-grid"><label class="campo">Posição<select data-zona-adv="${a.id}">${ZONAS.map(([z, n]) => `<option value="${z}"${a.zona === z ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <fieldset class="engaja"><legend>Quem ele enfrenta</legend>${heroes.length ? heroes.map((h) => `<label class="cond-lbl"><input type="checkbox" data-engaja="${a.id}:${h.id}" ${a.engajaCom.includes(h.id) ? 'checked' : ''}> ${avatar('h', h, 'mini')} ${esc(h.nome)}</label>`).join('') : '<p class="nota">Importe os heróis para definir os engajamentos.</p>'}</fieldset>
    ${a.hab.length ? `<h3>Habilidades</h3><ul class="lista">${a.hab.map((h) => `<li><b>${esc(h.nome)}.</b> ${esc(h.texto)}</li>`).join('')}</ul>` : ''}
    <section class="fs"><h3>Atacar um herói</h3>${!heroes.length ? '<p class="nota">Importe os heróis para atacar.</p>' : !a.profs.length ? '<p class="nota">Este adversário não tem proficiências cadastradas.</p>' : `
      <div class="form-grid"><label class="campo">Ataque<select id="at-prof">${a.profs.map((p, i) => `<option value="${i}">${profTxt(p)}</option>`).join('')}</select></label>
      <label class="campo">Alvo<select id="at-alvo">${optAlvo}</select></label>
      <label class="campo">Modo<select id="at-modo"><option value="n">Normal</option><option value="f">Favorecida</option><option value="d">Desfavorecida</option></select></label>
      <label class="campo">Dados extras (±)<input type="number" id="at-extra" value="0"></label></div>
      <label class="cond-lbl"><input type="checkbox" id="at-odio"${a.pts < 1 ? ' disabled' : ''}> Gastar 1 de ${o} (+1d)</label>
      <label class="cond-lbl"><input type="checkbox" id="at-inv"${a.tipo === 'odio' ? ' checked' : ''}> Símbolos invertidos (Olho = sucesso automático, Runa = 0)</label>
      <p class="nota" id="at-tn"></p><p class="nota">Poder ${a.poder}: pode atacar ${a.poder} vez${a.poder > 1 ? 'es' : ''} por rodada.</p><button type="button" data-efx="atacar">Rolar ataque</button>
      <div id="tk-res" class="tk-res" role="status"></div><div id="tk-efeito"></div><div id="tk-res2" role="status"></div>`}</section>
    <section class="fs"><h3>Sofrer um ataque</h3><div class="form-grid"><label class="campo">Perda de Resistência<input type="number" id="sf-dano" min="0" value="0"></label><label class="campo">Ferimento da arma<input type="number" id="sf-fer" min="0" value="0"></label></div>
      <label class="cond-lbl"><input type="checkbox" id="sf-perf"> Golpe Perfurante (teste de Proteção da armadura ${a.armadura})</label>
      <button type="button" data-efx="sofrer">Aplicar</button><div id="tk-res3" role="status"></div></section>
    <label class="campo">Notas<textarea rows="3" data-notas-adv="${a.id}">${esc(a.notas)}</textarea></label>
    <div class="ch-acoes"><button type="button" class="sec" data-token-png="a:${a.id}">Token PNG</button><button type="button" class="sec" data-img-adv="${a.id}">Trocar imagem</button><button type="button" class="sec" data-dup-adv="${a.id}">Duplicar</button><button type="button" class="sec perigo" data-remover-adv="${a.id}">Remover da luta</button></div>`;
}
function atualizarTN() {
  const el = $('#at-tn'), alvo = mesa.herois[$('#at-alvo')?.value]; if (!el) return;
  if (!alvo) { el.textContent = ''; return; }
  const d = derivar(alvo.ficha), p = alvo.postura, a = entidade(tkAtual.tp, tkAtual.id), prof = a.profs[+$('#at-prof').value] || {};
  const dist = /arco|arremess|flecha/i.test(prof.nome || ''), pm = !dist ? (p === 'van' ? 1 : p === 'def' ? -1 : 0) : 0;
  el.textContent = `Dificuldade (TN) = Bloqueio de ${alvo.nome}: ${d.blo}.${pm ? ` Postura ${p === 'van' ? 'de Vanguarda: o ataque ganha (1d)' : 'Defensiva: o ataque perde (1d)'}.` : ''}`;
}
function rolarAtaque() {
  const a = entidade(tkAtual.tp, tkAtual.id), prof = a.profs[+$('#at-prof').value], alvo = mesa.herois[$('#at-alvo').value]; if (!prof || !alvo) return aviso('Escolha o ataque e o alvo.');
  const d = derivar(alvo.ficha), tn = d.blo, inv = $('#at-inv').checked, gasta = $('#at-odio').checked && a.pts > 0, modo = $('#at-modo').value;
  const dist = /arco|arremess|flecha/i.test(prof.nome), pm = !dist ? (alvo.postura === 'van' ? 1 : alvo.postura === 'def' ? -1 : 0) : 0;
  const n = prof.dados + (gasta ? 1 : 0) + num($('#at-extra').value) + pm; if (gasta) { a.pts--; }
  const r = lancar(n, modo, inv), auto = inv ? r.olho : r.runa, val = inv ? (r.olho ? 12 : r.runa ? 0 : r.fac) : (r.olho ? 0 : r.fac);
  const total = val + r.soma, ok = auto || total >= tn;
  const chips = []; if (modo === 'f') chips.push('Favorecida'); if (modo === 'd') chips.push('Desfavorecida'); if (gasta) chips.push(`${rotOdio(a)} +1d`); if (pm) chips.push(`Postura do alvo ${pm > 0 ? '+1d' : '−1d'}`); if (inv) chips.push('Símbolos invertidos');
  mostrarGM({ nome: `${a.nome} → ${alvo.nome}: ${prof.nome}`, grau: graus(ok, r.icones, 'Acerto', 'Errou'), ok, na: tn, total, bonus: 0, f: r.f, fac: r.fac, modo, suc: r.suc, exausto: false, arrasado: false, runa: r.runa, olho: r.olho, icones: r.icones, invertido: inv, chips }, '#tk-res');
  registrar(`${a.nome} ataca ${alvo.nome} (${prof.nome}): ${ok ? 'acerta' : 'erra'} (${auto ? 'sucesso automático' : `${total} contra ${tn}`}).`);
  const perfBase = ok && ((inv ? r.olho : r.runa) || r.fac === 10);
  ultimoAtaque = { advId: a.id, alvoId: alvo.id, prof, ok, icones: r.icones, perfBase, fac: r.fac };
  $('#tk-efeito').innerHTML = ok ? efeitosHTML(a) : '<p class="nota">Errou: nenhum efeito.</p>'; $('#tk-res2').innerHTML = '';
  salvar(); render(); if (gasta) redesenharToken();
}
function efeitosHTML(a) {
  const c = ultimoAtaque, esp = c.prof.especial || [];
  return `<div class="efeitos"><h4>Efeitos do acerto</h4><p>Perda de Resistência base: <b>${c.prof.dano}</b>. Ícones de sucesso disponíveis: <b>${c.icones}</b>.</p>
    <label class="campo">Golpes Pesados (cada um soma o Nível de Atributo, ${a.nivel}, e gasta 1 ícone)<input type="number" id="ef-pesado" min="0" max="${c.icones}" value="0"></label>
    ${esp.includes('Perfurar') ? '<label class="cond-lbl"><input type="checkbox" id="ef-perfurar"> Perfurar (gasta 1 ícone: +2 no Dado de Façanha, para um Golpe Perfurante)</label>' : ''}
    ${esp.includes('Quebrar Escudo') ? '<label class="cond-lbl"><input type="checkbox" id="ef-quebrar"> Quebrar Escudo (gasta 1 ícone; o escudo do alvo fica inutilizado)</label>' : ''}
    ${esp.includes('Agarrar') ? '<label class="cond-lbl"><input type="checkbox" id="ef-agarrar"> Agarrar (gasta 1 ícone)</label>' : ''}
    <p class="nota">${c.perfBase ? 'O Dado de Façanha já garante um Golpe Perfurante.' : 'Sem Golpe Perfurante pelo Dado de Façanha.'}</p><button type="button" data-efx="aplicar">Aplicar ao herói</button></div>`;
}
function aplicarEfeitos() {
  const c = ultimoAtaque; if (!c) return; const a = mesa.advs.find((x) => x.id === c.advId), h = mesa.herois[c.alvoId]; if (!a || !h) return;
  const pes = clamp(Math.round(num($('#ef-pesado')?.value)), 0, c.icones), perfurar = !!$('#ef-perfurar')?.checked, quebrar = !!$('#ef-quebrar')?.checked, agarrar = !!$('#ef-agarrar')?.checked;
  const usados = pes + (perfurar ? 1 : 0) + (quebrar ? 1 : 0) + (agarrar ? 1 : 0); if (usados > c.icones) return aviso(`Você marcou ${usados} efeitos, mas só há ${c.icones} ícone(s).`);
  const perda = c.prof.dano + pes * a.nivel, d = derivar(h.ficha), perf = c.perfBase || (perfurar && c.fac + 2 >= 10), antes = h.res;
  h.res = clamp(h.res - perda, 0, d.resMax); enviarAplicar(h, 'res', h.res);
  registrar(`${h.nome} perde ${perda} de Resistência (${antes} → ${h.res})${pes ? `, com ${pes} Golpe(s) Pesado(s)` : ''}${quebrar ? '; o escudo foi quebrado' : ''}${agarrar ? '; foi agarrado' : ''}.`);
  ultimoAtaque.perf = perf; ultimoAtaque.aplicado = true; salvar(); render();
  $('#tk-efeito').innerHTML = `<div class="efeitos"><p class="ok-txt">Aplicado: ${esc(h.nome)} perde <b>${perda}</b> de Resistência (agora ${h.res}/${d.resMax}).${quebrar ? ' O escudo foi quebrado.' : ''}${agarrar ? ' Foi agarrado.' : ''}</p>
    ${perf ? `<h4>Golpe Perfurante: Proteção de ${esc(h.nome)}</h4><p>Proteção ${d.protDados}d${d.protAjuste ? ' ' + sinal(d.protAjuste) : ''} contra Ferimento ${c.prof.ferimento}.</p><label class="cond-lbl"><input type="checkbox" id="pr-desf"> Proteção Desfavorecida (habilidade do adversário)</label><button type="button" data-efx="protecao">Rolar Proteção</button>` : '<p class="nota">Sem Golpe Perfurante.</p>'}</div>`;
}
function rolarProtecao() {
  const c = ultimoAtaque, h = mesa.herois[c?.alvoId]; if (!h) return; const d = derivar(h.ficha);
  const modo = $('#pr-desf')?.checked ? 'd' : (d.tem('duro') && !h.arrasado ? 'f' : 'n'), r = lancar(d.protDados, modo, false), total = (r.olho ? 0 : r.fac) + r.soma + d.protAjuste, ok = r.runa || total >= c.prof.ferimento;
  const chips = []; if (modo === 'f') chips.push('Favorecida (Duro como Pedra)'); if (modo === 'd') chips.push('Desfavorecida'); if (d.protAjuste) chips.push(`Ajustado +${d.protAjuste}`);
  mostrarGM({ nome: `Proteção de ${h.nome}`, grau: ok ? 'Protegido' : 'Ferido!', ok, na: c.prof.ferimento, total, bonus: d.protAjuste, f: r.f, fac: r.fac, modo, suc: r.suc, exausto: false, arrasado: false, runa: r.runa, olho: r.olho, icones: r.icones, chips }, '#tk-res2');
  registrar(`Proteção de ${h.nome}: ${ok ? 'resiste ao Golpe Perfurante' : 'falha e sofre um Ferimento'}.`);
  if (!ok) $('#tk-res2').insertAdjacentHTML('beforeend', `<div class="efeitos"><p>${h.ferido ? `${esc(h.nome)} já estava Ferido: role a gravidade do ferimento (Dado de Façanha, veja o livro).` : `${esc(h.nome)} fica <b>Ferido</b>.`}</p><button type="button" data-efx="ferir">${h.ferido ? 'Registrar novo Ferimento' : 'Marcar como Ferido'}</button></div>`);
  salvar();
}
function sofrerAtaque() {
  const a = entidade(tkAtual.tp, tkAtual.id), dano = Math.max(0, Math.round(num($('#sf-dano').value))), fer = Math.max(0, Math.round(num($('#sf-fer').value))), perf = $('#sf-perf').checked, inv = $('#at-inv') ? $('#at-inv').checked : a.tipo === 'odio';
  if (dano) { const antes = a.res; a.res = clamp(a.res - dano, 0, a.resMax); registrar(`${a.nome} perde ${dano} de Resistência (${antes} → ${a.res}).`); }
  let extra = '';
  if (perf) {
    const r = lancar(a.armadura, 'n', inv), auto = inv ? r.olho : r.runa, val = inv ? (r.olho ? 12 : r.runa ? 0 : r.fac) : (r.olho ? 0 : r.fac), total = val + r.soma, ok = auto || total >= fer;
    mostrarGM({ nome: `Proteção de ${a.nome}`, grau: ok ? 'Protegido' : 'Ferido!', ok, na: fer, total, bonus: 0, f: r.f, fac: r.fac, modo: 'n', suc: r.suc, exausto: false, arrasado: false, runa: r.runa, olho: r.olho, icones: r.icones, invertido: inv, chips: [`Armadura ${a.armadura}d`] }, '#tk-res3');
    if (!ok) { a.feridas = Math.min(a.poder, a.feridas + 1); registrar(`${a.nome} falha na Proteção e sofre um Ferimento (${a.feridas}/${a.poder}).`); if (a.feridas >= a.poder) { a.res = 0; registrar(`${a.nome} está fora de combate.`); } }
    else registrar(`${a.nome} resiste ao Golpe Perfurante.`);
  } else $('#tk-res3').innerHTML = dano ? `<p class="ok-txt">${esc(a.nome)} perde ${dano} de Resistência (agora ${a.res}/${a.resMax}).</p>` : '';
  salvar(); render(); redesenharToken();
}

// ---------- criar adversário personalizado ----------
function abrirCriar() {
  const cats = [...new Set(bestiario().map((b) => b.categoria))], prof = (i) => `<fieldset class="engaja"><legend>Ataque ${i}</legend><div class="form-grid"><label class="campo">Nome<input id="cp${i}-n"></label><label class="campo">Dados de Sucesso<input type="number" id="cp${i}-d" min="0" value="2"></label><label class="campo">Dano<input type="number" id="cp${i}-dano" min="0" value="3"></label><label class="campo">Ferimento<input type="number" id="cp${i}-fer" min="0" value="12"></label></div><label class="campo">Especiais (separados por vírgula)<input id="cp${i}-esp" placeholder="Perfurar, Quebrar Escudo"></label></fieldset>`;
  $('#dc-corpo').innerHTML = `<h2 id="dc-t" tabindex="-1" autofocus>Criar adversário</h2><div class="form-grid"><label class="campo">Nome<input id="c-nome"></label><label class="campo">Categoria<input id="c-cat" list="cats" value="Personalizado"><datalist id="cats">${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</datalist></label>
    <label class="campo">Nível de Atributo<input type="number" id="c-nivel" min="1" value="3"></label><label class="campo">Resistência<input type="number" id="c-res" min="1" value="12"></label><label class="campo">Poder<input type="number" id="c-poder" min="1" value="1"></label>
    <label class="campo">Usa<select id="c-tipo"><option value="odio">Ódio</option><option value="determinacao">Determinação</option></select></label><label class="campo">Pontos<input type="number" id="c-pts" min="0" value="3"></label><label class="campo">Bloqueio (modificador)<input type="number" id="c-blo" value="0"></label><label class="campo">Armadura (dados)<input type="number" id="c-arm" min="0" value="1"></label></div>
    ${prof(1)}${prof(2)}<label class="campo">Habilidades (uma por linha, "Nome: texto")<textarea id="c-hab" rows="3"></textarea></label>
    <div class="dlg-botoes"><button type="button" data-efx="salvar-custom">Salvar no bestiário</button><button type="button" class="sec" data-fechar>Cancelar</button></div>`;
  $('#dlg-criar').showModal(); $('#dlg-criar').scrollTop = 0;
}
function salvarCustom() {
  const nome = $('#c-nome').value.trim(); if (!nome) return aviso('Dê um nome ao adversário.');
  const profs = [1, 2].map((i) => ({ nome: $(`#cp${i}-n`).value.trim(), dados: num($(`#cp${i}-d`).value), dano: num($(`#cp${i}-dano`).value), ferimento: num($(`#cp${i}-fer`).value), especial: $(`#cp${i}-esp`).value.split(',').map((s) => s.trim()).filter(Boolean) })).filter((p) => p.nome);
  const hab = $('#c-hab').value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); return i > 0 ? { nome: l.slice(0, i).trim(), texto: l.slice(i + 1).trim() } : { nome: 'Habilidade', texto: l }; });
  mesa.custom.push({ id: 'c-' + uid(), nome, categoria: $('#c-cat').value.trim() || 'Personalizado', tracos: [], nivel: num($('#c-nivel').value, 1), resistencia: num($('#c-res').value, 1), poder: num($('#c-poder').value, 1), tipo: $('#c-tipo').value, pontos: num($('#c-pts').value), bloqueio: num($('#c-blo').value), armadura: num($('#c-arm').value), proficiencias: profs, habilidades: hab });
  salvar(); $('#dlg-criar').close(); renderAdversarios(); aviso(`${nome} foi salvo no bestiário.`);
}

// ---------- token em PNG (para usar em outras mesas virtuais) ----------
const carregarImg = (src) => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
const clarear = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${Math.min(255, ((n >> 16) & 255) + 55)},${Math.min(255, ((n >> 8) & 255) + 55)},${Math.min(255, (n & 255) + 55)})`; };
async function tokenCanvas(tp, e, usarImg = true) {
  const S = 512, R = S / 2 - 14, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d'), cor = tp === 'h' ? COR_HEROI : e.cor;
  let img = null, src = imgDe(tp, e); if (usarImg && src) { try { img = await carregarImg(src); } catch {} }
  x.save(); x.beginPath(); x.arc(S / 2, S / 2, R, 0, Math.PI * 2); x.clip();
  if (img) { const k = Math.max(2 * R / img.width, 2 * R / img.height), w = img.width * k, h = img.height * k; x.drawImage(img, S / 2 - w / 2, S / 2 - h / 2, w, h); }
  else { const g = x.createRadialGradient(S / 2, S / 2 - 40, 20, S / 2, S / 2, R); g.addColorStop(0, clarear(cor)); g.addColorStop(1, cor); x.fillStyle = g; x.fillRect(0, 0, S, S); x.fillStyle = 'rgba(255,248,230,.95)'; x.font = `700 ${S * 0.36}px Cinzel, Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(iniciais(e.nome), S / 2, S / 2 + 8); }
  x.restore();
  x.lineWidth = 22; x.strokeStyle = cor; x.beginPath(); x.arc(S / 2, S / 2, R, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 4; x.strokeStyle = 'rgba(255,248,230,.85)'; x.beginPath(); x.arc(S / 2, S / 2, R - 14, 0, Math.PI * 2); x.stroke();
  return cv;
}
function baixar(blob, nome) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
async function baixarToken(tp, id) {
  const e = entidade(tp, id); if (!e) return; const blobDe = (cv) => new Promise((ok) => { try { cv.toBlob((b) => ok(b), 'image/png'); } catch { ok(null); } });
  let blob = await blobDe(await tokenCanvas(tp, e));
  if (!blob) { blob = await blobDe(await tokenCanvas(tp, e, false)); aviso('O retrato é um link externo e não pôde ser usado no token. Gerei um com as iniciais.'); }
  baixar(blob, `token-${e.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '_').toLowerCase()}.png`);
}
const reduzirImagem = (file, max) => new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.85)); }; im.onerror = no; im.src = fr.result; }; fr.onerror = no; fr.readAsDataURL(file); });

// ---------- navegação e tema ----------
const VISTAS = ['combate', 'cenas', 'companhia', 'adversarios'];
function irAba(n) {
  VISTAS.forEach((v) => { $('#v-' + v).hidden = v !== n; });
  $$('#abas button').forEach((b) => { const on = b.dataset.aba === n; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  window.scrollTo(0, 0);
}
(() => {
  const chave = 'um-anel-tema', raiz = document.documentElement, b = $('#tema'); let atual = 'light';
  try { atual = localStorage.getItem(chave) === 'dark' ? 'dark' : 'light'; } catch {}
  const pintar = () => { raiz.dataset.theme = atual; const t = atual === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'; b.setAttribute('aria-pressed', String(atual === 'dark')); b.setAttribute('aria-label', t); b.title = t; };
  b.onclick = () => { atual = atual === 'dark' ? 'light' : 'dark'; raiz.classList.add('tema-anim'); pintar(); try { localStorage.setItem(chave, atual); } catch {} clearTimeout(b._t); b._t = setTimeout(() => raiz.classList.remove('tema-anim'), 500); };
  pintar();
})();

// ---------- eventos ----------
function moverToken(tp, id, alvo) {
  if (tp === 'h' && alvo.dataset.lane !== undefined) { const h = mesa.herois[id]; if (!h) return; h.postura = alvo.dataset.lane; registrar(`${h.nome} assume a posição: ${laneDe(h)[1]}.`); enviarAplicar(h, 'postura', h.postura); }
  else if (tp === 'a' && alvo.dataset.zona) { const a = mesa.advs.find((x) => x.id === id); if (!a) return; a.zona = alvo.dataset.zona; registrar(`${a.nome} vai para: ${ZONAS.find(([z]) => z === a.zona)[1]}.`); }
  else return;
  salvar(); render();
}
document.addEventListener('dragstart', (e) => { const t = e.target.closest?.('[data-drag]'); if (!t) return; e.dataTransfer.setData('text/plain', t.dataset.drag); e.dataTransfer.effectAllowed = 'move'; t.classList.add('arrastando'); });
document.addEventListener('dragend', () => { $$('.arrastando,.sobre').forEach((x) => x.classList.remove('arrastando', 'sobre')); });
document.addEventListener('dragover', (e) => { const al = e.target.closest?.('[data-lane],[data-zona]'); if (al) { e.preventDefault(); $$('.sobre').forEach((x) => x !== al && x.classList.remove('sobre')); al.classList.add('sobre'); } else if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
document.addEventListener('drop', (e) => {
  const al = e.target.closest?.('[data-lane],[data-zona]');
  if (e.dataTransfer?.files?.length && !al) { e.preventDefault(); importarArquivos([...e.dataTransfer.files].filter((f) => /json$/i.test(f.name) || f.type.includes('json'))); return; }
  if (!al) return; e.preventDefault(); const [tp, id] = (e.dataTransfer.getData('text/plain') || '').split(':'); moverToken(tp, id, al);
});
document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-tk]')) { e.preventDefault(); const [tp, id] = e.target.dataset.tk.split(':'); abrirToken(tp, id); } });
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.tagName === 'DIALOG') { t.close(); return; }
  const fechar = t.closest('[data-fechar]'); if (fechar) { fechar.closest('dialog').close(); return; }
  const step = t.closest('[data-step]'); if (step) { const [tp, id, campo, d] = step.dataset.step.split(':'), en = entidade(tp, id); if (en) definir(tp, id, campo, en[campo] + Number(d)); return; }
  const cond = t.closest('[data-cond]'); if (cond) { const [id, k] = cond.dataset.cond.split(':'), h = mesa.herois[id]; if (h) { h[k] = !h[k]; registrar(`${h.nome}: ${COND.find(([c]) => c === k)[1]} ${h[k] ? 'marcado' : 'removido'}.`); enviarAplicar(h, k, h[k]); salvar(); render(); if (tkAtual) redesenharToken(); } return; }
  const aba = t.closest('[data-aba]'); if (aba) { irAba(aba.dataset.aba); return; }
  const f = t.closest('[data-ficha]'); if (f) { abrirFicha(f.dataset.ficha); return; }
  const png = t.closest('[data-token-png]'); if (png) { const [tp, id] = png.dataset.tokenPng.split(':'); baixarToken(tp, id); return; }
  const det = t.closest('[data-det]'); if (det) { abrirAdv(det.dataset.det); return; }
  const add = t.closest('[data-add]'); if (add) { adicionarAdv(add.dataset.add, 1); aviso('Adicionado ao combate (veja a aba Combate).'); return; }
  const addd = t.closest('[data-add-dlg]'); if (addd) { adicionarAdv(addd.dataset.addDlg, clamp(Math.round(num($('#add-qtd').value, 1)), 1, 20)); $('#dlg-adv').close(); irAba('combate'); return; }
  const cat = t.closest('[data-cat]'); if (cat) { filtro.cat = cat.dataset.cat; $$('.chip-cat').forEach((b) => b.classList.toggle('on', b === cat)); listaAdv(); return; }
  const rh = t.closest('[data-remover-h]'); if (rh) { const h = mesa.herois[rh.dataset.removerH]; confirmar(`Remover ${h.nome}?`, 'O personagem sai da mesa (a ficha do jogador não é afetada). Você pode importá-lo de novo.', () => { delete mesa.herois[h.id]; mesa.advs.forEach((a) => { a.engajaCom = a.engajaCom.filter((i) => i !== h.id); }); registrar(`${h.nome} saiu da Companhia.`); salvar(); render(); }, 'Remover'); return; }
  const rc = t.closest('[data-remover-custom]'); if (rc) { confirmar('Excluir do bestiário?', 'O adversário personalizado será removido do bestiário (os que já estão na luta continuam).', () => { mesa.custom = mesa.custom.filter((c) => c.id !== rc.dataset.removerCustom); salvar(); renderAdversarios(); }, 'Excluir'); return; }
  const ra = t.closest('[data-remover-adv]'); if (ra) { const a = mesa.advs.find((x) => x.id === ra.dataset.removerAdv); confirmar(`Remover ${a.nome} da luta?`, 'Ele sai do combate.', () => { mesa.advs = mesa.advs.filter((x) => x.id !== a.id); registrar(`${a.nome} saiu da luta.`); salvar(); $('#dlg-token').close(); render(); }, 'Remover'); return; }
  const da = t.closest('[data-dup-adv]'); if (da) { const a = mesa.advs.find((x) => x.id === da.dataset.dupAdv), c = JSON.parse(JSON.stringify(a)); c.id = 'a' + uid(); c.nome = a.nome + ' (cópia)'; mesa.advs.push(c); salvar(); render(); aviso('Adversário duplicado.'); return; }
  const ia = t.closest('[data-img-adv]'); if (ia) { imgAlvo = ia.dataset.imgAdv; $('#arq-img').value = ''; $('#arq-img').click(); return; }
  const dr = t.closest('[data-dano-rapido]'); if (dr) { const [tp, id] = dr.dataset.danoRapido.split(':'), en = entidade(tp, id), v = Math.max(0, num($('#dano-rapido').value)); if (v) definir(tp, id, 'res', en.res - v); return; }
  const cr = t.closest('[data-cura-rapida]'); if (cr) { const [tp, id] = cr.dataset.curaRapida.split(':'), en = entidade(tp, id), v = Math.max(0, num($('#dano-rapido').value)); if (v) definir(tp, id, 'res', en.res + v); return; }
  const efx = t.closest('[data-efx]');
  if (efx) { const k = efx.dataset.efx; if (k === 'atacar') rolarAtaque(); else if (k === 'aplicar') aplicarEfeitos(); else if (k === 'protecao') rolarProtecao(); else if (k === 'sofrer') sofrerAtaque(); else if (k === 'salvar-custom') salvarCustom();
    else if (k === 'ferir') { const h = mesa.herois[ultimoAtaque?.alvoId]; if (h) { h.ferido = true; registrar(`${h.nome} sofre um Ferimento.`); enviarAplicar(h, 'ferido', true); salvar(); render(); efx.disabled = true; efx.textContent = 'Ferimento registrado'; } } return; }
  const ac = t.closest('[data-acao]');
  if (ac) { const k = ac.dataset.acao;
    if (k === 'importar-fichas') { $('#arq-fichas').value = ''; $('#arq-fichas').click(); }
    else if (k === 'carregar-mesa') { $('#arq-mesa').value = ''; $('#arq-mesa').click(); }
    else if (k === 'salvar-mesa') baixar(new Blob([JSON.stringify(mesa)], { type: 'application/json' }), 'mesa-do-historiador.json');
    else if (k === 'criar-adv') abrirCriar();
    else if (k === 'exemplo') carregarExemplo();
    else if (k === 'ver-bestiario') irAba('adversarios');
    else if (k === 'iniciar') iniciarCombate();
    else if (k === 'proxima') proximaFase();
    else if (k === 'encerrar') confirmar('Encerrar o combate?', 'O registro e os adversários continuam na mesa; só o contador de rodadas é zerado.', () => { mesa.combate.ativo = false; registrar('Combate encerrado.'); salvar(); render(); }, 'Encerrar');
    else if (k === 'limpar-log') { mesa.log = []; salvar(); renderCombate(); }
    return; }
  const tk = t.closest('[data-tk]'); if (tk) { const [tp, id] = tk.dataset.tk.split(':'); abrirToken(tp, id); }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('[data-set]')) { const [tp, id, campo] = t.dataset.set.split(':'); definir(tp, id, campo, t.value); return; }
  if (t.matches('[data-postura]')) { const h = mesa.herois[t.dataset.postura]; if (h) { h.postura = t.value; registrar(`${h.nome} assume a posição: ${laneDe(h)[1]}.`); enviarAplicar(h, 'postura', h.postura); salvar(); render(); if (tkAtual) redesenharToken(); } return; }
  if (t.matches('[data-agiu]')) { const [tp, id] = t.dataset.agiu.split(':'), en = entidade(tp, id); if (en) { en.agiu = t.checked; salvar(); renderCombate(); } return; }
  if (t.id === 'c-saraivada') { mesa.combate.saraivada = t.checked; salvar(); return; }
  if (t.matches('[data-zona-adv]')) { const a = mesa.advs.find((x) => x.id === t.dataset.zonaAdv); if (a) { a.zona = t.value; registrar(`${a.nome} vai para: ${ZONAS.find(([z]) => z === a.zona)[1]}.`); salvar(); render(); } return; }
  if (t.matches('[data-engaja]')) { const [aid, hid] = t.dataset.engaja.split(':'), a = mesa.advs.find((x) => x.id === aid); if (a) { a.engajaCom = t.checked ? [...new Set([...a.engajaCom, hid])] : a.engajaCom.filter((x) => x !== hid); if (t.checked && a.zona === 'reserva') a.zona = 'engajado'; salvar(); render(); atualizarTN(); } return; }
  if (t.matches('[data-nome-adv]')) { const a = mesa.advs.find((x) => x.id === t.dataset.nomeAdv); if (a) { a.nome = t.value.trim() || a.nome; salvar(); render(); const h = $('#dt-t'); if (h) h.textContent = a.nome; } return; }
  if (t.matches('[data-notas-adv]')) { const a = mesa.advs.find((x) => x.id === t.dataset.notasAdv); if (a) { a.notas = t.value; salvar(); } return; }
  if (t.id === 'at-alvo' || t.id === 'at-prof') atualizarTN();
  if (t.id === 'arq-fichas') importarArquivos([...t.files]);
  if (t.id === 'arq-mesa') importarArquivos([...t.files]);
  if (t.id === 'arq-img') { const f = t.files[0]; if (f && imgAlvo) reduzirImagem(f, 256).then((url) => { const a = mesa.advs.find((x) => x.id === imgAlvo); if (a) { a.img = url; salvar(); render(); redesenharToken(); } }).catch(() => aviso('Não consegui ler essa imagem.')); }
});
document.addEventListener('input', (e) => { if (e.target.id === 'adv-q') { filtro.q = e.target.value; listaAdv(); } });
let imgAlvo = null;
$('#dlg-token').addEventListener('close', () => { tkAtual = null; ultimoAtaque = null; });

// ---------- sala em tempo real: fichas e presença ----------
function receberFicha(env) {
  const { f, ret } = env.d || {}; if (!f || !f.nome) return; if (ret) f.retrato = ret;
  const nome = f.nome.trim(), sig = JSON.stringify(f) + (ret ? ret.length : 0); let h = Object.values(mesa.herois).find((x) => x.nome === nome);
  if (h && h.sig === sig) return;
  importarFicha(f, true); h = Object.values(mesa.herois).find((x) => x.nome === nome); h.sig = sig;
  salvar(); render(); if (tkAtual && tkAtual.tp === 'h' && tkAtual.id === h.id) redesenharToken();
}
if (window.RedeUI) { RedeUI.on('ficha', receberFicha); Rede.on('presenca', () => { renderCompanhia(); }); Rede.on('estado', () => { renderCompanhia(); }); }

// ---------- início ----------
irAba('combate'); render(); renderAdversarios();
