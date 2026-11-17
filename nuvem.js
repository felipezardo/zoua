// ============ Nuvem: guarda as imagens das cenas no Firebase Realtime Database ============
// O Historiador envia a imagem uma vez; o jogador a lê direto do banco (sem depender de mensagens que se perdem).
// Se o Firebase não estiver acessível (config, regras ou internet), tudo cai no envio em pedaços pela sala.
(() => {
  const N = { ok: false, erro: '' }, enviadas = new Map();
  let DB = null;
  function iniciar() {
    if (DB) return true;
    try {
      if (!window.firebase || !window.FIREBASE_CONFIG || !FIREBASE_CONFIG.databaseURL) return false;
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      DB = firebase.database(); N.ok = true; return true;
    } catch (e) { N.erro = String((e && e.message) || e); return false; }
  }
  const limpa = (k) => String(k).replace(/[.$#\[\]\/]/g, '_');
  const ref = (sala, k) => DB.ref((window.FIREBASE_PREFIXO || 'salas/um-anel-') + sala + '/imgs' + (k ? '/' + limpa(k) : ''));
  const comTempo = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado')), ms))]);
  // Retorna true se a imagem está na nuvem.
  N.salvar = async (sala, key, src) => {
    if (!iniciar() || !sala || !src) return false;
    const id = sala + '|' + key; if (enviadas.get(id)) return true;
    try { await comTempo(ref(sala, key).set({ src, ts: Date.now() }), 25000); enviadas.set(id, true); return true; }
    catch (e) { N.erro = String((e && e.message) || e); console.warn('[nuvem] não salvou a imagem:', N.erro); return false; }
  };
  // Retorna o src (data URL) ou null.
  N.ler = async (sala, key) => {
    if (!iniciar() || !sala) return null;
    try { const s = await comTempo(ref(sala, key).once('value'), 25000); const v = s.val(); return v && v.src ? v.src : null; }
    catch (e) { N.erro = String((e && e.message) || e); console.warn('[nuvem] não leu a imagem:', N.erro); return null; }
  };
  N.limpar = async (sala) => { enviadas.clear(); if (!iniciar() || !sala) return; try { await comTempo(ref(sala).remove(), 8000); } catch {} };
  window.Nuvem = N;
})();
