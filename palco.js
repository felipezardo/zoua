// ============ Palco da cena: zoom, tela cheia e tamanho ajustável (altura e largura) ============
(() => {
  const LS = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
  const entre = (v, a, b) => Math.max(a, Math.min(b, v));
  function ligar(el, V, { chave, grade }) {
    if (!el || el.dataset.palco) return; el.dataset.palco = '1';
    el.insertAdjacentHTML('beforeend', `<div class="visor-zoom" role="group" aria-label="Zoom e tela da cena"><button type="button" data-z="mais" title="Aproximar" aria-label="Aproximar">+</button><button type="button" data-z="menos" title="Afastar" aria-label="Afastar">−</button><button type="button" data-z="ajustar" title="Ajustar a cena à tela">Ajustar</button><button type="button" data-z="tela" title="Tela cheia (Esc para sair)">Tela cheia</button></div>`);
    el.querySelector('.visor-zoom').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const z = b.dataset.z;
      if (z === 'mais') V.zoom(1.3); else if (z === 'menos') V.zoom(1 / 1.3); else if (z === 'ajustar') V.ajustar();
      else if (z === 'tela') { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); }
    });
    // altura: alça sob a cena
    const hKey = 'um-anel-palco-h-' + chave, salvo = +LS.get(hKey); if (salvo) el.style.height = entre(salvo, 220, innerHeight * 0.95) + 'px';
    const alca = document.createElement('div'); alca.className = 'palco-alca'; alca.tabIndex = 0; alca.setAttribute('role', 'separator'); alca.setAttribute('aria-orientation', 'horizontal'); alca.setAttribute('aria-label', 'Altura da cena'); alca.title = 'Arraste para mudar a altura da cena (duplo clique restaura)';
    el.after(alca);
    const alt = (h) => { el.style.height = entre(h, 220, innerHeight * 0.95) + 'px'; };
    let a0 = null;
    alca.addEventListener('pointerdown', (e) => { a0 = { y: e.clientY, h: el.offsetHeight }; try { alca.setPointerCapture(e.pointerId); } catch {} alca.classList.add('arrastando'); });
    alca.addEventListener('pointermove', (e) => { if (a0) alt(a0.h + e.clientY - a0.y); });
    const fimA = () => { if (!a0) return; a0 = null; alca.classList.remove('arrastando'); LS.set(hKey, String(el.offsetHeight)); };
    alca.addEventListener('pointerup', fimA); alca.addEventListener('pointercancel', fimA);
    alca.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); alt(el.offsetHeight + (e.key === 'ArrowDown' ? 40 : -40)); LS.set(hKey, String(el.offsetHeight)); } });
    alca.addEventListener('dblclick', () => { el.style.height = ''; LS.set(hKey, null); });
    // largura: divisória entre a cena e a coluna ao lado (telas largas)
    if (grade) {
      const wKey = 'um-anel-palco-w-' + chave, lado = grade.querySelector('.cena-lado'), palco = grade.querySelector('.cena-palco'); if (!lado || !palco) return;
      const div = document.createElement('div'); div.className = 'palco-divisor'; div.tabIndex = 0; div.setAttribute('role', 'separator'); div.setAttribute('aria-orientation', 'vertical'); div.setAttribute('aria-label', 'Largura da cena'); div.title = 'Arraste para mudar a largura da cena (duplo clique restaura)';
      palco.after(div); grade.classList.add('ajustavel');
      const larg = (w) => grade.style.setProperty('--rw', entre(w, 200, grade.offsetWidth * 0.62) + 'px'); const sw = +LS.get(wKey); if (sw) larg(sw);
      let d0 = null;
      div.addEventListener('pointerdown', (e) => { d0 = { x: e.clientX, w: lado.offsetWidth }; try { div.setPointerCapture(e.pointerId); } catch {} div.classList.add('arrastando'); });
      div.addEventListener('pointermove', (e) => { if (d0) larg(d0.w - (e.clientX - d0.x)); });
      const fimD = () => { if (!d0) return; d0 = null; div.classList.remove('arrastando'); LS.set(wKey, String(lado.offsetWidth)); };
      div.addEventListener('pointerup', fimD); div.addEventListener('pointercancel', fimD);
      div.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); larg(lado.offsetWidth + (e.key === 'ArrowLeft' ? 30 : -30)); LS.set(wKey, String(lado.offsetWidth)); } });
      div.addEventListener('dblclick', () => { grade.style.removeProperty('--rw'); LS.set(wKey, null); });
    }
  }
  window.Palco = { ligar };
})();
