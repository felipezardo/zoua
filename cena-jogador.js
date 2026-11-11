// ============ Aba "Cenas" do jogador: vê o que o Historiador mostra e todas as rolagens da mesa ============
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FASES = { saraivada: 'Saraivadas de Abertura', posicao: 'Posição', engajamento: 'Engajamento', resolucao: 'Resolução' };
  const imgs = new Map(), pedidas = new Map(); let cena = null, gmId = null, ultimaCena = '', seguir = false;
  const visor = criarVisor($('#cena-visor'), { editavel: false, vazio: 'O Historiador ainda não mostrou nenhuma cena.', aoSelecionar: info });
  RedeUI.cenaJogador = { visor, imgs, get cena() { return cena; } };
  RedeUI.feedVisivel = () => !$('#vista-cenas').hidden;
  RedeUI.montarFeed($('#cena-feed'));

  function info(id) {
    const t = cena && cena.tokens.find((x) => x.id === id), el = $('#cena-info'); if (!t) { el.textContent = ''; return; }
    const partes = [`${t.nome}`]; if (t.res != null) partes.push(`Resistência ${t.res}/${t.resMax}`); if (t.fora) partes.push('fora de combate'); if (t.estados?.length) partes.push(t.estados.join(', '));
    el.textContent = partes.join(' · ');
  }
  function pedir(keys) {
    const k = [...new Set(keys)].filter((x) => { const t = pedidas.get(x); return !t || Date.now() - t > 8000; }); if (!k.length || !gmId || !Rede.conectado()) return;
    k.forEach((x) => pedidas.set(x, Date.now())); Rede.enviar('cena-pedir', { keys: k }, gmId);
  }
  function aplicar() {
    const faltam = [];
    if (!cena) { visor.definirFundo(null); visor.definirTokens([]); $('#cena-titulo').textContent = 'Cenas'; $('#cena-combate').hidden = true; $('#cena-info').textContent = ''; return; }
    let fundo = null;
    if (cena.fundo) { if (cena.fundo.tipo === 'mapa') fundo = { tipo: 'mapa', modo: cena.fundo.modo }; else { const src = imgs.get(cena.fundo.key); if (src) fundo = { tipo: 'imagem', src, w: cena.fundo.w, h: cena.fundo.h }; else faltam.push(cena.fundo.key); } }
    visor.definirFundo(fundo);
    visor.definirTokens(cena.tokens.map((t) => { const src = t.k ? imgs.get(t.k) : ''; if (t.k && !src) faltam.push(t.k); return { ...t, img: src || '' }; }));
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
    gmId = env.de; const nova = !cena || cena.id !== env.d.id; cena = env.d; aplicar(); avisoConexao();
    const marca = JSON.stringify([env.d.id, env.d.fundo]); if (marca !== ultimaCena) { ultimaCena = marca; if ($('#vista-cenas').hidden) RedeUI.aviso('O Historiador mostrou uma cena. Abra a aba Cenas.'); }
  });
  RedeUI.on('cena-img', (env) => { imgs.set(env.d.key, env.d.src); aplicar(); });
  RedeUI.on('cena-fim', () => { cena = null; ultimaCena = ''; aplicar(); avisoConexao(); });
  RedeUI.on('cena-foco', (env) => { if (cena) visor.irPara(env.d.vista); });
  $('#cena-seguir').onchange = (e) => { seguir = e.target.checked; if (seguir && cena && cena.vista) visor.irPara(cena.vista); };
  $('#cena-ajustar').onclick = () => visor.ajustar();
  // ao entrar na sala depois que o Historiador já estava projetando, pede o estado atual
  Rede.on('presenca', (p) => { if (!cena && [...p.values()].some((x) => x.papel === 'gm')) Rede.enviar('cena-pedir', { keys: [], estado: true }); });
})();
