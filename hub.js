// ============ Hub de fichas, abas, retrato e página de Jornada ============
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VISTAS = { hub: $('#hub'), ficha: $('#vista-ficha'), jornada: $('#vista-jornada'), cenas: $('#vista-cenas') };

function mostrar(v) {
  for (const k in VISTAS) VISTAS[k].hidden = k !== v;
  const hub = v === 'hub';
  document.body.dataset.vista = hub ? 'hub' : 'ficha';
  $('#voltar').hidden = hub; $('#abas').hidden = hub;
  $$('#abas button').forEach(b => { const on = b.dataset.aba === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
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
      <button type="button" class="card-retrato" data-acao="abrir" aria-label="Abrir ${esc(f.nome || 'ficha sem nome')}">${(f.retrato || Arte.heroi(f.cultura)) ? `<img src="${esc(f.retrato || Arte.heroi(f.cultura))}" alt="" onerror="this.replaceWith(document.createTextNode('Imagem indisponível'))">` : '<span>Sem retrato</span>'}</button>
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
$$('#abas button').forEach(b => b.onclick = () => mostrar(b.dataset.aba));

// ---------- retrato ----------
let retratoId = null;
function renderRetrato() {
  const im = $('#retrato-img'), t = $('#retrato span');
  const padrao = !state.retrato && Arte.heroi(state.cultura), fonte = state.retrato || padrao; im.classList.toggle('padrao', !!padrao);
  if (fonte) { im.src = fonte; im.hidden = false; t.hidden = true; } else { im.hidden = true; im.removeAttribute('src'); t.hidden = false; }
}
// o retrato padrão acompanha a cultura escolhida
document.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.k === 'cultura') setTimeout(renderRetrato, 0); });
$('#retrato-img').onerror = () => { $('#retrato-img').hidden = true; $('#retrato span').hidden = false; avisar('Não foi possível carregar a imagem do link.'); };
function abrirRetrato(id) {
  retratoId = id; const r = db.fichas[id]?.retrato || '';
  $('#ret-url').value = r.startsWith('data:') ? '' : r; $('#ret-ajustar').hidden = !r; $('#dlg-retrato').showModal();
}
function definirRetrato(v) {
  const f = db.fichas[retratoId]; if (!f) return;
  if (v) f.retrato = v; else delete f.retrato;
  salvar(); renderRetrato(); renderHub(); $('#dlg-retrato').close();
}
$('#retrato').onclick = () => abrirRetrato(db.ativo);
$('#ret-fechar').onclick = () => $('#dlg-retrato').close();
$('#ret-remover').onclick = () => definirRetrato('');
$('#ret-usar').onclick = () => {
  const u = $('#ret-url').value.trim(); if (!/^https?:\/\//i.test(u)) return avisar('Cole um endereço que comece com http:// ou https://');
  const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { try { document.createElement('canvas').getContext('2d').drawImage(im, 0, 0, 1, 1); enqAbrir(im); } catch { definirRetrato(u); } };
  im.onerror = () => { definirRetrato(u); avisar('Esse site não permite enquadrar a imagem: o link foi usado como está.'); }; im.src = u;
};
// Editor de enquadramento: a imagem final é SEMPRE quadrada (360×360), igual ao que aparece no token da mesa.
const ENQ = { im: null, z: 1, x: 0, y: 0, p: new Map(), d0: 0, tam: 360 };
const enqLim = () => { const cv = $('#enq-cv'), W = cv.width, im = ENQ.im, k = Math.max(W / im.width, W / im.height) * ENQ.z, w = im.width * k, h = im.height * k; return { k, w, h, mx: Math.max(0, (w - W) / 2), my: Math.max(0, (h - W) / 2) }; };
function enqDesenhar(cv = $('#enq-cv'), W = cv.width) {
  const im = ENQ.im; if (!im) return; const k = Math.max(W / im.width, W / im.height) * ENQ.z, w = im.width * k, h = im.height * k, mx = Math.max(0, (w - W) / 2), my = Math.max(0, (h - W) / 2);
  ENQ.x = Math.max(-mx / W, Math.min(mx / W, ENQ.x)); ENQ.y = Math.max(-my / W, Math.min(my / W, ENQ.y));
  const g = cv.getContext('2d'); g.fillStyle = '#d9cbab'; g.fillRect(0, 0, W, W); g.imageSmoothingQuality = 'high'; g.drawImage(im, W / 2 + ENQ.x * W - w / 2, W / 2 + ENQ.y * W - h / 2, w, h);
}
function enqAbrir(im) {
  ENQ.im = im; ENQ.z = 1; ENQ.x = ENQ.y = 0; ENQ.p.clear(); $('#enq-z').value = 1; $('#dlg-retrato').close(); $('#dlg-enq').showModal(); enqDesenhar();
}
function enqZoom(z) { ENQ.z = Math.max(1, Math.min(4, z)); $('#enq-z').value = ENQ.z; enqDesenhar(); }
$('#enq-z').oninput = (e) => enqZoom(+e.target.value);
$('#enq-mais').onclick = () => enqZoom(ENQ.z + 0.25);
$('#enq-menos').onclick = () => enqZoom(ENQ.z - 0.25);
$('#enq-centro').onclick = () => { ENQ.x = ENQ.y = 0; enqZoom(1); };
$('#enq-cancelar').onclick = () => $('#dlg-enq').close();
$('#enq-ok').onclick = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = ENQ.tam; enqDesenhar(cv, ENQ.tam);
  $('#dlg-enq').close(); definirRetrato(cv.toDataURL('image/jpeg', 0.86)); avisar('Retrato atualizado.');
};
const enqCv = $('#enq-cv');
enqCv.addEventListener('pointerdown', (e) => { enqCv.setPointerCapture(e.pointerId); ENQ.p.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ENQ.p.size === 2) { const [a, b] = [...ENQ.p.values()]; ENQ.d0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; ENQ.z0 = ENQ.z; } enqCv.classList.add('arrastando'); });
enqCv.addEventListener('pointermove', (e) => {
  if (!ENQ.p.has(e.pointerId)) return; const o = ENQ.p.get(e.pointerId), n = { x: e.clientX, y: e.clientY }, r = enqCv.getBoundingClientRect(); ENQ.p.set(e.pointerId, n);
  if (ENQ.p.size === 2) { const [a, b] = [...ENQ.p.values()]; enqZoom(ENQ.z0 * Math.hypot(a.x - b.x, a.y - b.y) / ENQ.d0); } else { ENQ.x += (n.x - o.x) / r.width; ENQ.y += (n.y - o.y) / r.height; enqDesenhar(); }
});
const enqFim = (e) => { ENQ.p.delete(e.pointerId); if (!ENQ.p.size) enqCv.classList.remove('arrastando'); };
enqCv.addEventListener('pointerup', enqFim); enqCv.addEventListener('pointercancel', enqFim);
enqCv.addEventListener('wheel', (e) => { e.preventDefault(); enqZoom(ENQ.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
function carregarParaEnq(src, cors) {
  const im = new Image(); if (cors) im.crossOrigin = 'anonymous';
  im.onload = () => enqAbrir(im); im.onerror = () => avisar('Não foi possível ler esta imagem.'); im.src = src;
}
$('#ret-arquivo').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const fr = new FileReader(); fr.onload = () => carregarParaEnq(fr.result); fr.onerror = () => avisar('Não foi possível ler esta imagem.'); fr.readAsDataURL(f); e.target.value = '';
};
$('#ret-ajustar').onclick = () => { const r = db.fichas[retratoId]?.retrato; if (r) carregarParaEnq(r, !r.startsWith('data:')); };

// ---------- Jornada (página 2 da ficha) ----------
const caixas = (k, n) => `<span class="pontos caixas" data-k="${k}">` + Array.from({ length: n }, (_, i) => `<button type="button" data-v="${i + 1}" aria-label="Fadiga ${i + 1}"></button>`).join('') + '</span>';
const campo = (rot, k, extra = '') => `<label class="campo">${rot}<input data-k="${k}" ${extra}></label>`;
function montarJornada() {
  $('#vista-jornada').innerHTML = Jornada.html();
}
montarJornada();

renderHub(); mostrar('hub'); aplicar(true);

// ---------- Tema claro/escuro (claro por padrão; segue só a sua escolha) ----------
(function () {
  const chave = 'um-anel-tema', raiz = document.documentElement, b = $('#tema');
  let atual = 'light';
  try { atual = localStorage.getItem(chave) === 'dark' ? 'dark' : 'light'; } catch {}
  const pintar = () => { raiz.dataset.theme = atual; const t = atual === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'; b.setAttribute('aria-pressed', String(atual === 'dark')); b.setAttribute('aria-label', t); b.title = t; };
  b.onclick = () => { atual = atual === 'dark' ? 'light' : 'dark'; raiz.classList.add('tema-anim'); pintar(); try { localStorage.setItem(chave, atual); } catch {} clearTimeout(b._t); b._t = setTimeout(() => raiz.classList.remove('tema-anim'), 500); };
  pintar();
})();
