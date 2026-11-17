// ============ Interface da sala: conexão, rolagens da mesa e avisos (usada pela ficha e pela Mesa) ============
// Antes de carregar: window.REDE_PAPEL = 'jogador' | 'gm' e window.REDE_NOME = () => nome do personagem.
(() => {
  const papel = window.REDE_PAPEL || 'jogador', nomeAtual = () => (window.REDE_NOME ? window.REDE_NOME() : '') || (papel === 'gm' ? 'Historiador' : 'Jogador');
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lerLS = (k, d = '') => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const gravarLS = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const hora = (t) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const U = { papel, aoMensagem: {}, naoLidas: 0, feed: [], gmVisivel: () => lerLS('um-anel-gm-visivel', '1') === '1' };
  window.RedeUI = U;

  // ---------- estrutura ----------
  document.body.insertAdjacentHTML('beforeend', `
    <dialog id="dlg-rede" aria-labelledby="rede-t"><div class="dlg-corpo" id="rede-corpo"></div><div class="dlg-botoes"><button type="button" class="sec" id="rede-fechar">Fechar</button></div></dialog>
    <aside id="rede-feed" class="rede-feed" aria-label="Rolagens da mesa" hidden>
      <div class="rede-feed-topo"><h3>Rolagens da mesa <span id="rede-feed-n"></span></h3><span><button type="button" id="rede-feed-limpar" class="link-btn" aria-label="Limpar rolagens">Limpar</button><button type="button" id="rede-feed-x" aria-label="Fechar rolagens da mesa">×</button></span></div>
      <ol id="rede-feed-lista" class="rede-feed-lista" aria-live="polite"></ol>
    </aside><div id="rede-toasts" class="rede-toasts" aria-live="polite"></div>`);
  const bt = $('#rede-bt');
  // botão próprio para as rolagens da mesa (antes o ícone de sinal abria o feed e escondia a janela de conexão)
  const fbt = document.createElement('button');
  fbt.type = 'button'; fbt.id = 'feed-bt'; fbt.className = 'rede-bt feed-bt'; fbt.hidden = true;
  fbt.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4z"/><path d="M12 2.8v18.4M4 7.4l8 4.6 8-4.6"/></svg><span class="rede-n" hidden></span>';
  if (bt && bt.parentElement) bt.parentElement.insertBefore(fbt, bt);

  // ---------- feed ----------
  function itemFeed(e, animar) {
    const li = document.createElement('li'); li.className = 'feed-item' + (animar ? '' : ' sem-anim') + (e.papel === 'gm' ? ' gm' : '');
    li.innerHTML = `<div class="feed-cab"><b>${esc(e.quem)}</b><span>${e.papel === 'gm' ? ' · Historiador' : ''}</span><time>${hora(e.ts)}</time></div>${window.htmlResultado ? window.htmlResultado(e.r) : esc(e.r.nome)}`;
    li.querySelectorAll('.t-total').forEach((el) => { el.textContent = el.dataset.total; });
    return li;
  }
  function renderFeed() { const ol = $('#rede-feed-lista'); ol.innerHTML = ''; U.feed.forEach((e) => ol.appendChild(itemFeed(e, false))); $('#rede-feed-n').textContent = U.feed.length ? `(${U.feed.length})` : ''; (U.assinantes || []).forEach((f) => f(null)); }
  // outras telas (como a aba Cenas) podem mostrar o mesmo feed
  U.assinantes = [];
  U.montarFeed = (el) => { const pintar = (e) => { if (e === null) { el.innerHTML = ''; U.feed.forEach((x) => el.appendChild(itemFeed(x, false))); } else el.prepend(itemFeed(e, true)); }; U.assinantes.push(pintar); pintar(null); };
  function entrarNoFeed(e) {
    U.feed.unshift(e); U.feed.length = Math.min(U.feed.length, 60);
    try { sessionStorage.setItem('um-anel-feed', JSON.stringify(U.feed)); } catch {}
    const ol = $('#rede-feed-lista'); ol.prepend(itemFeed(e, true)); while (ol.children.length > 60) ol.lastChild.remove(); U.assinantes.forEach((f) => f(e));
    $('#rede-feed-n').textContent = `(${U.feed.length})`;
    if ($('#rede-feed').hidden && !U.feedVisivel?.()) { U.naoLidas++; atualizarBotao(); toast(e); }
  }
  try { U.feed = JSON.parse(sessionStorage.getItem('um-anel-feed') || '[]'); } catch { U.feed = []; } renderFeed();
  function toast(e) {
    const r = e.r, t = document.createElement('button'); t.type = 'button'; t.className = 'rede-toast ' + (r.ok ? 'ok' : 'falha');
    t.innerHTML = `<b>${esc(e.quem)}</b> <span>${esc(String(r.nome).replace(/^.*?:\s*/, ''))}</span> <strong>${esc(r.grau)}</strong>${r.autoSimb || r.magico ? '' : ` <small>${r.total} / NA ${r.na}</small>`}`;
    t.onclick = () => { abrirFeed(true); t.remove(); }; $('#rede-toasts').prepend(t); setTimeout(() => t.remove(), 6000);
    while ($('#rede-toasts').children.length > 3) $('#rede-toasts').lastChild.remove();
  }
  function abrirFeed(abrir) { const f = $('#rede-feed'); f.hidden = abrir === undefined ? !f.hidden : !abrir; if (!f.hidden) U.naoLidas = 0; atualizarBotao(); }
  $('#rede-feed-x').onclick = () => abrirFeed(false);
  $('#rede-feed-limpar').onclick = () => { U.feed = []; try { sessionStorage.removeItem('um-anel-feed'); } catch {} renderFeed(); };

  // ---------- publicar rolagens ----------
  U.publicarRolagem = (r, quem) => {
    const nome = quem || nomeAtual(), env = { quem: nome, papel, r: JSON.parse(JSON.stringify(r)), ts: Date.now() };
    if (papel === 'gm' && !U.gmVisivel()) return;
    entrarNoFeedLocal(env); if (Rede.conectado()) Rede.enviar('rolagem', { nome, r: env.r });
  };
  function entrarNoFeedLocal(env) { // a própria rolagem aparece no feed sem avisos
    U.feed.unshift(env); U.feed.length = Math.min(U.feed.length, 60); try { sessionStorage.setItem('um-anel-feed', JSON.stringify(U.feed)); } catch {}
    const ol = $('#rede-feed-lista'); ol.prepend(itemFeed(env, false)); $('#rede-feed-n').textContent = `(${U.feed.length})`; U.assinantes.forEach((f) => f(env));
  }

  // ---------- botão da barra e janela de conexão ----------
  function atualizarBotao() {
    if (!bt) return; const e = Rede.estado, n = Rede.presentes.size;
    bt.dataset.estado = e; const pn = bt.querySelector('.rede-n'); pn.textContent = e === 'conectado' ? String(n + 1) : ''; pn.hidden = e !== 'conectado'; pn.classList.add('pessoas');
    const txt = e === 'conectado' ? `Sala ${Rede.sala}: ${n + 1} pessoa(s) conectada(s). Toque para ver a sala` : e === 'conectando' ? 'Conectando à sala…' : 'Conectar a uma sala da mesa';
    bt.title = txt; bt.setAttribute('aria-label', txt);
    fbt.hidden = e === 'desconectado' && !U.feed.length; const fn = fbt.querySelector('.rede-n'); fn.textContent = U.naoLidas ? String(U.naoLidas) : ''; fn.hidden = !U.naoLidas;
    const ft = U.naoLidas ? `Rolagens da mesa (${U.naoLidas} novas)` : 'Rolagens da mesa'; fbt.title = ft; fbt.setAttribute('aria-label', ft);
  }
  fbt.onclick = () => abrirFeed();
  if (bt) bt.onclick = () => abrirConexao();
  const copiar = async (t, msg) => { try { await navigator.clipboard.writeText(t); aviso(msg); } catch { aviso('Copie manualmente: ' + t); } };
  const aviso = (m) => { let el = $('#aviso'); if (!el) { el = document.createElement('div'); el.id = 'aviso'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = m; el.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => { el.hidden = true; }, 4500); };
  U.aviso = aviso;
  const linkSala = () => { const u = new URL(location.href); u.hash = ''; u.pathname = u.pathname.replace(/[^/]*$/, 'index.html'); return u.href + '#sala=' + Rede.sala; };
  function abrirConexao() { desenharConexao(); const d = $('#dlg-rede'); if (!d.open) d.showModal(); }
  function desenharConexao() {
    const c = $('#rede-corpo'), e = Rede.estado, ultimo = lerLS('um-anel-sala'), servidores = Rede.brokers.join('\n');
    if (e === 'conectado' || e === 'conectando') {
      const lista = [...Rede.presentes.values()], gm = papel === 'gm';
      const exp = [...Rede.banidos];
      c.innerHTML = `<h2 id="rede-t">Sala da mesa</h2>
        <p class="rede-codigo" aria-live="polite"><small>Código da sala</small><b>${esc(Rede.sala)}</b></p>
        <p class="nota">${e === 'conectado' ? `Conectado${Rede.broker ? ' · ' + esc(new URL(Rede.broker).host) : ''}.` : 'Conectando…'} ${esc(Rede.erro)}</p>
        <div class="ch-acoes"><button type="button" data-rede="copiar-codigo">Copiar código</button>${gm ? '<button type="button" class="sec" data-rede="copiar-link">Copiar link para os jogadores</button>' : ''}</div>
        <h3>Na sala agora (${lista.length + 1})</h3><ul class="lista rede-presentes"><li class="rede-pessoa"><span><b>${esc(Rede.nome)}</b> <small>(você${gm ? ', Historiador' : ''})</small></span></li>${lista.map((p) => `<li class="rede-pessoa"><span>${esc(p.nome)} <small>${p.papel === 'gm' ? '(Historiador)' : ''}</small></span>${gm && p.papel !== 'gm' ? `<button type="button" class="sec perigo mini-b" data-rede="expulsar" data-id="${esc(p.id)}" title="Remover ${esc(p.nome)} da sala">Expulsar</button>` : ''}</li>`).join('')}</ul>
        ${gm && exp.length ? `<details class="rede-expulsos"><summary>Expulsos nesta sessão (${exp.length})</summary><ul class="lista">${exp.map((id) => `<li><small>${esc(id)}</small> <button type="button" class="sec mini-b" data-rede="readmitir" data-id="${esc(id)}">Readmitir</button></li>`).join('')}</ul></details>` : ''}
        ${gm ? `<label class="cond-lbl"><input type="checkbox" id="rede-gm-visivel" ${U.gmVisivel() ? 'checked' : ''}> Mostrar minhas rolagens aos jogadores</label>` : ''}
        <p class="nota">Tudo que passa pela sala é criptografado com o código; só quem tem o código lê.${gm ? ' Para impedir de vez que alguém volte, crie uma sala nova (outro código).' : ''}</p>
        <div class="ch-acoes">${gm ? '<button type="button" class="sec perigo" data-rede="encerrar">Encerrar sala para todos</button>' : '<button type="button" class="sec perigo" data-rede="sair">Sair da sala</button>'}</div>`;
    } else {
      c.innerHTML = `<h2 id="rede-t">Conectar à mesa</h2>
        <p>${papel === 'gm' ? 'Crie uma sala e passe o código (ou o link) aos jogadores. Eles veem as rolagens uns dos outros, e você acompanha as fichas em tempo real.' : 'Peça o código da sala ao Historiador. Você verá as rolagens de todos, e o Historiador acompanha sua ficha.'}</p>
        ${Rede.erro ? `<p class="alerta">${esc(Rede.erro)}</p>` : ''}
        <label class="campo">Seu nome na mesa<input id="rede-nome" value="${esc(nomeAtual())}" ${papel === 'jogador' ? 'readonly' : ''}></label>
        ${papel === 'gm' ? `<div class="ch-acoes"><button type="button" data-rede="criar">Criar sala nova</button>${ultimo ? `<button type="button" class="sec" data-rede="retomar">Voltar à sala ${esc(ultimo)}</button>` : ''}</div><p class="nota">Ou entre numa sala existente:</p>` : ''}
        <div class="rede-linha"><label class="campo">Código da sala<input id="rede-codigo" placeholder="XXXX-XXXX" value="${esc(papel === 'gm' ? '' : ultimo)}" autocomplete="off" autocapitalize="characters"></label><button type="button" data-rede="entrar">Entrar</button></div>
        <details><summary>Servidores (avançado)</summary><p class="nota">Usamos servidores públicos e gratuitos (MQTT por WebSocket). Um por linha; se um cair, o próximo é usado.</p><textarea id="rede-servidores" rows="4">${esc(servidores)}</textarea><button type="button" class="sec" data-rede="salvar-servidores">Salvar servidores</button></details>`;
    }
  }
  async function entrar(codigo) {
    const nome = ($('#rede-nome')?.value || nomeAtual()).trim() || nomeAtual();
    try { await Rede.entrar({ sala: codigo, papel, nome }); gravarLS('um-anel-sala', Rede.sala); gravarLS('um-anel-sala-auto-' + papel, Rede.sala); } catch (err) { Rede.erro = err.message; desenharConexao(); }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rede]'); if (!b) return; const k = b.dataset.rede;
    if (k === 'criar') entrar(Rede.novoCodigo()); else if (k === 'retomar') entrar(lerLS('um-anel-sala')); else if (k === 'entrar') entrar($('#rede-codigo').value);
    else if (k === 'copiar-codigo') copiar(Rede.sala, 'Código copiado.'); else if (k === 'copiar-link') copiar(linkSala(), 'Link copiado. Quem abrir entra direto na sala.');
    else if (k === 'sair') { Rede.sair(); gravarLS('um-anel-sala-auto-' + papel, ''); desenharConexao(); aviso('Você saiu da sala.'); }
    else if (k === 'encerrar') { Rede.encerrar().then(() => { gravarLS('um-anel-sala-auto-' + papel, ''); desenharConexao(); aviso('Sala encerrada. Todos foram desconectados.'); }); }
    else if (k === 'expulsar') { const id = b.dataset.id, p = Rede.presentes.get(id); Rede.expulsar(id).then(() => { desenharConexao(); aviso(`${p ? p.nome : 'Jogador'} foi removido da sala.`); }); }
    else if (k === 'readmitir') { Rede.readmitir(b.dataset.id); desenharConexao(); aviso('Readmitido: ele já pode entrar de novo com o código.'); }
    else if (k === 'salvar-servidores') { const l = $('#rede-servidores').value.split('\n').map((x) => x.trim()).filter((x) => /^wss?:\/\//.test(x)); if (!l.length) return aviso('Informe ao menos um endereço ws:// ou wss://.'); Rede.brokers = l; gravarLS('um-anel-brokers', JSON.stringify(l)); aviso('Servidores salvos.'); }
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'rede-gm-visivel') gravarLS('um-anel-gm-visivel', e.target.checked ? '1' : '0'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'rede-codigo') entrar(e.target.value); });
  $('#rede-fechar').onclick = () => $('#dlg-rede').close();
  $('#dlg-rede').addEventListener('click', (e) => { if (e.target.id === 'dlg-rede') e.target.close(); });
  U.abrirConexao = abrirConexao; U.abrirFeed = abrirFeed;

  // ---------- eventos da rede ----------
  Rede.on('estado', () => { atualizarBotao(); if ($('#dlg-rede').open) desenharConexao(); });
  Rede.on('presenca', () => { atualizarBotao(); if ($('#dlg-rede').open) desenharConexao(); });
  Rede.on('msg', (env) => {
    if (papel === 'jogador' && env.p === 'gm' && (env.t === 'kick' || env.t === 'encerrar')) {
      Rede.sair(); gravarLS('um-anel-sala-auto-jogador', ''); aviso(env.t === 'kick' ? 'O Historiador removeu você da sala.' : 'O Historiador encerrou a sala.'); if ($('#dlg-rede').open) desenharConexao(); return;
    }
    if (env.t === 'rolagem') entrarNoFeed({ quem: env.d.nome || env.n, papel: env.p, r: env.d.r, ts: env.ts });
    (U.aoMensagem[env.t] || []).forEach((f) => f(env));
  });
  U.on = (t, f) => { (U.aoMensagem[t] = U.aoMensagem[t] || []).push(f); };
  atualizarBotao();

  // ---------- entrada automática (link com #sala=CÓDIGO ou sala anterior) ----------
  window.addEventListener('load', () => {
    const m = /sala=([A-Za-z0-9-]+)/.exec(location.hash);
    if (m && papel === 'jogador') { history.replaceState(null, '', location.pathname + location.search); entrar(m[1]); }
    else { const auto = lerLS('um-anel-sala-auto-' + papel); if (auto) entrar(auto); }
  });
})();
