// ============ Resultado das rolagens e histórico ============
// Só cuida de EXIBIR: as regras (dados, NA, bônus) continuam em app.js e sombra.js.
(() => {
  const IMG = { olho: 'assets/dados/olho-de-sauron.png', runa: 'assets/dados/runa-de-gandalf.png', sucesso: 'assets/dados/icone-de-sucesso.png' };
  const ico = (k, cls = '') => `<img class="ico ${cls}" src="${IMG[k]}" alt="" aria-hidden="true" draggable="false">`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduzir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.icoSucesso = () => ico('sucesso', 'ico-suc');

  const facaFacanha = (v) => (v === 11 ? ico('runa', 'ico-runa') : v === 12 ? ico('olho', 'ico-olho') : `<span>${v}</span>`);
  const nomeFacanha = (v) => (v === 11 ? 'Runa de Gandalf' : v === 12 ? 'Olho de Sauron' : String(v));

  function tilesFacanha(r, mini) {
    const usado = r.f.indexOf(r.fac);
    return r.f.map((v, i) => {
      const cls = ['dado', 'dado-f', v === 11 ? 'runa' : '', v === 12 ? 'olho' : '', r.f.length > 1 ? (i === usado ? 'usado' : 'descartado') : ''].join(' ');
      return `<span class="${cls}" style="--i:${i}">${facaFacanha(v)}</span>`;
    }).join('');
  }
  function tilesSucesso(r) {
    if (!r.suc.length) return '<span class="vazio">nenhum</span>';
    return r.suc.map((v, i) => `<span class="dado dado-s${r.exausto && v <= 3 ? ' zero' : ''}${v === 6 ? ' seis' : ''}" style="--i:${i + r.f.length}">${v === 6 ? ico('sucesso', 'ico-suc') : `<span>${v}</span>`}</span>`).join('');
  }
  function veredito(r) {
    const n = r.magico ? 1 : r.ok ? Math.min(r.icones, 3) : 0;
    const marca = r.ok ? (n ? Array.from({ length: n }, () => ico('sucesso', 'ico-suc')).join('') : '<span class="v-check">✓</span>') : '<span class="v-x">✕</span>';
    return `<span class="v-marca">${marca}</span><strong>${esc(r.grau)}</strong>`;
  }
  function falaResultado(r) {
    const parte = r.runa ? 'Runa de Gandalf, sucesso automático' : r.magico ? 'Sucesso mágico, sucesso automático' : `total ${r.total} contra NA ${r.na}`;
    return `${r.nome}: ${r.grau}. Dado de Façanha ${r.f.map(nomeFacanha).join(' e ')}${r.f.length > 1 ? `, valendo ${nomeFacanha(r.fac)}` : ''}. ${r.suc.length ? `Dados de Sucesso ${r.suc.join(', ')}.` : 'Sem dados de Sucesso.'} ${r.icones ? `${r.icones} ícone${r.icones > 1 ? 's' : ''} de sucesso. ` : ''}${parte}.`;
  }
  function html(r) {
    const automatico = r.runa || r.magico;
    const conta = automatico
      ? `<span class="auto">${r.runa ? 'Runa de Gandalf: sucesso automático' : 'Sucesso mágico: automático'}</span>`
      : `<span class="t-total" data-total="${r.total}">${r.total}</span><span class="vs">${r.ok ? '≥' : '<'}</span><span class="t-na"><small>NA</small> ${r.na}</span>`;
    const soma = automatico ? '' : `<p class="soma">${r.olho ? 'Olho de Sauron vale 0' : `Façanha ${r.fac}`}${r.suc.length ? ` + dados ${r.total - (r.olho ? 0 : r.fac) - (r.bonus || 0)}` : ''}${r.bonus ? ` ${r.bonus > 0 ? '+' : '−'} bônus ${Math.abs(r.bonus)}` : ''}${r.olho && r.arrasado ? '. Arrasado: o Olho é falha automática' : ''}</p>`;
    const chips = (r.chips || []).map((c) => `<span class="chip">${esc(c)}</span>`).join('');
    const ex = r.extra ? `<div class="r-extra"><div class="chips">${r.extra.chips.map((c) => `<span class="chip ${c.alerta ? 'alerta' : 'forte'}">${c.html}</span>`).join('')}</div>${r.extra.det?.length ? `<details><summary>Opções por ícone</summary><ul>${r.extra.det.map((d) => `<li>${d}</li>`).join('')}</ul></details>` : ''}</div>` : '';
    return `<div class="res-card ${r.ok ? 'res-ok' : 'res-falha'}${r.runa ? ' res-runa' : ''}${r.olho ? ' res-olho' : ''}">
      <p class="sr-only">${esc(falaResultado(r))}</p>
      <div class="res-topo" aria-hidden="true"><div class="veredito">${veredito(r)}</div><div class="res-nome">${esc(r.nome)}</div></div>
      <div class="bandeja" aria-hidden="true">
        <div class="grupo"><small>Façanha</small><div class="dados">${tilesFacanha(r)}</div></div>
        <div class="grupo"><small>Sucesso${r.suc.length ? ` (${r.suc.length}d)` : ''}</small><div class="dados">${tilesSucesso(r)}</div></div>
      </div>
      <div class="conta" aria-hidden="true">${conta}</div>${soma ? soma.replace('<p', '<p aria-hidden="true"') : ''}
      ${chips ? `<div class="chips">${chips}</div>` : ''}${r.nota ? `<p class="nota">${esc(r.nota)}</p>` : ''}${ex}${r.extraHtml ? `<div class="r-extra2">${r.extraHtml}</div>` : ''}
    </div>`;
  }
  function contar(el) { // o total "sobe" até o valor final
    const alvo = +el.dataset.total; if (reduzir() || !isFinite(alvo) || alvo <= 0) return;
    const ini = performance.now(), dur = 520;
    const passo = (t) => { const p = Math.min(1, (t - ini) / dur); el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(passo); };
    el.textContent = '0'; setTimeout(() => requestAnimationFrame(passo), 380);
  }

  // ---------- histórico (guardado na ficha, até 30 rolagens) ----------
  const LIM = 30; let desfazer = null, tDesfazer;
  const lista = () => (state.rol_hist = Array.isArray(state.rol_hist) ? state.rol_hist : []);
  function registrar(r) {
    const h = lista(); h.unshift({ t: Date.now(), nome: r.nome, grau: r.grau, ok: r.ok, total: r.total, na: r.na, runa: r.runa, olho: r.olho, magico: r.magico, icones: r.icones, f: r.f, fac: r.fac, suc: r.suc, exausto: r.exausto, auto: r.runa || r.magico });
    h.length = Math.min(h.length, LIM); renderHist();
  }
  function renderHist() {
    const box = document.getElementById('r-hist'), ol = document.getElementById('r-log'); if (!box || !ol) return;
    const h = lista(), msg = document.getElementById('r-hist-msg');
    box.hidden = !h.length && !desfazer; document.getElementById('r-limpar').hidden = !h.length;
    document.getElementById('r-hist-n').textContent = h.length ? `(${h.length})` : '';
    msg.hidden = !desfazer;
    ol.innerHTML = h.map((e) => `<li class="${e.ok ? 'h-ok' : 'h-falha'}"><details><summary><span class="h-marca" aria-hidden="true">${e.ok ? '✓' : '✕'}</span><span class="h-nome">${esc(e.nome)}</span><span class="h-res">${e.auto ? 'automático' : `${e.total} / NA ${e.na}`}</span></summary>
      <div class="h-det"><strong>${esc(e.grau)}</strong> <time>${new Date(e.t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
      <div class="bandeja mini" aria-hidden="true"><div class="dados">${tilesFacanha(e)}${e.suc.map((v) => `<span class="dado dado-s${e.exausto && v <= 3 ? ' zero' : ''}">${v === 6 ? ico('sucesso', 'ico-suc') : `<span>${v}</span>`}</span>`).join('')}</div></div></div></details></li>`).join('');
  }
  document.getElementById('r-limpar').onclick = () => {
    desfazer = lista().slice(); state.rol_hist = []; clearTimeout(tDesfazer); tDesfazer = setTimeout(() => { desfazer = null; renderHist(); }, 7000);
    renderHist(); salvar();
  };
  document.getElementById('r-desfazer').onclick = () => { if (desfazer) { state.rol_hist = desfazer; desfazer = null; clearTimeout(tDesfazer); renderHist(); salvar(); } };

  // ---------- API usada por app.js e sombra.js ----------
  window.mostrarRolagem = (r, alvo = '#r-res', guardar = true) => {
    const el = document.querySelector(alvo); if (!el) return;
    el.innerHTML = html(r);
    el.querySelectorAll('.t-total').forEach(contar);
    const card = el.querySelector('.res-card'); if (card) { card.classList.remove('nova'); void card.offsetWidth; card.classList.add('nova'); }
    el.scrollIntoView({ block: 'nearest', behavior: reduzir() ? 'auto' : 'smooth' });
    if (guardar) registrar(r);
  };
  const aplicarAnterior = aplicar;
  aplicar = function (i) { aplicarAnterior(i); desfazer = null; renderHist(); };
  renderHist();
})();
