// ============ Hub de fichas, abas, retrato com recorte quadrado (1:1) e página de Jornada ============
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VISTAS = { hub: $('#hub'), ficha: $('#vista-ficha'), jornada: $('#vista-jornada'), cenas: $('#vista-cenas') };

function mostrar(v) {
  for (const k in VISTAS) VISTAS[k].hidden = k !== v;
  const hub = v === 'hub';
  document.body.dataset.vista = hub ? 'hub' : 'ficha';
  $('#voltar').hidden = hub; $('#abas').hidden = hub;
  $$('#abas button').forEach(b => { const on = b.dataset.aba === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  if (v === 'jornada' && window.renderMapa) requestAnimationFrame(() => window.renderMapa());
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
$$('#abas button').forEach(b => b.onclick = () => mostrar(b.dataset.aba));

// ---------- Retrato com Seletor de Recorte Quadrado (1:1) ----------
let retratoId = null, cropImg = null, cropZoom = 1, cropOx = 0, cropOy = 0;

function renderRetrato() {
  const im = $('#retrato-img'), t = $('#retrato span');
  if (state.retrato) { im.src = state.retrato; im.hidden = false; t.hidden = true; } else { im.hidden = true; im.removeAttribute('src'); t.hidden = false; }
}
$('#retrato-img').onerror = () => { $('#retrato-img').hidden = true; $('#retrato span').hidden = false; avisar('Não foi possível carregar a imagem do link.'); };

function desenharCropQuadrado() {
  const cv = $('#ret-canvas'), tk = $('#ret-token-prev');
  if (!cv || !cropImg) return;
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height; // 360x360
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#241b13';
  ctx.fillRect(0, 0, W, H);

  const baseScale = Math.max(W / cropImg.width, H / cropImg.height);
  const scale = baseScale * cropZoom;
  const dw = cropImg.width * scale, dh = cropImg.height * scale;
  const maxOx = Math.max(0, (dw - W) / 2), maxOy = Math.max(0, (dh - H) / 2);
  cropOx = Math.max(-maxOx, Math.min(maxOx, cropOx));
  cropOy = Math.max(-maxOy, Math.min(maxOy, cropOy));

  const dx = (W - dw) / 2 + cropOx, dy = (H - dh) / 2 + cropOy;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cropImg, dx, dy, dw, dh);

  if (tk) {
    const tctx = tk.getContext('2d'), tw = tk.width, th = tk.height;
    tctx.clearRect(0, 0, tw, th);
    tctx.save();
    tctx.beginPath();
    tctx.arc(tw / 2, th / 2, tw / 2 - 4, 0, Math.PI * 2);
    tctx.clip();
    tctx.drawImage(cv, 0, 0, tw, th);
    tctx.restore();
    tctx.lineWidth = 4;
    tctx.strokeStyle = '#b3322c';
    tctx.beginPath();
    tctx.arc(tw / 2, th / 2, tw / 2 - 4, 0, Math.PI * 2);
    tctx.stroke();
  }
}

function gravarRecorteAtual(fecharModal) {
  const f = db.fichas[retratoId];
  if (!f) return;
  if (cropImg) {
    desenharCropQuadrado();
    const cv = $('#ret-canvas');
    try {
      f.retrato = cv.toDataURL('image/jpeg', 0.85);
    } catch {}
  }
  salvar();
  renderRetrato();
  renderHub();
  if (fecharModal) $('#dlg-retrato').close();
}

function iniciarImagemNoCrop(src) {
  const box = $('#ret-crop-box'), z = $('#ret-zoom');
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    cropImg = img;
    cropZoom = 1;
    cropOx = 0;
    cropOy = 0;
    if (z) z.value = '1';
    if (box) box.hidden = false;
    gravarRecorteAtual(false);
  };
  img.onerror = () => avisar('Não foi possível ler esta imagem.');
  img.src = src;
}

function abrirRetrato(id) {
  retratoId = id;
  const r = db.fichas[id]?.retrato || '';
  $('#ret-url').value = r.startsWith('data:') ? '' : r;
  const box = $('#ret-crop-box');
  if (r) iniciarImagemNoCrop(r);
  else { cropImg = null; if (box) box.hidden = true; }
  $('#dlg-retrato').showModal();
}

function definirRetrato(v) {
  const f = db.fichas[retratoId]; if (!f) return;
  if (v) f.retrato = v; else delete f.retrato;
  salvar(); renderRetrato(); renderHub(); $('#dlg-retrato').close();
}

$('#retrato').onclick = () => abrirRetrato(db.ativo);
$('#ret-fechar').onclick = () => $('#dlg-retrato').close();
$('#ret-remover').onclick = () => { cropImg = null; definirRetrato(''); };
$('#ret-usar').onclick = () => {
  const u = $('#ret-url').value.trim();
  if (u && /^https?:\/\//i.test(u)) definirRetrato(u);
  else if (cropImg) gravarRecorteAtual(true);
  else avisar('Escolha uma imagem do computador ou cole um endereço que comece com http:// ou https://');
};
$('#ret-salvar-crop')?.addEventListener('click', () => gravarRecorteAtual(true));
$('#ret-centralizar')?.addEventListener('click', () => {
  if (!cropImg) return;
  cropZoom = 1; cropOx = 0; cropOy = 0;
  if ($('#ret-zoom')) $('#ret-zoom').value = '1';
  gravarRecorteAtual(false);
});
$('#ret-zoom')?.addEventListener('input', (e) => {
  if (!cropImg) return;
  cropZoom = parseFloat(e.target.value) || 1;
  gravarRecorteAtual(false);
});

(() => {
  const cv = $('#ret-canvas');
  if (!cv) return;
  let arrastando = false, ix = 0, iy = 0, iox = 0, ioy = 0;
  cv.addEventListener('pointerdown', (e) => {
    if (!cropImg) return;
    arrastando = true; ix = e.clientX; iy = e.clientY; iox = cropOx; ioy = cropOy;
    try { cv.setPointerCapture(e.pointerId); } catch {}
  });
  cv.addEventListener('pointermove', (e) => {
    if (!arrastando || !cropImg) return;
    const rect = cv.getBoundingClientRect();
    const fator = cv.width / (rect.width || cv.width);
    cropOx = iox + (e.clientX - ix) * fator;
    cropOy = ioy + (e.clientY - iy) * fator;
    desenharCropQuadrado();
  });
  const soltar = () => {
    if (!arrastando) return;
    arrastando = false;
    gravarRecorteAtual(false);
  };
  cv.addEventListener('pointerup', soltar);
  cv.addEventListener('pointercancel', soltar);
  cv.addEventListener('wheel', (e) => {
    if (!cropImg) return;
    e.preventDefault();
    cropZoom = Math.max(1, Math.min(3.5, cropZoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    if ($('#ret-zoom')) $('#ret-zoom').value = String(cropZoom.toFixed(2));
    gravarRecorteAtual(false);
  }, { passive: false });
})();

$('#ret-arquivo').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => iniciarImagemNoCrop(fr.result);
  fr.readAsDataURL(f); e.target.value = '';
};

// ---------- Jornada (página 2 da ficha) ----------
function montarJornada() {
  if (typeof htmlJornada === 'function') {
    $('#vista-jornada').innerHTML = htmlJornada();
    return;
  }
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
