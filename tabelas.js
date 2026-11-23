// ============ Tabelas do Historiador: consulta por local e contexto, com dado nas tabelas que se jogam ============
(() => {
  const raiz = document.getElementById('v-tabelas'); if (!raiz || typeof TABELAS === 'undefined') return;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  let local = LS.get('um-anel-tab-local', 'jornada'), busca = ''; let abertas = new Set(); try { abertas = new Set(JSON.parse(LS.get('um-anel-tab-abertas', '[]'))); } catch {}
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const texto = (t) => norm([t.titulo, t.quando, t.como, t.extra, t.ctx, ...(t.cab || []), ...t.linhas.flatMap((l) => l.c)].join(' '));
  const indice = TABELAS.map((t) => ({ t, txt: texto(t) }));

  // ---------- dados ----------
  const d = (n) => 1 + Math.floor(Math.random() * n);
  const peso = (v) => (v === 12 ? -1 : v === 11 ? 99 : v); // Olho é o pior, Runa é o melhor
  const nomeF = (v) => (v === 11 ? 'Runa de Gandalf' : v === 12 ? 'Olho de Sauron' : String(v));
  const chaveF = (v) => (v === 11 ? 'runa' : v === 12 ? 'olho' : v);
  function rolar(t, modo) {
    if (t.dado === 'S') { const v = d(6); return { v, k: v, txt: `d6: ${v}` }; }
    let a = d(12), b = null, v = a;
    if (modo === 'fav' || modo === 'des') { b = d(12); v = modo === 'fav' ? (peso(a) >= peso(b) ? a : b) : (peso(a) <= peso(b) ? a : b); }
    const extra = b != null ? ` (${nomeF(a)} e ${nomeF(b)}, vale ${modo === 'fav' ? 'o melhor' : 'o pior'})` : '';
    return { v, k: chaveF(v), txt: `Dado de Façanha: ${nomeF(v)}${extra}` };
  }
  const casa = (l, k) => { if (l.k === undefined) return false; if (typeof l.k === 'string') return l.k === k; if (typeof k !== 'number') return false; return Array.isArray(l.k) ? k >= l.k[0] && k <= l.k[1] : l.k === k; };

  // ---------- desenho ----------
  const contagem = (id) => TABELAS.filter((t) => t.local === id).length;
  function controles(t) {
    if (!t.dado) return '';
    let sel = '';
    if (t.dado === 'F') {
      const ops = t.modo === 'terra' ? [['fav', 'Terra de Fronteira (Favorecida)'], ['n', 'Terra Erma (normal)'], ['des', 'Terra Sombria (Desfavorecida)']]
        : t.modo === 'severidade' ? [['fav', 'Perda moderada (Favorecida)'], ['n', 'Perda severa (normal)'], ['des', 'Perda grave (Desfavorecida)']]
        : [['n', 'Normal'], ['fav', 'Favorecida'], ['des', 'Desfavorecida']];
      sel = `<label class="tab-modo">${t.modo === 'terra' ? 'Região' : t.modo === 'severidade' ? 'Severidade' : 'Jogada'} <select data-modo>${ops.map(([v, n]) => `<option value="${v}"${(t.modo ? v === 'n' : v === 'n') ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
    }
    return `<div class="tab-rolar">${sel}<button type="button" data-rolar>${t.dado === 'F' ? 'Rolar Dado de Façanha' : 'Rolar dado de Sucesso'}</button><output class="tab-resultado" aria-live="polite"></output></div>`;
  }
  function tabela(t) {
    return `<div class="tab-rolavel"><table class="tab"><thead><tr>${t.cab.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.linhas.map((l, i) => `<tr data-i="${i}">${l.c.map((c, j) => (j === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function cartao(t, aberto) {
    return `<details class="tab-card" data-id="${t.id}"${aberto ? ' open' : ''}><summary><span class="tab-titulo">${esc(t.titulo)}${t.dado ? '<span class="tab-dado" title="Esta tabela se joga">' + (t.dado === 'F' ? 'd12' : 'd6') + '</span>' : ''}</span><span class="tab-quando">${esc(t.quando)}</span></summary>
      <div class="tab-corpo"><p class="tab-como"><b>Como usar.</b> ${esc(t.como)}</p>${controles(t)}${tabela(t)}${t.extra ? `<p class="tab-extra">${esc(t.extra)}</p>` : ''}</div></details>`;
  }
  function render() {
    const q = norm(busca).trim(), buscando = q.length > 1;
    const lista = buscando ? indice.filter((x) => q.split(/\s+/).every((p) => x.txt.includes(p))).map((x) => x.t) : TABELAS.filter((t) => t.local === local);
    let corpo = '';
    if (!lista.length) corpo = '<p class="nota">Nenhuma tabela encontrada. Tente outra palavra (por exemplo: Fadiga, Ferido, Sombra, tesouro).</p>';
    else {
      const grupos = new Map(); lista.forEach((t) => { const ch = buscando ? LOCAIS.find((l) => l.id === t.local).nome + ' · ' + t.ctx : t.ctx; (grupos.get(ch) || grupos.set(ch, []).get(ch)).push(t); });
      corpo = [...grupos.entries()].map(([ctx, ts]) => `<section class="tab-grupo"><h3>${esc(ctx)}</h3>${ts.map((t) => cartao(t, buscando || abertas.has(t.id))).join('')}</section>`).join('');
    }
    const loc = LOCAIS.find((l) => l.id === local);
    raiz.innerHTML = `<div class="ficha tabelas" id="tabelas-gm"><h2 class="titulo-pagina">Tabelas do Historiador</h2>
      <p class="nota tab-intro">Consulta rápida das tabelas do livro, separadas por <b>local</b> (onde a Companhia está) e <b>contexto</b> (o que está acontecendo). Abra uma tabela para ver como usá-la; nas que se jogam, o botão <b>Rolar</b> sorteia e destaca a linha.</p>
      <div class="tab-barra"><div class="tab-locais" role="tablist" aria-label="Local">${LOCAIS.map((l) => `<button type="button" role="tab" aria-selected="${!buscando && l.id === local}" data-local="${l.id}" class="${!buscando && l.id === local ? 'on' : ''}" title="${esc(l.sub)}">${esc(l.nome)}<small>${contagem(l.id)}</small></button>`).join('')}</div>
      <label class="tab-busca"><span class="sr">Buscar tabela</span><input type="search" id="tab-busca" placeholder="Buscar: Fadiga, Ferido, Sombra, tesouro…" value="${esc(busca)}" autocomplete="off"></label></div>
      ${buscando ? `<p class="nota">${lista.length} tabela(s) para “${esc(busca)}”.</p>` : `<p class="tab-sub">${esc(loc.sub)}</p>`}${corpo}</div>`;
    const campo = raiz.querySelector('#tab-busca'); if (buscando && campo && document.activeElement !== campo) { /* mantém o foco na digitação */ }
  }
  raiz.addEventListener('click', (e) => {
    const l = e.target.closest('[data-local]'); if (l) { local = l.dataset.local; busca = ''; LS.set('um-anel-tab-local', local); render(); return; }
    const b = e.target.closest('[data-rolar]'); if (!b) return;
    const card = b.closest('.tab-card'), t = TABELAS.find((x) => x.id === card.dataset.id), sel = card.querySelector('[data-modo]'), r = rolar(t, sel ? sel.value : 'n');
    card.querySelectorAll('tbody tr').forEach((tr) => tr.classList.toggle('sorteado', casa(t.linhas[+tr.dataset.i], r.k)));
    const out = card.querySelector('.tab-resultado'); out.textContent = r.txt; out.classList.remove('nova'); void out.offsetWidth; out.classList.add('nova');
    const alvo = card.querySelector('tr.sorteado'); if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  raiz.addEventListener('toggle', (e) => { const c = e.target; if (!c.classList || !c.classList.contains('tab-card')) return; if (c.open) abertas.add(c.dataset.id); else abertas.delete(c.dataset.id); LS.set('um-anel-tab-abertas', JSON.stringify([...abertas].slice(-40))); }, true);
  let tb = 0;
  raiz.addEventListener('input', (e) => { if (e.target.id !== 'tab-busca') return; busca = e.target.value; clearTimeout(tb); tb = setTimeout(() => { const pos = e.target.selectionStart; render(); const n = raiz.querySelector('#tab-busca'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch {} } }, 150); });
  render();
})();
