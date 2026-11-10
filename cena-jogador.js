// ============ Aba "Cenas" do jogador: vê o que o Historiador mostra, rolagens da mesa e permite selecionar adversário para atacar com autorização do Historiador ============
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FASES = { saraivada: 'Saraivadas de Abertura', posicao: 'Posição', engajamento: 'Engajamento', resolucao: 'Resolução' };
  const imgs = new Map(), pedidas = new Map();
  let cena = null, gmId = null, ultimaCena = '', seguir = false, pedidoPendente = null, ultResultadoHtml = '';
  const visor = criarVisor($('#cena-visor'), { editavel: false, vazio: 'O Historiador ainda não mostrou nenhuma cena.', aoSelecionar: info });
  RedeUI.cenaJogador = { visor, imgs, get cena() { return cena; } };
  RedeUI.feedVisivel = () => !$('#vista-cenas').hidden;
  RedeUI.montarFeed($('#cena-feed'));

  function info(id) {
    const t = cena && cena.tokens.find((x) => x.id === id), el = $('#cena-info');
    if (!t) {
      el.textContent = '';
      renderPainelAtaque(null);
      return;
    }
    const partes = [`${t.nome}`];
    if (t.res != null) partes.push(`Resistência ${t.res}/${t.resMax}`);
    if (t.bloqueio != null) partes.push(`Bloqueio ${t.bloqueio >= 0 ? '+' + t.bloqueio : t.bloqueio}`);
    if (t.fora) partes.push('fora de combate');
    if (t.estados?.length) partes.push(t.estados.join(', '));
    el.textContent = partes.join(' · ');
    renderPainelAtaque(t.tp === 'a' ? t : null);
  }

  function pedir(keys) {
    const k = [...new Set(keys)].filter((x) => { const t = pedidas.get(x); return !t || Date.now() - t > 1800; });
    if (!k.length || !gmId || !Rede.conectado()) return;
    k.forEach((x) => pedidas.set(x, Date.now()));
    Rede.enviar('cena-pedir', { keys: k }, gmId);
  }

  // Re-solicita imagens pendentes caso ainda não tenham chegado
  setInterval(() => {
    if (!cena || !gmId || !Rede.conectado()) return;
    const faltam = [];
    if (cena.fundo && cena.fundo.tipo !== 'mapa' && cena.fundo.key && !imgs.has(cena.fundo.key)) faltam.push(cena.fundo.key);
    (cena.tokens || []).forEach((t) => { if (t.k && !imgs.has(t.k)) faltam.push(t.k); });
    if (faltam.length) pedir(faltam);
  }, 1900);

  function armasDaFicha() {
    if (typeof armaAtual !== 'function') return [];
    const lista = [0, 1, 2, 3].map((i) => [i, armaAtual(i)]).filter(([, a]) => a);
    if (lista.length) return lista;
    const des = typeof ARMAS !== 'undefined' ? ARMAS.find((x) => x.n === 'Desarmado') : null;
    return [[0, des ? { ...des, mao: 1, duas: false, d: des.d, f: '–', afiada: false } : { n: 'Desarmado', p: 'Briga', mao: 1, duas: false, d: 1, f: '–', afiada: false }]];
  }

  function renderChipsAlvos() {
    let barra = $('#cena-alvos-bar');
    if (!barra) {
      const palco = $('#cena-visor')?.parentElement;
      if (!palco) return;
      barra = document.createElement('div');
      barra.id = 'cena-alvos-bar';
      barra.className = 'cena-alvos-bar';
      palco.insertBefore(barra, $('#cena-visor'));
    }
    const advs = (cena?.tokens || []).filter((t) => t.tp === 'a');
    if (!advs.length) { barra.hidden = true; barra.innerHTML = ''; return; }
    barra.hidden = false;
    const selId = visor.selecionado();
    barra.innerHTML = `<span class="cena-alvos-rot">⚔ Selecione um adversário para atacar:</span>` +
      advs.map((t) => `<button type="button" class="sec mini chip-alvo-cena${t.id === selId ? ' on' : ''}${t.fora ? ' fora' : ''}" data-sel-tok="${esc(t.id)}">${esc(t.nome)}${t.res != null ? ` <small>(${t.res}/${t.resMax})</small>` : ''}</button>`).join('');
  }

  function renderPainelAtaque(t) {
    renderChipsAlvos();
    let box = $('#cena-ataque');
    if (!box) {
      const lado = document.querySelector('#vista-cenas .cena-lado');
      if (!lado) return;
      box = document.createElement('section');
      box.id = 'cena-ataque';
      box.className = 'cena-ataque';
      lado.insertBefore(box, lado.querySelector('h3'));
    }
    if (!t || t.tp !== 'a') {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;

    const armas = armasDaFicha();
    const naF = (typeof naDe === 'function' && naDe('forca') != null) ? naDe('forca') : 15;
    const bloq = Number(t.bloqueio) || 0;
    const naTotal = naF + bloq;
    const pst = (typeof POSTURAS !== 'undefined' && POSTURAS.find((x) => x.id === state?.postura)) || null;
    const espDisp = (typeof num === 'function' && num('esp_atual') != null) ? num('esp_atual') : 0;
    const forcaNiv = (typeof num === 'function' && num('forca_nivel') != null) ? num('forca_nivel') : 5;
    const mi = typeof tem === 'function' && tem('maos');

    const opcoesArmas = armas.map(([idx, a]) => {
      const prof = a.p === 'Briga'
        ? Math.max(...(typeof PROFS !== 'undefined' ? PROFS.map((p) => (typeof num === 'function' ? num('p_' + p) || 0 : 0)) : [0]))
        : (typeof num === 'function' ? num('p_' + a.p) || 0 : 0);
      return `<option value="${idx}">${esc(a.n)} (${esc(a.p)} ${prof}d · Dano ${a.d} · Ferim. ${a.f}${a.duas ? ' · 2 mãos' : ''})</option>`;
    }).join('');

    box.innerHTML = `
      <div class="ca-topo">
        <h4>⚔ Atacar ${esc(t.nome)}</h4>
        <button type="button" class="link-btn" id="ca-fechar" aria-label="Fechar opções de ataque">Fechar</button>
      </div>
      <p class="nota">
        NA de Força <b>${naF}</b> + Bloqueio <b>${bloq >= 0 ? '+' + bloq : bloq}</b> = <b>NA ${naTotal}</b>
        ${t.res != null ? ` · Resistência <b>${t.res}/${t.resMax}</b>` : ''}
        ${pst ? ` · Posição: <b>${esc(pst.nome)}</b>` : ''}
      </p>
      <div class="ca-campos">
        <label class="campo">Arma da sua ficha
          <select id="ca-arma">${opcoesArmas}</select>
        </label>
        <div class="duplo">
          <label class="campo">Posição
            <select id="ca-postura">
              <option value="">Sem posição</option>
              ${(typeof POSTURAS !== 'undefined' ? POSTURAS : []).map((p) => `<option value="${p.id}"${state?.postura === p.id ? ' selected' : ''}>${esc(p.nome)} (${p.mod > 0 ? '+1d' : p.mod < 0 ? '−1d' : '0d'})</option>`).join('')}
            </select>
          </label>
          <label class="campo">Modo
            <select id="ca-modo">
              <option value="n">Normal</option>
              <option value="f">Favorecida</option>
              <option value="d">Desfavorecida</option>
            </select>
          </label>
        </div>
        <label class="campo">Dados extras (além da posição)
          <input type="number" id="ca-extra" value="0" min="-5" max="6">
        </label>
        <label class="cond"><input type="checkbox" id="ca-esp" ${espDisp <= 0 ? 'disabled' : ''}> Gastar 1 Esperança (+1d; restam ${espDisp})</label>
        <label class="cond"><input type="checkbox" id="ca-insp" ${(typeof tem === 'function' && tem('coragem') && (state?.arrasado || state?.exausto || state?.ferido)) ? 'checked' : ''}> Inspirado (+2d ao gastar Esperança)</label>
        <label class="cond"><input type="checkbox" id="ca-auto-efx" checked> Gastar ícones (6) automaticamente em Perfurar / Golpe Pesado (+${forcaNiv + (mi ? 1 : 0)} dano)</label>
      </div>
      ${pedidoPendente ? `
        <div class="ca-aguardando" role="status">
          <span>⏳ Aguardando autorização do Historiador na tela dele…</span>
          <button type="button" class="sec mini" id="ca-cancelar">Cancelar</button>
        </div>
      ` : `
        <button type="button" id="ca-rolar" class="grande">⚔ Rolar ataque (pedir autorização ao Historiador)</button>
      `}
      <div id="ca-res">${ultResultadoHtml}</div>
    `;

    const atualizarModoPadrao = () => {
      const idx = +($('#ca-arma')?.value || 0);
      const par = armas.find(([i]) => i === idx) || armas[0];
      const a = par[1];
      const favAlvo = typeof tem === 'function' && tem('alvo') && a.p === 'Arcos';
      const sombraAlta = state?._max_esp != null && ((typeof num === 'function' ? num('sombra') : 0) || 0) >= state._max_esp;
      const selModo = $('#ca-modo');
      if (selModo) selModo.value = favAlvo ? (sombraAlta ? 'n' : 'f') : (sombraAlta ? 'd' : 'n');
    };
    atualizarModoPadrao();

    $('#ca-arma')?.addEventListener('change', atualizarModoPadrao);
    $('#ca-postura')?.addEventListener('change', (e) => {
      if (typeof state !== 'undefined') {
        state.postura = e.target.value;
        if (typeof aplicar === 'function') aplicar();
        if (typeof salvar === 'function') salvar();
      }
    });
    $('#ca-fechar')?.addEventListener('click', () => {
      visor.selecionar(null);
      $('#cena-info').textContent = '';
      ultResultadoHtml = '';
      renderPainelAtaque(null);
    });
    $('#ca-cancelar')?.addEventListener('click', () => {
      pedidoPendente = null;
      renderPainelAtaque(t);
    });
    $('#ca-rolar')?.addEventListener('click', () => enviarPedidoAtaque(t, armas));
  }

  function enviarPedidoAtaque(t, armas) {
    if (!Rede.conectado()) {
      RedeUI.aviso('Conecte-se à sala do Historiador para solicitar a rolagem de ataque.');
      return;
    }
    const idx = +($('#ca-arma')?.value || 0);
    const par = armas.find(([i]) => i === idx) || armas[0];
    const a = par[1];
    const prof = a.p === 'Briga'
      ? Math.max(...(typeof PROFS !== 'undefined' ? PROFS.map((p) => (typeof num === 'function' ? num('p_' + p) || 0 : 0)) : [0]))
      : (typeof num === 'function' ? num('p_' + a.p) || 0 : 0);
    const pstId = $('#ca-postura')?.value ?? state?.postura ?? '';
    const pst = (typeof POSTURAS !== 'undefined' && POSTURAS.find((x) => x.id === pstId)) || null;
    const modPostura = (a.p === 'Briga' ? -1 : 0) + (pst ? pst.mod : 0);
    const extraManual = parseInt($('#ca-extra')?.value || '0', 10) || 0;
    const gastarEsp = !!$('#ca-esp')?.checked;
    const inspirado = !!$('#ca-insp')?.checked;
    const bonusEsp = gastarEsp ? (inspirado ? 2 : 1) : 0;
    const dados = Math.max(0, prof + modPostura + extraManual + bonusEsp);
    const modo = $('#ca-modo')?.value || 'n';
    const naForca = (typeof naDe === 'function' && naDe('forca') != null) ? naDe('forca') : 15;
    const forcaNivel = (typeof num === 'function' && num('forca_nivel') != null) ? num('forca_nivel') : 5;

    const reqId = 'atq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const pedido = {
      reqId,
      heroiId: Rede.id,
      heroiNome: (state?.nome || Rede.nome || 'Jogador').trim(),
      advTokenId: t.id,
      advRef: t.ref,
      advNome: t.nome,
      arma: { n: a.n, p: a.p, d: Number(a.d) || 0, f: a.f, mao: a.mao, duas: !!a.duas, afiada: !!a.afiada },
      postura: pstId,
      posturaNome: pst ? pst.nome : 'Sem posição',
      profDados: prof,
      modPostura,
      extraManual,
      gastarEsp,
      inspirado,
      dados,
      modo,
      naForca,
      bloqueioAdv: Number(t.bloqueio) || 0,
      forcaNivel,
      exausto: !!state?.exausto,
      arrasado: !!state?.arrasado,
      usarIcones: !!$('#ca-auto-efx')?.checked,
      maosInclementes: typeof tem === 'function' && tem('maos'),
      disparoFeroz: typeof tem === 'function' && tem('disparo') && a.p === 'Arcos',
      luzirIra: typeof tem === 'function' && tem('luzir')
    };

    pedidoPendente = pedido;
    ultResultadoHtml = '';
    Rede.enviar('ataque-pedir', pedido, gmId || null);
    renderPainelAtaque(t);
  }

  RedeUI.on('ataque-resultado', (env) => {
    const d = env.d || {};
    if (d.heroiId && d.heroiId !== Rede.id && d.heroiNome !== (state?.nome || '').trim()) return;
    const eraMeu = pedidoPendente && pedidoPendente.reqId === d.reqId;
    if (eraMeu && !d.recusado && pedidoPendente.gastarEsp && typeof state !== 'undefined') {
      const atual = (typeof num === 'function' ? num('esp_atual') : parseInt(state.esp_atual, 10)) || 0;
      state.esp_atual = String(Math.max(0, atual - 1));
      if (typeof aplicar === 'function') aplicar();
      if (typeof salvar === 'function') salvar();
    }
    pedidoPendente = null;

    if (d.recusado) {
      ultResultadoHtml = `<p class="alerta">✕ O Historiador recusou esta rolagem de ataque.</p>`;
      RedeUI.aviso('O Historiador recusou a rolagem de ataque.');
    } else if (d.rolagem) {
      const card = window.htmlResultado ? window.htmlResultado(d.rolagem) : '';
      const det = [d.resumoDano, d.resumoProtecao].filter(Boolean).map((s) => `<p class="nota"><b>${esc(s)}</b></p>`).join('');
      ultResultadoHtml = `${card}${det}`;
      RedeUI.aviso(d.resumoCurto || 'Ataque autorizado e rolado!');
    }
    const selId = visor.selecionado();
    const tok = cena && cena.tokens.find((x) => x.id === selId);
    renderPainelAtaque(tok && tok.tp === 'a' ? tok : null);
  });

  function aplicar() {
    const faltam = [];
    if (!cena) { visor.definirFundo(null); visor.definirTokens([]); $('#cena-titulo').textContent = 'Cenas'; $('#cena-combate').hidden = true; $('#cena-info').textContent = ''; renderPainelAtaque(null); return; }
    let fundo = null;
    if (cena.fundo) { if (cena.fundo.tipo === 'mapa') fundo = { tipo: 'mapa', modo: cena.fundo.modo }; else { const src = imgs.get(cena.fundo.key); if (src) fundo = { tipo: 'imagem', src, w: cena.fundo.w, h: cena.fundo.h }; else faltam.push(cena.fundo.key); } }
    visor.definirFundo(fundo);
    visor.definirTokens(cena.tokens.map((t) => { const src = t.k ? imgs.get(t.k) : ''; if (t.k && !src) faltam.push(t.k); return { ...t, img: src || '' }; }));
    pedir(faltam); $('#cena-titulo').textContent = cena.titulo || 'Cena';
    const c = cena.combate, box = $('#cena-combate');
    if (c && c.ativo) { box.hidden = false; box.innerHTML = `<div class="cena-rodada"><small>Rodada</small><b>${c.fase === 'saraivada' ? '–' : c.rodada}</b></div><div><strong>${esc(FASES[c.fase] || '')}</strong><ol class="cena-ordem">${(c.ordem || []).map((o) => `<li class="${o.agiu ? 'feito' : ''}${o.tp === 'a' ? ' adv' : ''}${o.fora ? ' fora' : ''}">${esc(o.nome)}</li>`).join('')}</ol></div>`; } else box.hidden = true;
    if (seguir && cena.vista) visor.irPara(cena.vista);
    if (visor.selecionado() && !cena.tokens.find((t) => t.id === visor.selecionado())) { visor.selecionar(null); $('#cena-info').textContent = ''; renderPainelAtaque(null); } else if (visor.selecionado()) info(visor.selecionado()); else renderChipsAlvos();
  }
  function avisoConexao() { $('#cena-aviso').innerHTML = Rede.conectado() ? (cena ? '' : 'Conectado à sala. Quando o Historiador mostrar uma cena, ela aparece aqui.') : 'Você não está conectado a uma sala. <button type="button" class="link-btn" id="cena-conectar">Conectar à mesa</button> para ver as cenas e as rolagens dos outros jogadores.'; }
  document.addEventListener('click', (e) => {
    if (e.target.id === 'cena-conectar') RedeUI.abrirConexao();
    const btAlvo = e.target.closest('[data-sel-tok]');
    if (btAlvo && cena) {
      const id = btAlvo.dataset.selTok;
      visor.selecionar(id);
      info(id);
    }
  });
  Rede.on('estado', avisoConexao); avisoConexao();

  RedeUI.on('cena', (env) => {
    gmId = env.de; cena = env.d; aplicar(); avisoConexao();
    const marca = JSON.stringify([env.d.id, env.d.fundo]); if (marca !== ultimaCena) { ultimaCena = marca; if ($('#vista-cenas').hidden) RedeUI.aviso('O Historiador mostrou uma cena. Abra a aba Cenas.'); }
  });
  RedeUI.on('cena-img', (env) => { imgs.set(env.d.key, env.d.src); aplicar(); });
  RedeUI.on('cena-fim', () => { cena = null; ultimaCena = ''; pedidoPendente = null; ultResultadoHtml = ''; aplicar(); avisoConexao(); });
  RedeUI.on('cena-foco', (env) => { if (cena) visor.irPara(env.d.vista); });
  $('#cena-seguir').onchange = (e) => { seguir = e.target.checked; if (seguir && cena && cena.vista) visor.irPara(cena.vista); };
  $('#cena-ajustar').onclick = () => visor.ajustar();
  // ao entrar na sala depois que o Historiador já estava projetando, pede o estado atual
  Rede.on('presenca', (p) => { if (!cena && [...p.values()].some((x) => x.papel === 'gm')) Rede.enviar('cena-pedir', { keys: [], estado: true }); });
})();
