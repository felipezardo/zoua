// ============ Mapa de Eriador: zoom, arrasto e marcação de hexágonos ============
// A malha desenhada no mapa original foi medida e refeita aqui em código. Todas as medidas
// abaixo estão em pixels da imagem ORIGINAL (5112 x 3304), então o arquivo pode ser trocado por
// uma versão menor ou maior da mesma imagem sem desalinhar nada.
(() => {
  const MAPA_SRC = 'assets/eriador.webp';
  const IMG_W = 5112, IMG_H = 3304;
  const G = { w: 87.444, R: 50.436, h: 76.151, ox: 102.406, oy: 17.062 }; // hexágonos "pointy-top", linhas ímpares deslocadas
  const MARCAS = { 1: { nome: 'Percurso', glifo: '●', cor: '179,50,44' }, 2: { nome: 'Perigo', glifo: '✕', cor: '40,28,20' }, 3: { nome: 'Abrigo', glifo: '⌂', cor: '44,107,47' } };
  const K_MAX = 1.6;

  const centro = (c, r) => [G.ox + G.w * (c + 0.5 * (r & 1)), G.oy + G.h * r];
  const valida = (c, r) => { const [x, y] = centro(c, r); return x > 30 && x < IMG_W - 30 && y > 30 && y < IMG_H - 30; };
  function celulaEm(x, y) { // hexágono que contém o ponto (x, y) da imagem
    const r0 = Math.round((y - G.oy) / G.h); let melhor = null, md = 9;
    for (let r = r0 - 1; r <= r0 + 1; r++) {
      const c0 = Math.round((x - G.ox) / G.w - 0.5 * (r & 1));
      for (let c = c0 - 1; c <= c0 + 1; c++) {
        const [cx, cy] = centro(c, r), dx = Math.abs(x - cx), dy = Math.abs(y - cy);
        const d = Math.max(dx / (G.w / 2), (dy + dx * G.R / G.w) / G.R);
        if (d < md) { md = d; melhor = [c, r]; }
      }
    }
    return melhor && md <= 1.03 && valida(...melhor) ? melhor : null;
  }
  const vertices = (c, r) => { const [cx, cy] = centro(c, r); return [[0, -G.R], [G.w / 2, -G.R / 2], [G.w / 2, G.R / 2], [0, G.R], [-G.w / 2, G.R / 2], [-G.w / 2, -G.R / 2]].map(([dx, dy]) => [cx + dx, cy + dy]); };

  // ---------- interface ----------
  const raiz = document.getElementById('mapa-app'); if (!raiz) return;
  raiz.innerHTML = `
    <div class="mapa-barra" role="toolbar" aria-label="Ferramentas do mapa">
      <div class="mapa-grupo" role="radiogroup" aria-label="Marca a aplicar">
        ${[1, 2, 3].map(i => `<button type="button" data-ferr="${i}" role="radio" aria-checked="${i === 1}"><span aria-hidden="true">${MARCAS[i].glifo}</span> ${MARCAS[i].nome}</button>`).join('')}
        <button type="button" data-ferr="0" role="radio" aria-checked="false">Apagar</button>
      </div>
      <div class="mapa-grupo">
        <button type="button" id="mapa-menos" aria-label="Diminuir zoom">−</button>
        <button type="button" id="mapa-mais" aria-label="Aumentar zoom">+</button>
        <button type="button" id="mapa-ajustar">Ajustar</button>
        <button type="button" id="mapa-malha" aria-pressed="false">Malha</button>
        <button type="button" id="mapa-limpar">Limpar</button>
      </div>
    </div>
    <div class="mapa-area" id="mapa-area">
      <canvas id="mapa-canvas" tabindex="0" role="img" aria-label="Mapa de Eriador com hexágonos. Arraste para mover, use dois dedos ou os botões para o zoom, e toque num hexágono para marcar. Setas movem o mapa; mais e menos dão zoom."></canvas>
      <div class="mapa-aviso" id="mapa-aviso">Carregando o mapa…</div>
    </div>
    <p class="nota" id="mapa-contagem" aria-live="polite"></p>
    <p class="nota">Arraste para mover e use dois dedos (ou os botões + e −) para o zoom. Escolha uma marca e toque num hexágono; tocar de novo com a mesma marca remove.</p>`;

  const area = document.getElementById('mapa-area'), cv = document.getElementById('mapa-canvas'), ctx = cv.getContext('2d');
  let vw = 0, vh = 0, dpr = 1, k = 0.1, tx = 0, ty = 0, iniciado = false, ferr = 1, malha = false, hover = null, sel = null, quadro = 0;
  const img = new Image(); let imgOk = false;
  img.onload = () => { imgOk = true; document.getElementById('mapa-aviso').hidden = true; desenhar(); };
  img.onerror = () => { malha = true; document.getElementById('mapa-malha').setAttribute('aria-pressed', 'true'); const a = document.getElementById('mapa-aviso'); a.hidden = false; a.textContent = 'Imagem do mapa não encontrada (assets/eriador.webp). A malha continua funcionando.'; desenhar(); };
  img.src = MAPA_SRC;

  const kMin = () => Math.min(vw / IMG_W, vh / IMG_H);
  function limitar() {
    k = Math.min(K_MAX, Math.max(kMin(), k));
    const w = IMG_W * k, h = IMG_H * k;
    tx = w <= vw ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, tx));
    ty = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, ty));
  }
  function ajustar() { k = kMin(); tx = ty = 0; limitar(); desenhar(); guardarVista(); }
  function zoomEm(sx, sy, novoK) {
    novoK = Math.min(K_MAX, Math.max(kMin(), novoK));
    tx = sx - (sx - tx) * novoK / k; ty = sy - (sy - ty) * novoK / k; k = novoK; limitar(); desenhar();
  }
  const marcas = () => (state.mapa_eriador = state.mapa_eriador || {});
  let tVista; function guardarVista() { clearTimeout(tVista); tVista = setTimeout(() => { state.mapa_vista = [+k.toFixed(4), Math.round((vw / 2 - tx) / k), Math.round((vh / 2 - ty) / k)]; salvar(); }, 500); }
  function carregarVista() {
    const v = state.mapa_vista;
    if (Array.isArray(v) && vw) { k = v[0]; tx = vw / 2 - v[1] * k; ty = vh / 2 - v[2] * k; limitar(); } else if (vw) { k = kMin(); tx = ty = 0; limitar(); }
  }

  // ---------- desenho ----------
  function caminho(c, r) { const v = vertices(c, r); ctx.beginPath(); v.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
  function desenhar() {
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(() => {
      if (!vw) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#d9cbab'; ctx.fillRect(0, 0, vw, vh);
      ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k);
      if (imgOk) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, IMG_W, IMG_H); }
      if (malha) { // desenha só os hexágonos visíveis
        const x0 = -tx / k, y0 = -ty / k, x1 = (vw - tx) / k, y1 = (vh - ty) / k;
        const r0 = Math.floor((y0 - G.oy) / G.h) - 1, r1 = Math.ceil((y1 - G.oy) / G.h) + 1;
        ctx.lineWidth = 1.5 / k; ctx.strokeStyle = 'rgba(0,150,200,.75)';
        for (let r = r0; r <= r1; r++) { const c0 = Math.floor((x0 - G.ox) / G.w) - 1, c1 = Math.ceil((x1 - G.ox) / G.w) + 1; for (let c = c0; c <= c1; c++) if (valida(c, r)) { caminho(c, r); ctx.stroke(); } }
      }
      const m = marcas();
      for (const key in m) {
        const [c, r] = key.split('_').map(Number), t = MARCAS[m[key]]; if (!t) continue;
        caminho(c, r); ctx.fillStyle = `rgba(${t.cor},.38)`; ctx.fill(); ctx.lineWidth = 3 / k; ctx.strokeStyle = `rgba(${t.cor},.95)`; ctx.stroke();
        const [cx, cy] = centro(c, r); ctx.fillStyle = `rgb(${t.cor})`; ctx.font = `700 ${G.R * 0.95}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t.glifo, cx, cy + G.R * 0.05);
      }
      for (const alvo of [hover, sel]) if (alvo) { caminho(...alvo); ctx.lineWidth = 3.5 / k; ctx.strokeStyle = alvo === sel ? '#b3322c' : 'rgba(42,28,20,.8)'; ctx.stroke(); }
      ctx.restore();
    });
  }
  function contar() {
    const m = marcas(), n = { 1: 0, 2: 0, 3: 0 }; for (const key in m) if (n[m[key]] !== undefined) n[m[key]]++;
    const pl = (v) => `${v} hexágono${v === 1 ? '' : 's'}`;
    document.getElementById('mapa-contagem').textContent = `Percurso: ${pl(n[1])}. Perigo: ${pl(n[2])}. Abrigo: ${pl(n[3])}.`;
  }
  window.renderMapa = () => { iniciado = false; ajustarTamanho(); contar(); };
  function ajustarTamanho() {
    const r = area.getBoundingClientRect(); if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2); vw = Math.round(r.width); vh = Math.round(r.height);
    cv.width = vw * dpr; cv.height = vh * dpr; cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    if (!iniciado) { iniciado = true; carregarVista(); } else limitar();
    desenhar();
  }
  new ResizeObserver(ajustarTamanho).observe(area);

  // ---------- interação ----------
  const ponteiros = new Map(); let toque = null, pinca = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const paraImg = (sx, sy) => [(sx - tx) / k, (sy - ty) / k];
  function aplicarFerramenta(cel) {
    const m = marcas(), key = cel.join('_');
    if (ferr === 0 || m[key] === ferr) delete m[key]; else m[key] = ferr;
    sel = cel; contar(); desenhar(); salvar();
  }
  cv.addEventListener('pointerdown', (e) => {
    try { cv.setPointerCapture(e.pointerId); } catch {} const [x, y] = pos(e); ponteiros.set(e.pointerId, { x, y });
    if (ponteiros.size === 1) toque = { x, y, t: performance.now(), moveu: false, tx0: tx, ty0: ty };
    else { toque && (toque.moveu = true); const [a, b] = [...ponteiros.values()]; pinca = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k0: k }; }
    cv.classList.add('arrastando');
  });
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e);
    if (!ponteiros.has(e.pointerId)) { if (e.pointerType === 'mouse') { const c = celulaEm(...paraImg(x, y)); if (String(c) !== String(hover)) { hover = c; desenhar(); } } return; }
    ponteiros.set(e.pointerId, { x, y });
    if (ponteiros.size === 2 && pinca) {
      const [a, b] = [...ponteiros.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomEm((a.x + b.x) / 2, (a.y + b.y) / 2, pinca.k0 * d / pinca.d);
    } else if (ponteiros.size === 1 && toque) {
      const dx = x - toque.x, dy = y - toque.y;
      if (!toque.moveu && Math.hypot(dx, dy) > 8) toque.moveu = true;
      if (toque.moveu) { tx = toque.tx0 + dx; ty = toque.ty0 + dy; limitar(); desenhar(); }
    }
  });
  const fim = (e) => {
    const era = ponteiros.size; ponteiros.delete(e.pointerId);
    if (era === 1 && toque && !toque.moveu && performance.now() - toque.t < 700 && e.type === 'pointerup') { const cel = celulaEm(...paraImg(toque.x, toque.y)); if (cel) aplicarFerramenta(cel); }
    if (ponteiros.size === 0) { toque = null; pinca = null; cv.classList.remove('arrastando'); guardarVista(); }
    else if (ponteiros.size === 1) { const [p] = [...ponteiros.values()]; toque = { x: p.x, y: p.y, t: 0, moveu: true, tx0: tx, ty0: ty }; pinca = null; }
  };
  cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && hover) { hover = null; desenhar(); } });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = pos(e); zoomEm(x, y, k * Math.exp(-e.deltaY * 0.0015)); guardarVista(); }, { passive: false });
  cv.addEventListener('keydown', (e) => {
    const passo = 80, mapa = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] };
    if (mapa[e.key]) { e.preventDefault(); tx += mapa[e.key][0]; ty += mapa[e.key][1]; limitar(); desenhar(); guardarVista(); }
    else if (e.key === '+' || e.key === '=') { zoomEm(vw / 2, vh / 2, k * 1.25); guardarVista(); }
    else if (e.key === '-') { zoomEm(vw / 2, vh / 2, k / 1.25); guardarVista(); }
  });
  raiz.addEventListener('click', (e) => {
    const f = e.target.closest('[data-ferr]');
    if (f) { ferr = +f.dataset.ferr; raiz.querySelectorAll('[data-ferr]').forEach(b => b.setAttribute('aria-checked', String(b === f))); return; }
    const id = e.target.closest('button')?.id;
    if (id === 'mapa-mais') { zoomEm(vw / 2, vh / 2, k * 1.4); guardarVista(); }
    else if (id === 'mapa-menos') { zoomEm(vw / 2, vh / 2, k / 1.4); guardarVista(); }
    else if (id === 'mapa-ajustar') ajustar();
    else if (id === 'mapa-malha') { malha = !malha; e.target.closest('button').setAttribute('aria-pressed', String(malha)); desenhar(); }
    else if (id === 'mapa-limpar') confirmar('Limpar o mapa?', 'Todas as marcas do Caminho da Jornada serão removidas.', () => { state.mapa_eriador = {}; sel = null; contar(); desenhar(); salvar(); }, 'Limpar');
  });

  const aplicarAnterior = aplicar;
  aplicar = function (i) { aplicarAnterior(i); window.renderMapa(); };
  window.renderMapa();
})();
