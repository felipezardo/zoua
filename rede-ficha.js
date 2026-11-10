// ============ Ficha ligada à sala: envia sua ficha, rolagens e Jornada compartilhada; recebe ajustes do Historiador ============
(() => {
  const salvarOriginal = salvar, aplicarOriginal = aplicar;
  const cache = { src: '', mini: '' };
  function miniatura(src) {
    return new Promise((ok) => {
      if (!src) return ok(''); if (!src.startsWith('data:')) return ok(src.length < 600 ? src : '');
      if (cache.src === src) return ok(cache.mini);
      const im = new Image(); im.onload = () => { const k = Math.min(1, 96 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cache.src = src; cache.mini = c.toDataURL('image/jpeg', 0.8); ok(cache.mini); };
      im.onerror = () => ok(''); im.src = src;
    });
  }

  // ---------- sincronização da Jornada compartilhada ----------
  let ultimaJ = typeof jornadaDe === 'function' ? jornadaDe(state) : { v: {}, m: {} };
  function enviarJornada() {
    if (!Rede.conectado() || typeof jornadaDe !== 'function') return;
    const atual = jornadaDe(state), d = diffJornada(ultimaJ, atual);
    if (!d) return;
    ultimaJ = atual;
    Rede.enviar('jornada', d);
  }
  function aplicarDadosJornada(vObj, mObj) {
    for (const k in vObj || {}) {
      if (vObj[k] === '') delete state[k];
      else state[k] = vObj[k];
    }
    state.mapa_eriador = state.mapa_eriador || {};
    for (const c in mObj || {}) {
      if (mObj[c] === null) delete state.mapa_eriador[c];
      else state.mapa_eriador[c] = mObj[c];
    }
    ultimaJ = typeof jornadaDe === 'function' ? jornadaDe(state) : { v: {}, m: {} };
    aplicarOriginal(true);
    salvarOriginal();
    if (window.Mapa) Mapa.atualizar();
  }

  let t, ultimo = '';
  async function enviarFicha(forcar) {
    if (!Rede.conectado() || !(state.nome || '').trim()) return;
    const f = JSON.parse(JSON.stringify(state)); delete f.retrato; delete f.rol_hist; delete f.mapa_vista; delete f.mapa_eriador;
    const ret = await miniatura(state.retrato), sig = JSON.stringify(f) + ret.length;
    if (!forcar && sig === ultimo) return; ultimo = sig; Rede.enviar('ficha', { nome: state.nome.trim(), f, ret });
  }
  const agendar = (forcar) => { clearTimeout(t); t = setTimeout(() => enviarFicha(forcar), forcar ? 100 : 800); };
  salvar = function () { salvarOriginal(); enviarJornada(); agendar(); };
  aplicar = function (i) {
    aplicarOriginal(i);
    if (i && typeof jornadaDe === 'function') ultimaJ = jornadaDe(state);
    if (Rede.conectado() && state.nome && Rede.nome !== state.nome.trim()) Rede.renomear(state.nome.trim());
    agendar();
  };
  Rede.on('estado', () => {
    if (Rede.conectado()) {
      if (state.nome) Rede.renomear(state.nome.trim());
      if (window.Mapa) Mapa.definirModo(0); // padrão ao conectar: mapa dos jogadores
      ultimo = '';
      agendar(true);
    }
  });
  Rede.on('presenca', (p) => { if ([...p.values()].some((x) => x.papel === 'gm')) { if (!enviarFicha.visto) { enviarFicha.visto = true; ultimo = ''; agendar(true); } } else enviarFicha.visto = false; });

  // Recebe alterações da Jornada vindas do Historiador ou de outros jogadores
  RedeUI.on('jornada', (env) => {
    const d = env.d || {};
    aplicarDadosJornada(d.v, d.m);
  });
  RedeUI.on('jornada-estado', (env) => {
    const d = env.d || {};
    if (d.vazio) {
      const a = typeof jornadaDe === 'function' ? jornadaDe(state) : { v: {}, m: {} };
      if (Object.keys(a.v).length || Object.keys(a.m).length) {
        ultimaJ = a;
        Rede.enviar('jornada', a);
      }
    } else {
      for (const k in state) if (typeof JORNADA_CHAVE !== 'undefined' && JORNADA_CHAVE.test(k)) delete state[k];
      state.mapa_eriador = {};
      aplicarDadosJornada(d.v, d.m);
    }
    if (window.Mapa) Mapa.definirModo(d.modo === 'historiador' ? 1 : 0);
  });
  RedeUI.on('jornada-modo', (env) => {
    const modo = env.d?.modo === 'historiador' ? 1 : 0;
    if (window.Mapa) Mapa.definirModo(modo);
    RedeUI.aviso(`Historiador alterou o mapa exibido para: ${modo ? 'Mapa do Historiador' : 'Mapa dos Jogadores'}.`);
  });

  // ajustes feitos pelo Historiador (dano, condições, posição) chegam aqui
  const ROT = { res: 'Resistência', esp: 'Esperança', sombra: 'Sombra', exausto: 'Exausto', arrasado: 'Arrasado', ferido: 'Ferido', postura: 'Postura' };
  RedeUI.on('aplicar', (env) => {
    const d = env.d || {}; if (!state.nome || String(d.alvo).trim() !== state.nome.trim()) return;
    if (d.campo === 'res') state.res_atual = String(d.valor); else if (d.campo === 'esp') state.esp_atual = String(d.valor); else if (d.campo === 'sombra') state.sombra = String(d.valor);
    else if (['exausto', 'arrasado', 'ferido'].includes(d.campo)) state[d.campo] = !!d.valor; else if (d.campo === 'postura') state.postura = d.valor || ''; else return;
    aplicarOriginal(true); salvarOriginal();
    const v = typeof d.valor === 'boolean' ? (d.valor ? 'marcado' : 'removido') : d.campo === 'postura' ? (POSTURAS.find((p) => p.id === d.valor) || { nome: 'sem posição' }).nome : d.valor;
    RedeUI.aviso(`Historiador: ${ROT[d.campo]} ${v}.`);
  });
})();
