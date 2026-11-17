// ============ Jornada compartilhada: a mesma ficha de Jornada para o Historiador e os jogadores ============
// Os campos (registro, Companhia, pôneis, diário, eventos) e as marcas do mapa são sincronizados pela sala.
// O Historiador guarda tudo na mesa (vai no "Salvar mesa"); o jogador mantém a cópia na própria ficha.
// Cada um vê o seu mapa: os jogadores sempre o mapa dos jogadores; o Historiador pode alternar para o dele (olho).
(() => {
  const L7 = [0, 1, 2, 3, 4, 5, 6], E6 = [1, 2, 3, 4, 5, 6];
  const CHAVES = ['j_ano', 'j_estacao', 'j_de', 'j_destino', 'j_dias', ...L7.flatMap((i) => [`c${i}_nome`, `c${i}_papel`, `c${i}_fad`, `p${i}_nome`, `p${i}_vigor`]), 'diario', ...E6.flatMap((n) => [`e${n}_alvo`, `e${n}_evento`, `e${n}_res`]), 'mapa_eriador'];
  const caixas = (k, n) => `<span class="pontos caixas" data-k="${k}">` + Array.from({ length: n }, (_, i) => `<button type="button" data-v="${i + 1}" aria-label="Fadiga ${i + 1}"></button>`).join('') + '</span>';
  const campo = (rot, k, extra = '') => `<label class="campo">${rot}<input data-k="${k}" ${extra}></label>`;
  const html = () => `
  <header class="topo"><h2 class="titulo-pagina">Jornada</h2></header>
  <div class="jor-cima">
    <section><h3>Registro de Jornada</h3>${campo('Ano', 'j_ano')}${campo('Estação', 'j_estacao')}${campo('Jornada de', 'j_de')}${campo('Destino', 'j_destino')}${campo('Dias de viagem', 'j_dias', 'type="number" min="0"')}</section>
    <section><h3>A Companhia</h3><div class="comp-cab"><span>Nome</span><span>Papel de Jornada</span><span>Fadiga de Viagem</span></div>
      ${L7.map(i => `<div class="comp-linha"><input data-k="c${i}_nome" aria-label="Nome ${i + 1}"><input list="papeis" data-k="c${i}_papel" aria-label="Papel de Jornada ${i + 1}">${caixas('c' + i + '_fad', 10)}</div>`).join('')}
      <datalist id="papeis"><option>Guia</option><option>Batedor</option><option>Caçador</option><option>Vigia</option></datalist></section>
    <section><h3>Pôneis e Cavalos</h3><div class="pon-cab"><span>Nome</span><span>Vigor</span></div>
      ${L7.map(i => `<div class="pon-linha"><input data-k="p${i}_nome" aria-label="Nome do animal ${i + 1}"><input type="number" min="0" data-k="p${i}_vigor" aria-label="Vigor ${i + 1}"></div>`).join('')}</section>
    <section><h3>Diário</h3><textarea data-k="diario" rows="10" aria-label="Diário"></textarea></section>
  </div>
  <div class="jor-baixo">
    <section class="mapa-box"><h3>Caminho da Jornada</h3><div id="mapa-app"></div></section>
    <section class="eventos"><h3>Eventos</h3>
      ${[1,2,3,4,5,6].map(n => `<fieldset><legend>Evento ${n}</legend>${campo('Alvo', 'e' + n + '_alvo')}${campo('Evento', 'e' + n + '_evento')}${campo('Resultado', 'e' + n + '_res')}</fieldset>`).join('')}</section>
  </div>`;

  const json = (v) => JSON.stringify(v ?? null);
  const pegar = (src) => { const o = {}; CHAVES.forEach((k) => { if (src[k] !== undefined) o[k] = src[k]; }); return o; };
  const vazia = (src) => !CHAVES.some((k) => { const v = src[k]; return v && (typeof v !== 'object' || Object.keys(v).length); });
  function pintar(raiz, d) {
    if (!raiz) return;
    raiz.querySelectorAll('[data-k]').forEach((el) => {
      const k = el.dataset.k; if (!(k in d)) return; const v = d[k];
      if (el.classList.contains('pontos')) el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.v <= (+v || 0)));
      else if (el !== document.activeElement) el.value = v ?? '';
    });
  }

  const S = { ultimo: {}, shared: {}, pronto: false, pediu: false, t: 0, cfg: null };
  const marcar = (d) => { for (const k in d) S.ultimo[k] = json(d[k]); };
  function diff(src) { const p = {}; for (const k of CHAVES) { const v = src[k]; if (v !== undefined && S.ultimo[k] !== json(v)) p[k] = v; } return p; }
  function enviarDiff() {
    if (!S.cfg || !S.pronto || !window.Rede || !Rede.conectado()) return;
    const p = diff(S.cfg.src()); if (!Object.keys(p).length) return;
    marcar(p); Object.assign(S.shared, p); Rede.enviar('jor-set', { d: p });
  }
  const agendar = () => { clearTimeout(S.t); S.t = setTimeout(enviarDiff, 180); };
  function aplicarDados(d) {
    const cfg = S.cfg; Object.assign(cfg.src(), d); Object.assign(S.shared, d); marcar(d);
    pintar(document.querySelector(cfg.raiz), d); if ('mapa_eriador' in d && window.mapaAtualizar) window.mapaAtualizar();
    cfg.gravar();
  }

  // cfg: { papel, src: () => objeto com os dados, raiz: seletor da página de Jornada, gravar: () => salva localmente }
  function ligar(cfg) {
    S.cfg = cfg; S.pronto = cfg.papel === 'gm';
    if (!window.RedeUI || !window.Rede) return;
    RedeUI.on('jor-set', (env) => { const d = env.d && env.d.d; if (d && typeof d === 'object') aplicarDados(d); });
    if (cfg.papel === 'gm') RedeUI.on('jor-pedir', (env) => Rede.enviar('jor-estado', { d: pegar(cfg.src()), vazio: vazia(cfg.src()) }, env.de));
    else RedeUI.on('jor-estado', (env) => {
      if (env.p !== 'gm') return; S.pronto = true; const r = env.d || {};
      if (r.vazio) { const meus = pegar(cfg.src()); if (!vazia(meus)) { marcar(meus); Object.assign(S.shared, meus); Rede.enviar('jor-set', { d: meus }); } }
      else aplicarDados(r.d || {});
    });
    Rede.on('presenca', (p) => {
      if (cfg.papel !== 'jogador') return; const tem = [...p.values()].some((x) => x.papel === 'gm');
      if (tem && !S.pediu) { S.pediu = true; Rede.enviar('jor-pedir', {}); } else if (!tem) { S.pediu = false; S.pronto = false; }
    });
    Rede.on('estado', () => {
      if (Rede.conectado()) { if (cfg.papel === 'gm') { S.ultimo = {}; marcar(pegar(cfg.src())); } }
      else { S.pediu = false; S.pronto = cfg.papel === 'gm'; }
    });
  }
  window.Jornada = { CHAVES, html, pegar, vazia, pintar, ligar, agendar, compartilhada: () => S.shared, conectada: () => !!(S.pronto && window.Rede && Rede.conectado()) };
})();
