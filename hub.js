// ============ Hub de fichas, abas, retrato e página de Jornada ============
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VISTAS = { hub: $('#hub'), ficha: $('#vista-ficha'), jornada: $('#vista-jornada') };

function mostrar(v) {
  for (const k in VISTAS) VISTAS[k].hidden = k !== v;
  const hub = v === 'hub';
  document.body.dataset.vista = hub ? 'hub' : 'ficha';
  $('#voltar').hidden = hub; $('#abas').hidden = hub; $('#menu').hidden = hub;
  $('#menu').open = false;
  $$('#abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === v));
  $('#titulo-barra').textContent = hub ? 'O Um Anel – Fichas' : (state.nome || 'Sem nome');
  window.scrollTo(0, 0);
}

// ---------- confirmação genérica ----------
function confirmar(titulo, msg, acao, rotulo = 'Confirmar') {
  $('#confirma-t').textContent = titulo; $('#confirma-msg').textContent = msg; $('#confirma-sim').textContent = rotulo;
  $('#confirma-sim').onclick = () => { $('#dlg-confirma').close(); acao(); };
  $('#dlg-confirma').showModal();
}
$('#confirma-nao').onclick = () => $('#dlg-confirma').close();

// ---------- fichas ----------
const novoId = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function abrirFicha(id) {
  if (!db.fichas[id]) return;
  state = db.fichas[id]; db.ativo = id;
  Object.keys(ultimo).forEach(k => delete ultimo[k]);
  aplicar(true); renderRetrato(); mostrar('ficha'); salvar();
}
function voltarHub() { salvar(); db.ativo = null; state = {}; renderHub(); mostrar('hub'); }
function baixar(obj, nome) {
  const arq = (nome || 'personagem').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '_');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  a.download = `${arq}.json`; a.click(); URL.revokeObjectURL(a.href);
}

function renderHub() {
  const ids = Object.keys(db.fichas);
  $('#hub-lista').innerHTML = ids.length ? ids.map(id => {
    const f = db.fichas[id], c = CULTURAS[f.cultura], ch = CHAMADOS[f.chamado];
    return `<article class="card-ficha" data-id="${id}">
      <button type="button" class="card-retrato" data-acao="abrir" aria-label="Abrir ${esc(f.nome || 'ficha sem nome')}">${f.retrato ? `<img src="${esc(f.retrato)}" alt="" onerror="this.replaceWith(document.createTextNode('Imagem indisponível'))">` : '<span>Sem retrato</span>'}</button>
      <h3>${esc(f.nome || 'Sem nome')}</h3><p>${c ? esc(c.nome) : 'Cultura não escolhida'}${ch ? ' – ' + esc(ch.nome) : ''}</p>
      <div class="card-botoes"><button type="button" data-acao="abrir">Abrir</button><button type="button" data-acao="retrato">Retrato</button><button type="button" data-acao="exportar">Exportar</button><button type="button" data-acao="duplicar">Duplicar</button><button type="button" data-acao="excluir">Excluir</button></div></article>`;
  }).join('') : '<p class="nota">Nenhuma ficha ainda. Toque em Nova ficha para começar.</p>';
}
$('#hub-lista').addEventListener('click', (e) => {
  const b = e.target.closest('[data-acao]'); if (!b) return;
  const id = b.closest('.card-ficha').dataset.id, f = db.fichas[id];
  ({
    abrir: () => abrirFicha(id),
    retrato: () => abrirRetrato(id),
    exportar: () => baixar(f, f.nome),
    duplicar: () => { db.fichas[novoId()] = JSON.parse(JSON.stringify({ ...f, nome: (f.nome || 'Sem nome') + ' (cópia)' })); salvar(); renderHub(); },
    excluir: () => confirmar('Excluir esta ficha?', `"${f.nome || 'Sem nome'}" será apagada deste navegador. Exporte antes se quiser guardá-la.`, () => { delete db.fichas[id]; salvar(); renderHub(); }, 'Excluir'),
  })[b.dataset.acao]();
});
$('#hub-novo').onclick = () => { const id = novoId(); db.fichas[id] = {}; abrirFicha(id); };
$('#importar').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('formato');
    db.fichas[novoId()] = o; salvar(); renderHub(); avisar('Ficha importada.');
  } catch { avisar('Arquivo inválido: use um JSON exportado por esta ficha.'); }
  e.target.value = '';
};
$('#voltar').onclick = voltarHub;
$('#exportar').onclick = () => baixar(state, state.nome);
$('#novo').onclick = () => confirmar('Limpar esta ficha?', 'Todos os dados desta ficha serão apagados. Exporte antes se quiser guardá-la.', () => { state = {}; db.fichas[db.ativo] = state; Object.keys(ultimo).forEach(k => delete ultimo[k]); aplicar(true); renderRetrato(); salvar(); }, 'Limpar');
$$('#abas button').forEach(b => b.onclick = () => mostrar(b.dataset.aba));
document.addEventListener('input', (e) => { if (e.target.dataset?.k === 'nome') $('#titulo-barra').textContent = state.nome || 'Sem nome'; });
// menu: fecha ao escolher um item ou tocar fora
document.addEventListener('click', (e) => { const m = $('#menu'); if (m.open && (e.target.closest('.menu-itens button') || !e.target.closest('#menu'))) m.open = false; });

