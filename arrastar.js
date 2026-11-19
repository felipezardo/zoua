// ============ Painéis flutuantes arrastáveis (rolagem, rolagens da mesa, música, pedidos de ataque) ============
// Arraste pelo cabeçalho (ou por uma área livre do painel). Duplo clique no cabeçalho devolve ao lugar de origem.
// A posição fica guardada no navegador e sempre volta para dentro da tela.
(() => {
  const CH = 'um-anel-posicoes';
  let pos = {}; try { pos = JSON.parse(localStorage.getItem(CH) || '{}') || {}; } catch {}
  const gravar = () => { try { localStorage.setItem(CH, JSON.stringify(pos)); } catch {} };
  let z = 30;
  const dentro = (el, x, y) => { const m = 6, w = el.offsetWidth, h = el.offsetHeight; return [Math.max(m, Math.min(innerWidth - w - m, x)), Math.max(m, Math.min(innerHeight - Math.min(h, 80) - m, y))]; };
  function aplicar(el, x, y) { [x, y] = dentro(el, x, y); el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.transform = 'none'; el.classList.add('movido'); return [x, y]; }
  function ligar(el, chave, alcaSel) {
    if (!el || el.dataset.arrastar) return; el.dataset.arrastar = chave;
    const alca = alcaSel ? el.querySelector(alcaSel) || el : el; alca.classList.add('arrastavel');
    const restaurar = () => { const p = pos[chave]; if (p && getComputedStyle(el).display !== 'none') aplicar(el, p[0] * innerWidth, p[1] * innerHeight); };
    restaurar(); addEventListener('resize', () => { if (el.classList.contains('movido')) restaurar(); });
    let ini = null, moveu = false;
    el.addEventListener('pointerdown', () => { el.style.zIndex = String(++z); }, true);
    alca.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || e.target.closest('button,input,select,textarea,a,label,summary')) return;
      const r = el.getBoundingClientRect(); ini = { dx: e.clientX - r.left, dy: e.clientY - r.top, x0: e.clientX, y0: e.clientY }; moveu = false;
      try { alca.setPointerCapture(e.pointerId); } catch {}
    });
    alca.addEventListener('pointermove', (e) => {
      if (!ini) return; if (!moveu && Math.hypot(e.clientX - ini.x0, e.clientY - ini.y0) < 5) return; moveu = true; alca.classList.add('arrastando');
      aplicar(el, e.clientX - ini.dx, e.clientY - ini.dy);
    });
    const fim = () => { if (!ini) return; ini = null; alca.classList.remove('arrastando'); if (moveu) { const r = el.getBoundingClientRect(); pos[chave] = [r.left / innerWidth, r.top / innerHeight]; gravar(); } };
    alca.addEventListener('pointerup', fim); alca.addEventListener('pointercancel', fim);
    alca.addEventListener('click', (e) => { if (moveu) { e.stopPropagation(); e.preventDefault(); moveu = false; } }, true); // arrastar não pode abrir/fechar o painel
    alca.addEventListener('dblclick', (e) => { if (e.target.closest('button,input,select,textarea,a,label')) return; ['left', 'top', 'right', 'bottom', 'transform'].forEach((p) => (el.style[p] = '')); el.classList.remove('movido'); delete pos[chave]; gravar(); });
  }
  const ALVOS = [['#rolagem', 'rolagem', '.r-topo'], ['#rede-feed', 'feed', '.rede-feed-topo'], ['#musica-mini', 'musica', null], ['#ataque-fila', 'ataque', null]];
  const varrer = () => ALVOS.forEach(([sel, ch, alca]) => { const el = document.querySelector(sel); if (el) ligar(el, ch, alca); });
  varrer(); new MutationObserver(varrer).observe(document.body, { childList: true });
  addEventListener('load', varrer);
  window.Arrastar = { ligar };
})();
