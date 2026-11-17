// ============ Música da mesa: o Historiador toca uma faixa (YouTube ou link de áudio) e todos na sala ouvem ============
// Cada pessoa controla o próprio volume/mudo. O Historiador controla tocar, pausar e parar para todos.
// Antes de carregar: window.REDE_PAPEL = 'jogador' | 'gm' (o mesmo usado por rede-ui.js).
(() => {
  const papel = window.REDE_PAPEL || 'jogador', gm = papel === 'gm';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = { get: (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const aviso = (m) => (window.RedeUI ? RedeUI.aviso(m) : null);
  const M = { on: false, playing: false, kind: '', id: '', src: '', titulo: '', loop: true, local: '', carregando: false };
  let tokArq = 0; // estado da faixa (o que o Historiador decide)
  let vol = Math.min(1, Math.max(0, +LS.get('um-anel-vol', '0.5'))), mudo = LS.get('um-anel-mudo', '0') === '1', bloqueado = false, min = LS.get('um-anel-mini', '0') === '1';
  const audio = new Audio();

  // ---------- estrutura ----------
  document.body.insertAdjacentHTML('beforeend', `
    <aside id="musica-mini" class="musica-mini" hidden aria-label="Música da mesa">
      <button type="button" id="musica-min" class="mm-min" aria-label="Recolher o player" title="Recolher">♪</button>
      <div class="mm-corpo">
        <span class="mm-titulo" id="musica-titulo"></span>
        <span class="mm-ctl">
          ${gm ? '<button type="button" id="musica-pp" aria-label="Pausar para todos" title="Pausar / retomar para todos">❚❚</button><button type="button" id="musica-stop" aria-label="Parar para todos" title="Parar para todos">■</button>' : '<button type="button" id="musica-ativar" hidden>Ativar som</button>'}
          <button type="button" id="musica-mudo" aria-label="Silenciar" title="Silenciar só para você">🔊</button>
          <input type="range" id="musica-vol" min="0" max="100" step="1" aria-label="Volume (só para você)">
        </span>
      </div>
      <div id="musica-yt" class="mm-yt" aria-hidden="true"></div>
    </aside>
    ${gm ? `<dialog id="dlg-musica" aria-labelledby="mus-t"><div class="dlg-corpo" id="musica-corpo"></div><div class="dlg-botoes"><button type="button" class="sec" id="musica-fechar">Fechar</button></div></dialog>` : ''}`);
  const mini = $('#musica-mini');

  // ---------- reprodução ----------
  const ytId = (u) => { u = String(u || '').trim(); const m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); return m ? m[1] : /^[\w-]{11}$/.test(u) ? u : ''; };
  const yp = (f, a) => { const i = $('#musica-yt iframe'); if (i && i.contentWindow) i.contentWindow.postMessage(JSON.stringify({ event: 'command', func: f, args: a || [] }), '*'); };
  function volume() { audio.volume = vol; audio.muted = mudo; yp('setVolume', [Math.round(vol * 100)]); yp(mudo ? 'mute' : 'unMute'); }
  function parar() { tokArq++; M.carregando = false; audio.pause(); audio.removeAttribute('src'); try { audio.load(); } catch {} $('#musica-yt').innerHTML = ''; bloqueado = false; }
  function tocar() {
    parar(); if (!M.on) return pintar(); bloqueado = false;
    if (M.kind === 'yt') {
      const id = encodeURIComponent(M.id);
      $('#musica-yt').innerHTML = `<iframe width="160" height="90" allow="autoplay; encrypted-media" title="Música" src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=0&enablejsapi=1&playsinline=1${M.loop ? `&loop=1&playlist=${id}` : ''}"></iframe>`;
      $('#musica-yt iframe').onload = () => { volume(); setTimeout(() => { volume(); if (!M.playing) yp('pauseVideo'); }, 900); };
    } else if (M.kind === 'arq') {
      const tk = ++tokArq;
      const entrar = (url) => { if (tk !== tokArq || !M.on || M.kind !== 'arq') return; M.carregando = false; audio.src = url; audio.loop = !!M.loop; volume(); if (M.playing) audio.play().catch(() => { bloqueado = true; pintar(); }); pintar(); };
      if (M.local) entrar(M.local);
      else { M.carregando = true; (window.Nuvem && window.Rede ? Nuvem.lerArquivo(Rede.sala, M.id) : Promise.resolve(null)).then((url) => { if (url) entrar(url); else if (tk === tokArq) { M.carregando = false; aviso('Não consegui carregar a música da sala.'); pintar(); } }); }
    } else { audio.src = M.src; audio.loop = !!M.loop; volume(); if (M.playing) audio.play().catch(() => { bloqueado = true; pintar(); }); }
    pintar();
  }
  function pausaRetoma() { if (M.kind === 'yt') yp(M.playing ? 'playVideo' : 'pauseVideo'); else if (M.playing) audio.play().catch(() => { bloqueado = true; pintar(); }); else audio.pause(); pintar(); }
  function aplicar(d) {
    if (!d || !d.on) { M.on = false; parar(); return pintar(); }
    const nova = !M.on || M.kind !== d.kind || (d.kind === 'url' ? M.src !== d.src : M.id !== d.id) || M.loop !== !!d.loop;
    Object.assign(M, { on: true, playing: !!d.playing, kind: d.kind, id: d.id || '', src: d.src || '', titulo: d.titulo || '', loop: !!d.loop, local: d.local || '' });
    if (nova) tocar(); else pausaRetoma();
  }
  function pintar() {
    mini.hidden = !M.on; if (!M.on) { if (gm) desenharDlg(); return; }
    mini.classList.toggle('min', min); mini.classList.toggle('tocando', M.playing && !bloqueado);
    $('#musica-min').textContent = min ? '♪' : '–'; $('#musica-min').setAttribute('aria-label', min ? 'Abrir o player' : 'Recolher o player');
    $('#musica-titulo').textContent = (M.titulo || (M.kind === 'yt' ? 'YouTube' : 'Faixa')) + (M.carregando ? ' (carregando…)' : '');
    $('#musica-vol').value = Math.round(vol * 100); $('#musica-mudo').textContent = mudo || vol === 0 ? '🔇' : '🔊'; $('#musica-mudo').setAttribute('aria-label', mudo ? 'Ativar o som' : 'Silenciar');
    if (gm) { $('#musica-pp').textContent = M.playing ? '❚❚' : '▶'; $('#musica-pp').setAttribute('aria-label', M.playing ? 'Pausar para todos' : 'Retomar para todos'); desenharDlg(); }
    else { const b = $('#musica-ativar'); b.hidden = !(bloqueado || (M.playing && M.kind !== 'yt' && audio.paused)); }
  }

  // ---------- sincronização pela sala ----------
  const dados = () => ({ on: M.on, playing: M.playing, kind: M.kind, id: M.id, src: M.kind === 'arq' ? '' : M.src, titulo: M.titulo, loop: M.loop });
  const publicar = (alvo) => { if (window.Rede && Rede.conectado()) Rede.enviar('musica', dados(), alvo); };
  if (window.RedeUI) {
    RedeUI.on('musica', (env) => { if (!gm && env.p === 'gm') aplicar(env.d); });
    if (gm) RedeUI.on('musica-pedir', (env) => { if (M.on) publicar(env.de); });
  }
  if (window.Rede) {
    Rede.on('presenca', (p) => {
      if (gm) { const n = [...p.values()].filter((x) => x.papel === 'jogador').length; if (n > (publicar.n || 0) && M.on) publicar(); publicar.n = n; }
      else if (!M.on && [...p.values()].some((x) => x.papel === 'gm') && !aplicar.pediu) { aplicar.pediu = true; Rede.enviar('musica-pedir', {}); }
      else if (![...p.values()].some((x) => x.papel === 'gm')) aplicar.pediu = false;
    });
    Rede.on('estado', () => { if (!gm && !Rede.conectado()) { aplicar.pediu = false; if (M.on) aplicar(null); } });
  }

  // ---------- controles do player ----------
  $('#musica-min').onclick = () => { min = !min; LS.set('um-anel-mini', min ? '1' : '0'); pintar(); };
  $('#musica-mudo').onclick = () => { mudo = !mudo; LS.set('um-anel-mudo', mudo ? '1' : '0'); volume(); pintar(); };
  $('#musica-vol').oninput = (e) => { vol = +e.target.value / 100; if (vol > 0) mudo = false; LS.set('um-anel-vol', String(vol)); LS.set('um-anel-mudo', mudo ? '1' : '0'); volume(); pintar(); };
  if (!gm) $('#musica-ativar').onclick = () => { bloqueado = false; mudo = false; LS.set('um-anel-mudo', '0'); volume(); if (M.kind === 'yt') yp('playVideo'); else audio.play().catch(() => { bloqueado = true; }); pintar(); };
  else {
    $('#musica-pp').onclick = () => { M.playing = !M.playing; pausaRetoma(); publicar(); };
    $('#musica-stop').onclick = () => parada();
  }
  function parada() { M.on = false; parar(); pintar(); publicar(); }

  // ---------- janela do Historiador ----------
  if (gm) {
    const bt = document.createElement('button'), dir = $('.barra-dir');
    bt.type = 'button'; bt.id = 'musica-bt'; bt.className = 'rede-bt musica-bt'; bt.title = 'Música da mesa'; bt.setAttribute('aria-label', 'Música da mesa');
    bt.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg><span class="rede-dot" aria-hidden="true"></span>';
    if (dir) dir.insertBefore(bt, dir.firstChild);
    let arqs = []; const recarregarArqs = () => (window.Biblioteca ? Biblioteca.listar('musica').then((l) => { arqs = l; desenharDlg(); }).catch(() => {}) : null);
    const tam = (b) => b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
    const LIMITE = 5 * 1048576;
    const lib = () => { try { const l = JSON.parse(LS.get('um-anel-faixas', '[]')); return Array.isArray(l) ? l : []; } catch { return []; } };
    const gravar = (l) => LS.set('um-anel-faixas', JSON.stringify(l.slice(0, 60)));
    window.desenharDlg = desenharDlg;
    function desenharDlg() {
      const c = $('#musica-corpo'); if (!c || !$('#dlg-musica').open) { bt.classList.toggle('ativo', M.on); return; } bt.classList.toggle('ativo', M.on);
      const foco = document.activeElement && document.activeElement.id, vu = $('#mus-url') ? $('#mus-url').value : '', vn = $('#mus-nome') ? $('#mus-nome').value : '';
      const l = lib(), on = Rede && Rede.conectado();
      c.innerHTML = `<h2 id="mus-t">Música da mesa</h2>
        <p class="nota">${on ? 'Todos na sala ouvem o que você tocar aqui.' : 'Você não está numa sala: a música toca só para você. Conecte-se (ícone de sinal) para os jogadores ouvirem.'} Cada um ajusta o próprio volume.</p>
        ${M.on ? `<div class="mus-agora"><span class="mus-eq${M.playing ? ' on' : ''}" aria-hidden="true"><i></i><i></i><i></i></span><b>${esc(M.titulo || 'Faixa')}</b><span class="ch-acoes"><button type="button" data-mus="pp">${M.playing ? 'Pausar' : 'Retomar'}</button><button type="button" class="sec perigo" data-mus="stop">Parar</button></span></div>` : ''}
        <label class="campo">Link do YouTube ou de um arquivo de áudio (.mp3, .ogg…)<input id="mus-url" placeholder="https://www.youtube.com/watch?v=…" autocomplete="off" value="${esc(vu)}"></label>
        <label class="campo">Nome da faixa (opcional)<input id="mus-nome" autocomplete="off" value="${esc(vn)}"></label>
        <label class="cond-lbl"><input type="checkbox" id="mus-loop" ${M.loop ? 'checked' : ''}> Repetir</label>
        <div class="ch-acoes"><button type="button" data-mus="tocar">Tocar agora</button><button type="button" class="sec" data-mus="salvar">Guardar na biblioteca</button></div>
        <h3>Biblioteca</h3>${l.length ? `<ul class="lista mus-lib">${l.map((f, i) => `<li><span>${esc(f.titulo)}</span><span class="ch-acoes"><button type="button" class="mini-b" data-mus="lib" data-i="${i}">Tocar</button><button type="button" class="sec perigo mini-b" data-mus="del" data-i="${i}" aria-label="Remover ${esc(f.titulo)}">×</button></span></li>`).join('')}</ul>` : '<p class="nota">Nada guardado ainda. Cole um link acima e use “Guardar na biblioteca”. A biblioteca fica neste navegador.</p>'}
        <h3>Arquivos do computador</h3>
        <label class="campo mus-arq">Adicionar músicas (mp3, ogg, wav…) — várias de uma vez<input type="file" id="mus-arq" accept="audio/*" multiple></label>
        ${arqs.length ? `<ul class="lista mus-lib">${arqs.map((f) => `<li><span>${esc(f.nome)} <small>${tam(f.tam || 0)}${f.tam > LIMITE ? ' · grande demais para transmitir' : ''}</small></span><span class="ch-acoes"><button type="button" class="mini-b" data-mus="arq" data-id="${esc(f.id)}">Tocar</button><button type="button" class="sec perigo mini-b" data-mus="arqdel" data-id="${esc(f.id)}" aria-label="Remover ${esc(f.nome)}">×</button></span></li>`).join('')}</ul>` : '<p class="nota">Nenhum arquivo ainda. Eles ficam guardados neste navegador e são enviados aos jogadores na hora de tocar (até 5 MB cada).</p>'}`;
      if (foco && $('#' + foco)) $('#' + foco).focus();
    }
    function iniciar(url, titulo) {
      url = String(url || '').trim(); if (!url) return aviso('Cole um link do YouTube ou de um arquivo de áudio.');
      const id = ytId(url), loop = $('#mus-loop') ? $('#mus-loop').checked : true;
      if (!id && !/^https?:\/\//i.test(url)) return aviso('Link inválido: use um endereço que comece com https://');
      aplicar({ on: true, playing: true, kind: id ? 'yt' : 'url', id, src: id ? '' : url, titulo: titulo || (id ? 'YouTube' : decodeURIComponent(url.split('/').pop().split('?')[0]) || 'Faixa'), loop });
      publicar(); desenharDlg(); aviso(Rede && Rede.conectado() ? 'Música tocando para a sala.' : 'Música tocando (só para você).');
    }
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mus]'); if (!b) return; const k = b.dataset.mus;
      if (k === 'tocar') iniciar($('#mus-url').value, $('#mus-nome').value.trim());
      else if (k === 'salvar') { const url = $('#mus-url').value.trim(); if (!ytId(url) && !/^https?:\/\//i.test(url)) return aviso('Cole um link válido para guardar.'); const l = lib(); l.unshift({ titulo: $('#mus-nome').value.trim() || (ytId(url) ? 'YouTube ' + ytId(url) : url.split('/').pop().split('?')[0] || 'Faixa'), url }); gravar(l); $('#mus-nome').value = ''; desenharDlg(); aviso('Guardado na biblioteca.'); }
      else if (k === 'lib') { const f = lib()[+b.dataset.i]; if (f) iniciar(f.url, f.titulo); }
      else if (k === 'del') { const l = lib(); l.splice(+b.dataset.i, 1); gravar(l); desenharDlg(); }
      else if (k === 'pp') { M.playing = !M.playing; pausaRetoma(); publicar(); desenharDlg(); }
      else if (k === 'arq') tocarArquivo(b.dataset.id);
      else if (k === 'arqdel') Biblioteca.remover(b.dataset.id).then(recarregarArqs);
      else if (k === 'stop') parada();
    });
    async function tocarArquivo(id) {
      const it = await Biblioteca.obter(id); if (!it) return aviso('Arquivo não encontrado na biblioteca.');
      const loop = $('#mus-loop') ? $('#mus-loop').checked : true, online = window.Rede && Rede.conectado();
      aplicar({ on: true, playing: true, kind: 'arq', id: it.id, titulo: it.nome, loop, local: URL.createObjectURL(it.blob) });
      if (!online) { desenharDlg(); return aviso('Tocando só para você (sem sala).'); }
      if (it.tam > LIMITE) { desenharDlg(); return aviso('Arquivo maior que 5 MB: toca só para você. Use um arquivo menor ou um link.'); }
      aviso('Enviando a música para a sala…'); const ok = window.Nuvem ? await Nuvem.salvarArquivo(Rede.sala, it.id, it.blob) : false;
      if (!ok) { aviso('Não consegui enviar o arquivo (Firebase). Toca só para você.'); return desenharDlg(); }
      if (M.on && M.id === it.id) { publicar(); aviso('Música tocando para a sala.'); }
      desenharDlg();
    }
    document.addEventListener('change', async (e) => {
      if (e.target.id === 'mus-arq') {
        const fs = [...e.target.files]; e.target.value = ''; let n = 0;
        for (const f of fs) { if (!/^audio\//.test(f.type) && !/\.(mp3|ogg|wav|m4a|aac|flac|opus)$/i.test(f.name)) continue; await Biblioteca.adicionar({ id: Biblioteca.id(), tipo: 'musica', nome: f.name.replace(/\.[^.]+$/, ''), blob: f, mime: f.type || 'audio/mpeg', tam: f.size, criado: Date.now() }); n++; }
        aviso(n ? `${n} música(s) adicionada(s) à biblioteca.` : 'Nenhum arquivo de áudio reconhecido.'); recarregarArqs(); return;
      } if (e.target.id === 'mus-loop' && M.on) { M.loop = e.target.checked; tocar(); publicar(); } });
    bt.onclick = () => { const d = $('#dlg-musica'); if (!d.open) d.showModal(); desenharDlg(); recarregarArqs(); };
    $('#musica-fechar').onclick = () => $('#dlg-musica').close();
    $('#dlg-musica').addEventListener('click', (e) => { if (e.target.id === 'dlg-musica') e.target.close(); });
  }
  pintar();
})();