// ---------- retrato ----------
let retratoId = null;
function renderRetrato() {
  const im = $('#retrato-img'), t = $('#retrato span');
  if (state.retrato) { im.src = state.retrato; im.hidden = false; t.hidden = true; } else { im.hidden = true; im.removeAttribute('src'); t.hidden = false; }
}
$('#retrato-img').onerror = () => { $('#retrato-img').hidden = true; $('#retrato span').hidden = false; avisar('Não foi possível carregar a imagem do link.'); };
function abrirRetrato(id) {
  retratoId = id; const r = db.fichas[id]?.retrato || '';
  $('#ret-url').value = r.startsWith('data:') ? '' : r; $('#dlg-retrato').showModal();
}
function definirRetrato(v) {
  const f = db.fichas[retratoId]; if (!f) return;
  if (v) f.retrato = v; else delete f.retrato;
  salvar(); renderRetrato(); renderHub(); $('#dlg-retrato').close();
}
$('#retrato').onclick = () => abrirRetrato(db.ativo);
$('#m-retrato').onclick = () => abrirRetrato(db.ativo);
$('#ret-fechar').onclick = () => $('#dlg-retrato').close();
$('#ret-remover').onclick = () => definirRetrato('');
$('#ret-usar').onclick = () => { const u = $('#ret-url').value.trim(); if (/^https?:\/\//i.test(u)) definirRetrato(u); else avisar('Cole um endereço que comece com http:// ou https://'); };
$('#ret-arquivo').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => { // reduz para caber no armazenamento do navegador
      const k = Math.min(1, 360 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      definirRetrato(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => avisar('Não foi possível ler esta imagem.');
    img.src = fr.result;
  };
  fr.readAsDataURL(f); e.target.value = '';
};

// ---------- Jornada (página 2 da ficha) ----------
const caixas = (k, n) => `<span class="pontos caixas" data-k="${k}">` + Array.from({ length: n }, (_, i) => `<button type="button" data-v="${i + 1}" aria-label="Fadiga ${i + 1}"></button>`).join('') + '</span>';
const campo = (rot, k, extra = '') => `<label class="campo">${rot}<input data-k="${k}" ${extra}></label>`;
const MAPA = { colunas: 14, linhas: 10, r: 17 };
function montarJornada() {
  const L7 = [0, 1, 2, 3, 4, 5, 6];
  $('#vista-jornada').innerHTML = `
  <header class="topo"><h2 class="titulo-pagina">Jornada</h2></header>
  <div class="jor-cima">
    <section><h3>Registro de Jornada</h3>${campo('Ano', 'j_ano')}${campo('Estação', 'j_estacao')}${campo('Jornada de', 'j_de')}${campo('Destino', 'j_destino')}${campo('Dias de viagem', 'j_dias', 'type="number" min="0"')}</section>
    <section><h3>A Companhia</h3><div class="comp-cab"><span>Nome</span><span>Papel de Jornada</span><span>Fadiga de Viagem</span></div>
      ${L7.map(i => `<div class="comp-linha"><input data-k="c${i}_nome" aria-label="Nome ${i + 1}"><input list="papeis" data-k="c${i}_papel" aria-label="Papel de Jornada ${i + 1}">${caixas('c' + i + '_fad', 10)}</div>`).join('')}
      <datalist id="papeis"><option>Guia</option><option>Batedor</option><option>Caçador</option><option>Vigia</option></datalist></section>
    <section><h3>Pôneis e Cavalos</h3><div class="pon-cab"><span>Nome</span><span>Vigor</span></div>
      ${L7.map(i => `<div class="pon-linha"><input data-k="p${i}_nome" aria-label="Nome do animal ${i + 1}"><input type="number" min="0" data-k="p${i}_vigor" aria-label="Vigor ${i + 1}"></div>`).join('')}</section>
    <section><h3>Diário</h3><textarea data-k="diario" rows="10" aria-label="Diário"></textarea></section>
  </div>
  <div class="jor-baixo">
    <section class="mapa-box"><h3>Caminho da Jornada</h3>
      <p class="nota">Toque num hexágono para marcar: ● percurso, ✕ perigo, ⌂ abrigo; toque de novo para trocar ou limpar.</p>
      <div id="mapa" class="mapa"></div><button type="button" id="mapa-limpar" class="mini">Limpar mapa</button></section>
    <section class="eventos"><h3>Eventos</h3>
      ${[1,2,3,4,5,6].map(n => `<fieldset><legend>Evento ${n}</legend>${campo('Alvo', 'e' + n + '_alvo')}${campo('Evento', 'e' + n + '_evento')}${campo('Resultado', 'e' + n + '_res')}</fieldset>`).join('')}</section>
  </div>`;
}
const MARCAS = ['', '●', '✕', '⌂'];
function renderMapa() {
  const { colunas: C, linhas: R, r } = MAPA, w = Math.sqrt(3) * r, m = state.mapa || {};
  let svg = `<svg viewBox="0 0 ${C * w + w / 2 + 4} ${R * 1.5 * r + r / 2 + 4}" role="group" aria-label="Mapa de hexágonos">`;
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const cx = 2 + w / 2 + x * w + (y % 2 ? w / 2 : 0), cy = 2 + r + y * 1.5 * r;
    const pts = [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 180 * (60 * i - 30); return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1); }).join(' ');
    const v = m[x + '_' + y] || 0;
    svg += `<polygon data-h="${x}_${y}" points="${pts}" class="hex${v ? ' marcado' : ''}"/>` + (v ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" class="hex-t">${MARCAS[v]}</text>` : '');
  }
  $('#mapa').innerHTML = svg + '</svg>';
}
montarJornada(); renderMapa();
$('#vista-jornada').addEventListener('click', (e) => {
  const h = e.target.closest('[data-h]'); if (!h) return;
  state.mapa = state.mapa || {}; const k = h.dataset.h, v = ((state.mapa[k] || 0) + 1) % MARCAS.length;
  if (v) state.mapa[k] = v; else delete state.mapa[k];
  renderMapa(); salvar();
});
$('#mapa-limpar').onclick = () => confirmar('Limpar o mapa?', 'Todas as marcas do Caminho da Jornada serão removidas.', () => { delete state.mapa; renderMapa(); salvar(); }, 'Limpar');
const aplicarOriginal = aplicar;
aplicar = function (i) { aplicarOriginal(i); renderMapa(); };

renderHub(); mostrar('hub'); aplicar(true);
