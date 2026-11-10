// ============ Cenas do Historiador: mapa ou imagem com tokens por cima, mostrado aos jogadores ============
(() => {
  const C = () => mesa.cena, esc2 = esc;
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + s.length.toString(36); };
  const imgPorKey = new Map(); let visor = null, sel = null, tSync, tVista;
  C().ativa = false; // a cena sempre volta oculta ao abrir a página

  // ---------- tokens da cena ----------
  function resolver(t) {
    if (t.tp === 'h') { const h = mesa.herois[t.ref]; if (!h) return null; const d = derivar(h.ficha);
      return { id: t.id, tp: 'h', ref: t.ref, nome: h.nome, x: t.x, y: t.y, esc: t.esc || 1, img: h.ficha.retrato || '', cor: COR_HEROI, pct: d.resMax ? Math.round(h.res / d.resMax * 100) : null, res: h.res, resMax: d.resMax, fora: h.res <= 0, badges: [h.exausto && 'E', h.arrasado && 'A', h.ferido && 'F'].filter(Boolean), estados: COND.filter(([k]) => h[k]).map(([, n]) => n), oculto: !!t.oculto }; }
    const a = mesa.advs.find((x) => x.id === t.ref); if (!a) return null;
    return { id: t.id, tp: 'a', ref: t.ref, nome: a.nome, x: t.x, y: t.y, esc: t.esc || 1, img: a.img || '', cor: a.cor, pct: a.resMax ? Math.round(a.res / a.resMax * 100) : null, res: a.res, resMax: a.resMax, fora: a.res <= 0, badges: a.feridas ? ['F'] : [], estados: [], oculto: !!t.oculto, bloqueio: a.bloqueio, armadura: a.armadura, poder: a.poder, feridas: a.feridas };
  }
  const tokensGM = () => C().tokens.map(resolver).filter(Boolean);
  const fundoLocal = () => { const f = C().fundo; return !f || f.tipo === 'nenhum' ? null : f.tipo === 'mapa' ? { tipo: 'mapa', modo: f.modo } : { tipo: 'imagem', src: f.src, w: f.w, h: f.h }; };

  // ---------- estrutura ----------
  function montar() {
    $('#v-cenas').innerHTML = `<header class="mesa-topo"><h2>Cenas</h2><div class="acoes"><button type="button" id="cena-proj" aria-pressed="false">Mostrar aos jogadores</button><button type="button" class="sec" id="cena-foco">Levar os jogadores a esta vista</button></div></header>
      <div class="cena-barra"><div class="grupo-b" role="radiogroup" aria-label="Fundo da cena"><button type="button" role="radio" data-fundo="jogadores">Mapa dos jogadores</button><button type="button" role="radio" data-fundo="historiador">Mapa do Historiador</button><button type="button" role="radio" data-fundo="imagem">Imagem…</button><button type="button" role="radio" data-fundo="nenhum">Sem fundo</button></div>
        <label class="cond-lbl"><input type="checkbox" id="cena-encaixar"> Encaixar nos hexágonos</label><label class="cond-lbl"><input type="checkbox" id="cena-vida"> Mostrar a vida dos adversários</label><label class="cond-lbl"><input type="checkbox" id="cena-ao-vivo"> Transmitir minha vista</label>
        <label class="campo cena-tit">Título<input id="cena-titulo-in" autocomplete="off"></label></div>
      <div class="cena-grade"><div class="cena-palco"><div id="cena-visor-gm"></div><div id="cena-sel" class="cena-sel" aria-live="polite"></div></div>
        <aside class="cena-lado"><h3>Colocar na cena</h3><div id="cena-paleta"></div><div id="cena-combate-gm" class="cena-combate-gm"></div><h3>Rolagens da mesa</h3><ol id="cena-feed-gm" class="rede-feed-lista cena-feed"></ol></aside></div>`;
    visor = criarVisor($('#cena-visor-gm'), { editavel: true, vazio: 'Escolha um fundo e coloque os tokens.', encaixar: () => C().encaixar,
      aoSelecionar: (id) => { sel = id; renderSel(); }, aoAbrir: (id) => { const t = C().tokens.find((x) => x.id === id); if (t) abrirToken(t.tp, t.ref); },
      aoMover: (id, x, y) => { const t = C().tokens.find((q) => q.id === id); if (t) { t.x = x; t.y = y; salvar(); sincronizar(); } },
      aoVista: () => { if (C().aoVivo) { clearTimeout(tVista); tVista = setTimeout(() => sincronizar(), 250); } } });
    RedeUI.montarFeed($('#cena-feed-gm'));
    atualizar();
  }
  RedeUI.feedVisivel = () => !$('#v-cenas').hidden;

  // ---------- atualização da tela ----------
  function atualizar() {
    if (!visor) return; const c = C();
    $$('[data-fundo]').forEach((b) => { const on = (c.fundo?.tipo === 'mapa' && b.dataset.fundo === c.fundo.modo) || (c.fundo?.tipo === 'imagem' && b.dataset.fundo === 'imagem') || (!c.fundo || c.fundo.tipo === 'nenhum') && b.dataset.fundo === 'nenhum'; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    $('#cena-proj').setAttribute('aria-pressed', String(c.ativa)); $('#cena-proj').textContent = c.ativa ? 'Parar de mostrar' : 'Mostrar aos jogadores'; $('#cena-proj').classList.toggle('on', c.ativa);
    const set = (id, v) => { const e = $('#' + id); if (e && e !== document.activeElement) e.checked = v; };
    set('cena-encaixar', c.encaixar); set('cena-vida', c.mostrarVida); set('cena-ao-vivo', c.aoVivo); if ($('#cena-titulo-in') !== document.activeElement) $('#cena-titulo-in').value = c.titulo;
    $('[data-fundo="jogadores"]').parentElement.nextElementSibling.hidden = false;
    visor.definirFundo(fundoLocal()); visor.definirTokens(tokensGM()); renderPaleta(); renderSel(); renderCombateGM();
  }
  function renderPaleta() {
    const naCena = new Set(C().tokens.map((t) => t.ref)), item = (tp, e) => `<li><button type="button" class="pal-item${naCena.has(e.id) ? ' na-cena' : ''}" data-pal="${tp}:${e.id}" aria-label="${naCena.has(e.id) ? 'Tirar' : 'Colocar'} ${esc2(e.nome)} ${naCena.has(e.id) ? 'da' : 'na'} cena">${avatar(tp, e, 'mini')} <span class="pal-nome">${esc2(e.nome)}</span> <small>${naCena.has(e.id) ? 'tirar' : '+ colocar'}</small></button></li>`;
    const hs = Object.values(mesa.herois), as = mesa.advs;
    $('#cena-paleta').innerHTML = `<ul class="pal-lista"><li class="pal-t">Heróis</li>${hs.map((h) => item('h', h)).join('') || '<li class="nota">Nenhum herói (importe na Companhia ou aguarde os jogadores se conectarem).</li>'}<li class="pal-t">Adversários em jogo</li>${as.map((a) => item('a', a)).join('') || '<li class="nota">Adicione adversários pela aba Adversários.</li>'}</ul>`;
  }
  function renderSel() {
    const t = sel && C().tokens.find((x) => x.id === sel), d = t && resolver(t), el = $('#cena-sel');
    if (!t || !d) { el.innerHTML = '<p class="nota">Toque num token para selecioná-lo. Dê dois toques para abrir o painel dele (ataques, vida, condições).</p>'; return; }
    el.innerHTML = `<strong>${esc2(d.nome)}</strong> <span class="nota">${d.tp === 'a' ? (t.oculto ? 'oculto dos jogadores' : 'visível aos jogadores') : ''}</span>
      <div class="ch-acoes"><button type="button" data-csel="abrir">Abrir painel</button><button type="button" class="sec" data-csel="maior" aria-label="Aumentar o token">Maior</button><button type="button" class="sec" data-csel="menor" aria-label="Diminuir o token">Menor</button>${d.tp === 'a' ? `<button type="button" class="sec" data-csel="ocultar">${t.oculto ? 'Mostrar aos jogadores' : 'Ocultar dos jogadores'}</button>` : ''}<button type="button" class="sec perigo" data-csel="remover">Tirar da cena</button></div>`;
  }
  function renderCombateGM() {
    const c = mesa.combate, el = $('#cena-combate-gm');
    el.innerHTML = c.ativo ? `<p><strong>Rodada ${c.fase === 'saraivada' ? '–' : c.rodada}</strong> · ${esc2(FASES.find(([id]) => id === c.fase)[1])}</p><button type="button" data-acao="proxima">Próxima fase</button>` : '<button type="button" class="sec" data-acao="iniciar">Iniciar combate</button>';
  }

  // ---------- ações ----------
  function colocar(tp, ref) {
    if (C().tokens.some((t) => t.ref === ref)) { C().tokens = C().tokens.filter((t) => t.ref !== ref); if (sel && !C().tokens.find((t) => t.id === sel)) sel = null; }
    else { let [x, y] = visor.centro(); const j = () => (Math.random() - 0.5) * 120; x += j(); y += j(); C().tokens.push({ id: 't' + uid(), tp, ref, x: Math.round(x), y: Math.round(y), esc: 1, oculto: false }); }
    salvar(); atualizar(); sincronizar();
  }
  function lerImagem(file, max) { return reduzirImagem(file, max).then((src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok({ src, w: im.width, h: im.height }); im.onerror = no; im.src = src; })); }
  document.addEventListener('click', (e) => {
    const t = e.target;
    const f = t.closest('[data-fundo]'); if (f) { const k = f.dataset.fundo; if (k === 'imagem') { $('#arq-cena-img').value = ''; $('#arq-cena-img').click(); } else { C().fundo = k === 'nenhum' ? { tipo: 'nenhum' } : { tipo: 'mapa', modo: k }; salvar(); atualizar(); sincronizar(); } return; }
    const p = t.closest('[data-pal]'); if (p) { const [tp, ref] = p.dataset.pal.split(':'); colocar(tp, ref); return; }
    const s = t.closest('[data-csel]'); if (s) { const tk = C().tokens.find((x) => x.id === sel); if (!tk) return; const k = s.dataset.csel;
      if (k === 'abrir') abrirToken(tk.tp, tk.ref); else if (k === 'maior') tk.esc = Math.min(4, +((tk.esc || 1) + 0.25).toFixed(2)); else if (k === 'menor') tk.esc = Math.max(0.5, +((tk.esc || 1) - 0.25).toFixed(2)); else if (k === 'ocultar') tk.oculto = !tk.oculto; else if (k === 'remover') { C().tokens = C().tokens.filter((x) => x.id !== sel); sel = null; visor.selecionar(null); }
      salvar(); atualizar(); sincronizar(); return; }
    if (t.id === 'cena-proj') { C().ativa = !C().ativa; if (C().ativa) { if (!redeOn()) { C().ativa = false; RedeUI.aviso('Conecte-se a uma sala (botão de sinal na barra) para mostrar a cena aos jogadores.'); RedeUI.abrirConexao(); } else { enviarCena(true); Rede.enviar('cena-foco', { vista: visor.vista() }); RedeUI.aviso('Cena visível para os jogadores.'); } } else if (redeOn()) { Rede.enviar('cena-fim', {}); RedeUI.aviso('Cena oculta dos jogadores.'); } atualizar(); return; }
    if (t.id === 'cena-foco') { if (!redeOn()) return RedeUI.aviso('Conecte-se a uma sala primeiro.'); if (!C().ativa) { C().ativa = true; atualizar(); enviarCena(true); } Rede.enviar('cena-foco', { vista: visor.vista() }); RedeUI.aviso('Jogadores levados a esta vista.'); return; }
  });
  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'cena-encaixar') { C().encaixar = t.checked; salvar(); } else if (t.id === 'cena-vida') { C().mostrarVida = t.checked; salvar(); sincronizar(); } else if (t.id === 'cena-ao-vivo') { C().aoVivo = t.checked; salvar(); sincronizar(); }
    else if (t.id === 'cena-titulo-in') { C().titulo = t.value.trim() || 'Cena'; salvar(); sincronizar(); }
    else if (t.id === 'arq-cena-img') { const f = t.files[0]; if (!f) return; try { const im = await lerImagem(f, 1600); C().fundo = { tipo: 'imagem', ...im }; C().tokens.forEach((k) => { k.x = Math.min(k.x, im.w); k.y = Math.min(k.y, im.h); }); salvar(); atualizar(); sincronizar(true, true); } catch { RedeUI.aviso('Não consegui ler essa imagem.'); } }
  });

  // ---------- sincronização com os jogadores ----------
  function sincronizar(agora, comImgs) { if (!C().ativa || !redeOn()) return; clearTimeout(tSync); tSync = setTimeout(() => enviarCena(comImgs), agora ? 0 : 150); }
  function chaveImg(src) { if (!src) return ''; const k = 'i' + hash(src); imgPorKey.set(k, src); return k; }
  function dadosCena() {
    const c = C(), f = c.fundo;
    const fundo = !f || f.tipo === 'nenhum' ? null : f.tipo === 'mapa' ? { tipo: 'mapa', modo: f.modo } : { tipo: 'imagem', key: chaveImg(f.src), w: f.w, h: f.h };
    const tokens = tokensGM().filter((t) => !t.oculto).map((t) => {
      const vida = t.tp === 'h' || c.mostrarVida;
      return {
        id: t.id, tp: t.tp, ref: t.ref, nome: t.nome, x: t.x, y: t.y, esc: t.esc, cor: t.cor, k: chaveImg(t.img),
        pct: vida ? t.pct : null, res: vida ? t.res : null, resMax: vida ? t.resMax : null,
        fora: t.fora, badges: t.tp === 'h' ? t.badges : [], estados: t.tp === 'h' ? t.estados : [],
        bloqueio: t.tp === 'a' ? t.bloqueio : null, armadura: t.tp === 'a' ? t.armadura : null,
        poder: t.tp === 'a' ? t.poder : null, feridas: t.tp === 'a' ? t.feridas : null
      };
    });
    const cb = mesa.combate, escondidos = new Set(c.tokens.filter((t) => t.tp === 'a' && t.oculto).map((t) => t.ref));
    const ordem = cb.ativo ? [...LANES.flatMap(([id]) => Object.values(mesa.herois).filter((h) => (h.postura || '') === id).map((h) => ({ nome: h.nome, tp: 'h', agiu: h.agiu, fora: h.res <= 0 }))), ...mesa.advs.filter((a) => a.zona !== 'reserva' && !escondidos.has(a.id)).map((a) => ({ nome: a.nome, tp: 'a', agiu: a.agiu, fora: a.res <= 0 }))] : [];
    return { id: c.id, titulo: c.titulo, fundo, tokens, combate: { ativo: cb.ativo, rodada: cb.rodada, fase: cb.fase, ordem }, vista: c.aoVivo && visor ? visor.vista() : null };
  }
  function enviarCena(incluirImg) {
    if (!C().ativa || !redeOn()) return;
    const d = dadosCena();
    Rede.enviar('cena', d);
    if (incluirImg && d.fundo?.tipo === 'imagem' && d.fundo.key) {
      const src = imgPorKey.get(d.fundo.key);
      if (src) Rede.enviar('cena-img', { key: d.fundo.key, src });
    }
  }
  RedeUI.on('cena-pedir', (env) => { const d = env.d || {}; if (d.estado && C().ativa) sincronizar(true, true); (d.keys || []).forEach((k) => { const src = imgPorKey.get(k); if (src) Rede.enviar('cena-img', { key: k, src }, env.de); }); });
  Rede.on('presenca', () => { if (C().ativa) { const n = [...Rede.presentes.values()].filter((p) => p.papel === 'jogador').length; if (n !== (enviarCena.n || 0)) { enviarCena.n = n; sincronizar(true, true); } } });
  Rede.on('estado', () => { if (!redeOn() && C().ativa) { C().ativa = false; atualizar(); } });

  // a cena acompanha tudo que muda na mesa (vida, condições, posições, adversários)
  const renderOriginal = render;
  render = function () { renderOriginal(); atualizar(); sincronizar(); };
  montar();
  window.CenaGM = { get visor() { return visor; }, sincronizar, C };
})();
