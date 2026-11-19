// ============ Aba "Cenas" do jogador: vê o que o Historiador mostra e todas as rolagens da mesa ============
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FASES = { saraivada: 'Saraivadas de Abertura', posicao: 'Posição', engajamento: 'Engajamento', resolucao: 'Resolução' };
  const imgs = new Map(), pedidas = new Map(); let cena = null, gmId = null, ultimaCena = '', seguir = true;
  const meuNome = () => String((typeof state !== 'undefined' && state && state.nome) || '').trim();
  const visor = criarVisor($('#cena-visor'), { editavel: false, vazio: 'O Historiador ainda não mostrou nenhuma cena.', aoSelecionar: info,
    podeMover: (t) => !!(cena && cena.moverLivre && t.meu), encaixar: () => !!(cena && cena.encaixar),
    aoMover: (id, x, y) => { if (gmId && Rede.conectado()) Rede.enviar('token-mover', { id, x, y, heroi: meuNome() }, gmId); } });
  Palco.ligar($('#cena-visor'), visor, { chave: 'jogador', grade: document.querySelector('#vista-cenas .cena-grade') });
  RedeUI.cenaJogador = { visor, imgs, get cena() { return cena; } };
  RedeUI.feedVisivel = () => !$('#vista-cenas').hidden;
  RedeUI.montarFeed($('#cena-feed'));

  // ---------- ataque a partir do token: escolhe a arma, o Historiador autoriza, a rolagem sai com a sua ficha ----------
  let atq = null, selTok = null; // atq: { rid, tokenId, i, alvo, estado: 'esperando' | 'rolando' }
  const caixaAtq = document.createElement('div'); caixaAtq.id = 'cena-atq'; caixaAtq.className = 'cena-atq'; caixaAtq.setAttribute('aria-live', 'polite');
  $('#cena-info').insertAdjacentElement('afterend', caixaAtq);
  const armas = () => (typeof armaAtual === 'function' ? [0, 1, 2, 3].map((i) => [i, armaAtual(i)]).filter(([, a]) => a) : []);
  function pintarAtq() {
    const t = selTok && cena && cena.tokens.find((x) => x.id === selTok);
    if (!t || t.tp !== 'a' || t.fora || !Rede.conectado() || !gmId) { caixaAtq.hidden = true; caixaAtq.innerHTML = ''; return; }
    caixaAtq.hidden = false;
    if (atq && atq.tokenId === t.id) {
      caixaAtq.innerHTML = atq.estado === 'esperando' ? `<p class="atq-msg"><span class="atq-pulso" aria-hidden="true"></span>Aguardando o Historiador autorizar o ataque a <b>${esc(t.nome)}</b>…</p><button type="button" class="sec" data-atq="cancelar">Cancelar</button>` : `<p class="atq-msg">Rolando o ataque a <b>${esc(t.nome)}</b>…</p>`;
      return;
    }
    const ar = armas();
    caixaAtq.innerHTML = `<h4>Atacar ${esc(t.nome)}</h4>` + (ar.length ? `<div class="atq-armas">${ar.map(([i, a]) => `<button type="button" class="atq-arma" data-atq="arma" data-i="${i}"><b>${esc(a.n)}</b><small>Dano ${a.d} · Ferimento ${a.f}</small></button>`).join('')}</div><p class="nota">Usa as armas e os valores da sua ficha. O Historiador precisa autorizar a rolagem; o dano é aplicado ao acertar.</p>` : '<p class="nota">Escolha uma arma na sua ficha (seção de combate) para poder atacar.</p>');
  }
  caixaAtq.addEventListener('click', (e) => {
    const b = e.target.closest('[data-atq]'); if (!b) return;
    if (b.dataset.atq === 'cancelar') { if (atq) Rede.enviar('ataque-cancelar', { rid: atq.rid }, gmId); atq = null; return pintarAtq(); }
    const t = cena && cena.tokens.find((x) => x.id === selTok), i = +b.dataset.i, a = armaAtual(i); if (!t || !a || atq) return;
    atq = { rid: Math.random().toString(36).slice(2, 9), tokenId: t.id, i, alvo: t.nome, estado: 'esperando' };
    Rede.enviar('ataque-pedir', { rid: atq.rid, tokenId: t.id, alvo: t.nome, arma: a.n, heroi: (typeof state !== 'undefined' && state.nome) || 'Jogador' }, gmId); pintarAtq();
  });
  RedeUI.on('ataque-ok', (env) => {
    const d = env.d || {}; if (!atq || d.rid !== atq.rid) return; atq.estado = 'rolando'; pintarAtq();
    const bt = document.querySelector(`.atacar[data-i="${atq.i}"]`); if (!bt) { atq = null; return pintarAtq(); }
    bt.click(); const m = document.querySelector('#r-mod'); if (m) m.value = d.bloqueio || 0; // Bloqueio do adversário soma ao NA
    document.querySelector('#r-rolar').click();
  });
  RedeUI.on('ataque-negado', (env) => { const d = env.d || {}; if (!atq || d.rid !== atq.rid) return; atq = null; pintarAtq(); RedeUI.aviso(d.motivo || 'O Historiador não autorizou este ataque.'); });
  RedeUI.on('ataque-aplicado', (env) => { if (env.d && env.d.texto) RedeUI.aviso(env.d.texto); });
  // a rolagem normal da ficha avisa quando um ataque termina: manda o resultado ao Historiador, que aplica dano e ferimento
  window.aoAtaqueRolado = (r) => {
    if (!atq || atq.estado !== 'rolando') return; const a = r.arma || {};
    Rede.enviar('ataque-resultado', { rid: atq.rid, tokenId: atq.tokenId, heroi: (typeof state !== 'undefined' && state.nome) || 'Jogador', arma: a.n, dano: a.d, ferim: a.f, ok: !!r.ok, grau: r.grau, icones: r.icones || 0, pesado: r.atq ? r.atq.pesado : 0, perf: !!(r.atq && r.atq.perf) }, gmId);
    atq = null; setTimeout(pintarAtq, 0);
  };

  function info(id) {
    selTok = id;
    const t = cena && cena.tokens.find((x) => x.id === id), el = $('#cena-info'); if (!t) { el.textContent = ''; pintarAtq(); return; }
    const partes = [`${t.nome}`]; if (t.res != null) partes.push(`Resistência ${t.res}/${t.resMax}`); if (t.fora) partes.push('fora de combate'); if (t.estados?.length) partes.push(t.estados.join(', '));
    el.textContent = partes.join(' · '); pintarAtq();
  }
  const tentativas = new Map(), parciais = new Map();
  function pedir(keys) {
    const k = [...new Set(keys)].filter((x) => !imgs.has(x) && !parciais.has(x) && (!pedidas.get(x) || Date.now() - pedidas.get(x) > 6000)); if (!k.length || !gmId || !Rede.conectado()) return;
    k.forEach((x) => {
      pedidas.set(x, Date.now()); const t = (tentativas.get(x) || 0) + 1; tentativas.set(x, t);
      if (t <= 8) setTimeout(() => { if (!imgs.has(x) && !parciais.has(x)) pedir([x]); }, 6500); // nada chegou: pede de novo
    });
    k.forEach(async (x) => { if (!window.Nuvem) return; const src = await Nuvem.ler(Rede.sala, x); if (src && !imgs.has(x)) { imgs.set(x, src); aplicar(); } });
    Rede.enviar('cena-pedir', { keys: k }, gmId);
  }
  function retomar(key) {
    const m = parciais.get(key); if (!m || imgs.has(key)) return; if (++m.tent > 12) { parciais.delete(key); pedidas.delete(key); return; }
    const faltam = []; for (let i = 0; i < m.n; i++) if (m.p[i] === undefined) faltam.push(i);
    if (gmId && Rede.conectado()) Rede.enviar('cena-pedir', { faltam: { [key]: faltam } }, gmId); m.t = setTimeout(() => retomar(key), 3000);
  }
  RedeUI.on('cena-img-nuvem', async (env) => {
    const key = env.d && env.d.key; if (!key || imgs.has(key)) return;
    const src = window.Nuvem ? await Nuvem.ler(Rede.sala, key) : null;
    if (src) { imgs.set(key, src); aplicar(); } else if (gmId && Rede.conectado()) Rede.enviar('cena-pedir', { keys: [key], semNuvem: true }, gmId); // nuvem falhou: pede em pedaços
  });
  RedeUI.on('cena-img-p', (env) => {
    const { key, i, n, d } = env.d || {}; if (!key || imgs.has(key) || !(n > 0)) return;
    let m = parciais.get(key); if (!m) { m = { n, p: [], cnt: 0, tent: 0 }; parciais.set(key, m); }
    if (m.p[i] === undefined) { m.p[i] = d; m.cnt++; }
    clearTimeout(m.t); if (m.cnt >= m.n) { parciais.delete(key); imgs.set(key, m.p.join('')); aplicar(); return; }
    m.t = setTimeout(() => retomar(key), 2500);
  });
  function aplicar() {
    const faltam = [];
    if (!cena) { visor.definirFundo(null); visor.definirTokens([]); visor.definirTracos([]); $('#cena-titulo').textContent = 'Cenas'; $('#cena-combate').hidden = true; $('#cena-info').textContent = ''; return; }
    let fundo = null;
    if (cena.fundo) { if (cena.fundo.tipo === 'mapa') fundo = { tipo: 'mapa', modo: cena.fundo.modo }; else { const src = imgs.get(cena.fundo.key); if (src) fundo = { tipo: 'imagem', src, w: cena.fundo.w, h: cena.fundo.h }; else faltam.push(cena.fundo.key); } }
    visor.definirFundo(fundo);
    visor.definirTokens(cena.tokens.map((t) => { const src = t.k ? imgs.get(t.k) : ''; if (t.k && !src) faltam.push(t.k); return { ...t, img: src || '', meu: t.tp === 'h' && !!meuNome() && String(t.nome).trim() === meuNome() }; }));
    visor.definirTracos(cena.desenhos || []);
    pedir(faltam); $('#cena-titulo').textContent = cena.titulo || 'Cena';
    const c = cena.combate, box = $('#cena-combate');
    if (c && c.ativo) { box.hidden = false; box.innerHTML = `<div class="cena-rodada"><small>Rodada</small><b>${c.fase === 'saraivada' ? '–' : c.rodada}</b></div><div><strong>${esc(FASES[c.fase] || '')}</strong><ol class="cena-ordem">${(c.ordem || []).map((o) => `<li class="${o.agiu ? 'feito' : ''}${o.tp === 'a' ? ' adv' : ''}${o.fora ? ' fora' : ''}">${esc(o.nome)}</li>`).join('')}</ol></div>`; } else box.hidden = true;
    if (seguir && cena.vista) visor.irPara(cena.vista);
    if (visor.selecionado() && !cena.tokens.find((t) => t.id === visor.selecionado())) { visor.selecionar(null); $('#cena-info').textContent = ''; } else if (visor.selecionado()) info(visor.selecionado());
  }
  function avisoConexao() { $('#cena-aviso').innerHTML = Rede.conectado() ? (cena ? '' : 'Conectado à sala. Quando o Historiador mostrar uma cena, ela aparece aqui.') : 'Você não está conectado a uma sala. <button type="button" class="link-btn" id="cena-conectar">Conectar à mesa</button> para ver as cenas e as rolagens dos outros jogadores.'; }
  document.addEventListener('click', (e) => { if (e.target.id === 'cena-conectar') RedeUI.abrirConexao(); });
  Rede.on('estado', avisoConexao); avisoConexao();

  RedeUI.on('cena', (env) => {
    gmId = env.de; const nova = !cena || cena.id !== env.d.id; cena = env.d; aplicar(); avisoConexao(); pintarAtq();
    const marca = JSON.stringify([env.d.id, env.d.fundo]); if (marca !== ultimaCena) { ultimaCena = marca; if ($('#vista-cenas').hidden) RedeUI.aviso('O Historiador mostrou uma cena. Abra a aba Cenas.'); }
  });
  RedeUI.on('cena-img', (env) => { imgs.set(env.d.key, env.d.src); aplicar(); });
  RedeUI.on('cena-fim', () => { cena = null; ultimaCena = ''; aplicar(); avisoConexao(); });
  RedeUI.on('cena-foco', (env) => { if (cena) visor.irPara(env.d.vista); });
  $('#cena-seguir').checked = seguir; $('#cena-seguir').onchange = (e) => { seguir = e.target.checked; if (seguir && cena && cena.vista) visor.irPara(cena.vista); };
  $('#cena-ajustar').onclick = () => visor.ajustar();
  // ao entrar na sala depois que o Historiador já estava projetando, pede o estado atual
  Rede.on('presenca', (p) => { if (!cena && [...p.values()].some((x) => x.papel === 'gm')) Rede.enviar('cena-pedir', { keys: [], estado: true }); });
})();
