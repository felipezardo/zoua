// ============ Jornada compartilhada: lado do jogador ============
// Ligado à sala, a Jornada desta ficha passa a ser a mesma do Historiador e dos outros jogadores.
(() => {
  if (!window.Jornada) return;
  const salvarOrig = window.salvar, aplicarOrig = window.aplicar;
  Jornada.ligar({ papel: 'jogador', src: () => state, raiz: '#vista-jornada', gravar: () => salvarOrig() });
  window.salvar = function () { const r = salvarOrig.apply(this, arguments); Jornada.agendar(); return r; };
  // ao trocar de ficha com a sala aberta, a Jornada compartilhada continua valendo
  window.aplicar = function () { if (Jornada.conectada()) { const sh = Jornada.compartilhada(); for (const k in sh) state[k] = sh[k]; } return aplicarOrig.apply(this, arguments); };
})();
