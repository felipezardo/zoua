// ============ Visor de cena: fundo (mapa ou imagem) com zoom e arrasto, e tokens por cima ============
// Usado pelo Historiador (modo de edição: arrasta os tokens) e pelos jogadores (somente leitura).
(() => {
  const MAPAS = { jogadores: 'assets/eriador.webp', historiador: 'assets/eriador-historiador.webp' };
  const MAPA_W = 5112, MAPA_H = 3304;
  const G = { w: 87.444, R: 50.436, h: 76.151, ox: 102.406, oy: 17.062 }; // mesma malha de hexágonos do Caminho da Jornada
  const centroHex = (c, r) => [G.ox + G.w * (c + 0.5 * (r & 1)), G.oy + G.h * r];
  function hexEm(x, y) {
    const r0 = Math.round((y - G.oy) / G.h); let m = null, md = 9;
    for (let r = r0 - 1; r <= r0 + 1; r++) { const c0 = Math.round((x - G.ox) / G.w - 0.5 * (r & 1)); for (let c = c0 - 1; c <= c0 + 1; c++) { const [cx, cy] = centroHex(c, r), dx = Math.abs(x - cx), dy = Math.abs(y - cy), d = Math.max(dx / (G.w / 2), (dy + dx * G.R / G.w) / G.R); if (d < md) { md = d; m = [c, r]; } } }
    return m;
  }
  const imagens = new Map();
  function imagem(src, aoCarregar) {
    if (!src) return null; let e = imagens.get(src);
    if (!e) { e = { img: new Image(), ok: false }; e.img.onload = () => { e.ok = true; (e.cbs || []).forEach((f) => f()); }; e.img.onerror = () => { e.erro = true; }; e.img.src = src; imagens.set(src, e); }
    if (!e.ok && aoCarregar) (e.cbs = e.cbs || []).push(aoCarregar);
    return e.ok ? e.img : null;
  }
  const corPct = (p) => (p > 60 ? '#3f9a45' : p > 30 ? '#c9902a' : '#b3322c');
  const iniciais = (n) => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

  window.criarVisor = function (raiz, opc = {}) {
    raiz.classList.add('visor'); raiz.innerHTML = '<canvas tabindex="0" role="img" aria-label="Cena com mapa ou imagem e tokens. Arraste para mover, use dois dedos ou a roda do mouse para o zoom."></canvas><div class="visor-msg" hidden></div>';
    const cv = raiz.querySelector('canvas'), ctx = cv.getContext('2d'), msg = raiz.querySelector('.visor-msg');
    let vw = 0, vh = 0, dpr = 1, k = 0.1, tx = 0, ty = 0, fundo = null, tokens = [], sel = null, quadro = 0, iniciado = false, vistaPendente = null;
    const V = { opc };
    const dims = () => (fundo ? [fundo.w, fundo.h] : [1000, 700]);
    const kMin = () => { const [w, h] = dims(); return Math.min(vw / w, vh / h) || 0.1; };
    const kMax = () => Math.max(1.6, kMin() * 8);
    function limitar() { const [w, h] = dims(); k = Math.min(kMax(), Math.max(kMin(), k)); const a = w * k, b = h * k; tx = a <= vw ? (vw - a) / 2 : Math.min(0, Math.max(vw - a, tx)); ty = b <= vh ? (vh - b) / 2 : Math.min(0, Math.max(vh - b, ty)); }
    const tamBase = () => (fundo && fundo.tipo === 'mapa' ? 96 : Math.max(40, dims()[0] / 18));
    const raioTk = (t) => Math.max(9, (tamBase() * (t.esc || 1) * k) / 2);
    function desenhar() {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        if (!vw) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#d9cbab'; ctx.fillRect(0, 0, vw, vh);
        if (fundo) { const src = fundo.tipo === 'mapa' ? MAPAS[fundo.modo] || MAPAS.jogadores : fundo.src; const im = imagem(src, desenhar); if (im) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, tx, ty, fundo.w * k, fundo.h * k); } }
        msg.hidden = !!fundo; if (!fundo) msg.textContent = opc.vazio || 'Nenhuma cena em exibição.';
        const ordem = tokens.slice().sort((a, b) => (a.id === sel) - (b.id === sel));
        for (const t of ordem) desenharToken(t);
      });
    }
    function desenharToken(t) {
      const x = t.x * k + tx, y = t.y * k + ty, r = raioTk(t); if (x < -r - 60 || y < -r - 60 || x > vw + r + 60 || y > vh + r + 60) return;
      const lw = Math.max(3, r * 0.17); ctx.save(); if (t.fora) ctx.globalAlpha = 0.5; if (t.oculto) ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(30,20,12,.35)'; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - lw * 0.6, 0, Math.PI * 2); ctx.clip();
      const im = imagem(t.img, desenhar);
      if (im) { const s = Math.max((2 * r) / im.width, (2 * r) / im.height); ctx.drawImage(im, x - (im.width * s) / 2, y - (im.height * s) / 2, im.width * s, im.height * s); }
      else { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#c9a98a'); g.addColorStop(1, t.cor || '#5a4a3a'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.fillStyle = '#fff8e8'; ctx.font = `700 ${r * 0.8}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(iniciais(t.nome), x, y + r * 0.04); }
      ctx.restore();
      ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r - lw / 2, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
      if (t.pct != null) { ctx.beginPath(); ctx.arc(x, y, r - lw / 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.max(0, Math.min(100, t.pct))) / 100); ctx.strokeStyle = corPct(t.pct); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(x, y, r - lw / 2, 0, Math.PI * 2); ctx.strokeStyle = t.cor || '#5a4a3a'; ctx.stroke(); }
      if (t.id === sel) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff3c2'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#b3322c'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      (t.badges || []).slice(0, 3).forEach((b, i) => { const bx = x + r * 0.78, by = y - r * 0.55 + i * 15; ctx.fillStyle = '#b3322c'; ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 9px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b, bx, by + 0.5); });
      ctx.restore();
      if (r >= 12) { ctx.font = `600 ${Math.max(11, Math.min(15, r * 0.5))}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; const txt = t.nome + (t.fora ? ' (fora)' : ''), w = ctx.measureText(txt).width + 10, ly = y + r + 4; ctx.fillStyle = 'rgba(30,20,12,.78)'; ctx.beginPath(); ctx.roundRect(x - w / 2, ly, w, 18, 6); ctx.fill(); ctx.fillStyle = '#fff3d6'; ctx.fillText(txt, x, ly + 2); }
    }
    // ---------- coordenadas e vista ----------
    const paraImg = (sx, sy) => [(sx - tx) / k, (sy - ty) / k];
    V.vista = () => ({ cx: Math.round((vw / 2 - tx) / k), cy: Math.round((vh / 2 - ty) / k), larg: Math.round(vw / k) });
    V.irPara = (vista) => { if (!vista) return; if (!vw) { vistaPendente = vista; return; } k = vw / Math.max(50, vista.larg); tx = vw / 2 - vista.cx * k; ty = vh / 2 - vista.cy * k; limitar(); desenhar(); };
    V.ajustar = () => { k = kMin(); tx = ty = 0; limitar(); desenhar(); };
    V.centro = () => { const v = V.vista(); return [v.cx, v.cy]; };
    V.definirFundo = (f) => {
      const nova = f ? (f.tipo === 'mapa' ? { tipo: 'mapa', modo: f.modo, w: MAPA_W, h: MAPA_H } : f) : null;
      const ch = (x) => (!x ? '' : x.tipo === 'mapa' ? 'mapa' : 'img:' + (x.src || '').length + ':' + x.w + ':' + x.h), trocou = ch(nova) !== ch(fundo);
      fundo = nova; if (trocou) { iniciado = false; ajustarTamanho(); } desenhar();
    };
    V.definirTokens = (l) => { tokens = l.map((t) => { const n = { ...t }; if (arrasto && n.id === arrasto.id) { const o = tokens.find((q) => q.id === n.id); if (o) { n.x = o.x; n.y = o.y; } } return n; }); desenhar(); };
    V.selecionar = (id) => { sel = id; desenhar(); };
    V.selecionado = () => sel;
    V.telaDe = (x, y) => [x * k + tx, y * k + ty];
    V.token = (id) => tokens.find((t) => t.id === id);
    V.redesenhar = desenhar;
    V.zoom = (f) => { zoomEm(vw / 2, vh / 2, k * f); };
    function zoomEm(sx, sy, nk) { nk = Math.min(kMax(), Math.max(kMin(), nk)); tx = sx - (sx - tx) * nk / k; ty = sy - (sy - ty) * nk / k; k = nk; limitar(); desenhar(); opc.aoVista && opc.aoVista(V.vista()); }
    function ajustarTamanho() {
      const r = raiz.getBoundingClientRect(); if (!r.width || !r.height) return; dpr = Math.min(devicePixelRatio || 1, 2); vw = Math.round(r.width); vh = Math.round(r.height);
      cv.width = vw * dpr; cv.height = vh * dpr; cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
      if (!iniciado) { iniciado = true; if (vistaPendente) { const v = vistaPendente; vistaPendente = null; V.irPara(v); } else { k = kMin(); tx = ty = 0; limitar(); } } else limitar(); desenhar();
    }
    new ResizeObserver(ajustarTamanho).observe(raiz);
    // ---------- interação ----------
    const ponteiros = new Map(); let toque = null, pinca = null, arrasto = null, ultimoToque = { id: null, t: 0 };
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const acharToken = (sx, sy) => { for (let i = tokens.length - 1; i >= 0; i--) { const t = tokens[i], r = raioTk(t), dx = sx - (t.x * k + tx), dy = sy - (t.y * k + ty); if (dx * dx + dy * dy <= r * r) return t; } return null; };
    cv.addEventListener('pointerdown', (e) => {
      try { cv.setPointerCapture(e.pointerId); } catch {} const [x, y] = pos(e); ponteiros.set(e.pointerId, { x, y });
      if (ponteiros.size === 1) { const t = acharToken(x, y); toque = { x, y, t0: performance.now(), moveu: false, tx0: tx, ty0: ty, token: t }; if (t && opc.editavel) { arrasto = { id: t.id, dx: t.x - (x - tx) / k, dy: t.y - (y - ty) / k }; } }
      else { toque && (toque.moveu = true); arrasto = null; const [a, b] = [...ponteiros.values()]; pinca = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k0: k }; }
      cv.classList.add('arrastando');
    });
    cv.addEventListener('pointermove', (e) => {
      if (!ponteiros.has(e.pointerId)) return; const [x, y] = pos(e); ponteiros.set(e.pointerId, { x, y });
      if (ponteiros.size === 2 && pinca) { const [a, b] = [...ponteiros.values()]; zoomEm((a.x + b.x) / 2, (a.y + b.y) / 2, pinca.k0 * Math.hypot(a.x - b.x, a.y - b.y) / pinca.d); }
      else if (ponteiros.size === 1 && toque) {
        if (!toque.moveu && Math.hypot(x - toque.x, y - toque.y) > 6) toque.moveu = true;
        if (toque.moveu) { if (arrasto) { const t = tokens.find((q) => q.id === arrasto.id); if (t) { const [ix, iy] = paraImg(x, y); const [w, h] = dims(); t.x = Math.max(0, Math.min(w, ix + arrasto.dx)); t.y = Math.max(0, Math.min(h, iy + arrasto.dy)); desenhar(); } } else { tx = toque.tx0 + (x - toque.x); ty = toque.ty0 + (y - toque.y); limitar(); desenhar(); opc.aoVista && opc.aoVista(V.vista()); } }
      }
    });
    const fim = (e) => {
      const era = ponteiros.size; ponteiros.delete(e.pointerId);
      if (era === 1 && toque) {
        if (arrasto && toque.moveu) { const t = tokens.find((q) => q.id === arrasto.id); if (t) { if (opc.encaixar && opc.encaixar() && fundo && fundo.tipo === 'mapa') { const h = hexEm(t.x, t.y); if (h) { [t.x, t.y] = centroHex(...h); } } desenhar(); opc.aoMover && opc.aoMover(t.id, Math.round(t.x), Math.round(t.y), true); } }
        else if (!toque.moveu && performance.now() - toque.t0 < 700 && e.type === 'pointerup') {
          const t = toque.token; sel = t ? t.id : null; desenhar(); opc.aoSelecionar && opc.aoSelecionar(t ? t.id : null);
          if (t) { const agora = performance.now(); if (ultimoToque.id === t.id && agora - ultimoToque.t < 450) { opc.aoAbrir && opc.aoAbrir(t.id); ultimoToque = { id: null, t: 0 }; } else ultimoToque = { id: t.id, t: agora }; }
        }
      }
      if (!ponteiros.size) { toque = null; pinca = null; arrasto = null; cv.classList.remove('arrastando'); } else if (ponteiros.size === 1) { const [p] = [...ponteiros.values()]; toque = { x: p.x, y: p.y, t0: 0, moveu: true, tx0: tx, ty0: ty, token: null }; pinca = null; }
    };
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = pos(e); zoomEm(x, y, k * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    cv.addEventListener('keydown', (e) => { const p = 80, m = { ArrowLeft: [p, 0], ArrowRight: [-p, 0], ArrowUp: [0, p], ArrowDown: [0, -p] }; if (m[e.key]) { e.preventDefault(); tx += m[e.key][0]; ty += m[e.key][1]; limitar(); desenhar(); opc.aoVista && opc.aoVista(V.vista()); } else if (e.key === '+' || e.key === '=') zoomEm(vw / 2, vh / 2, k * 1.25); else if (e.key === '-') zoomEm(vw / 2, vh / 2, k / 1.25); });
    return V;
  };
})();
