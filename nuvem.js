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
  const ref = (sala, k) => DB.ref((window.FIREBASE_PREFIXO || 'um-anel/salas/') + limpa(sala) + '/imgs' + (k ? '/' + limpa(k) : ''));
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
  // Arquivos de áudio (música da mesa): ficam em .../audio/<id>. Limite prático ~5 MB por arquivo.
  const raiz = (sala) => (window.FIREBASE_PREFIXO || 'um-anel/salas/') + limpa(sala);
  const paraB64 = (blob) => new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1] || ''); fr.onerror = () => no(fr.error); fr.readAsDataURL(blob); });
  const urlsAudio = new Map();
  N.salvarArquivo = async (sala, key, blob) => {
    if (!iniciar() || !sala || !blob) return false; const id = sala + '|a|' + key; if (enviadas.get(id)) return true;
    try { const b64 = await paraB64(blob); await comTempo(DB.ref(raiz(sala) + '/audio/' + limpa(key)).set({ b64, mime: blob.type || 'audio/mpeg', ts: Date.now() }), 120000); enviadas.set(id, true); return true; }
    catch (e) { N.erro = String((e && e.message) || e); console.warn('[nuvem] não salvou o áudio:', N.erro); return false; }
  };
  // Retorna uma URL (blob:) pronta para o <audio>, ou null.
  N.lerArquivo = async (sala, key) => {
    const id = sala + '|' + key; if (urlsAudio.has(id)) return urlsAudio.get(id);
    if (!iniciar() || !sala) return null;
    try {
      const v = (await comTempo(DB.ref(raiz(sala) + '/audio/' + limpa(key)).once('value'), 120000)).val(); if (!v || !v.b64) return null;
      const bin = atob(v.b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([u], { type: v.mime || 'audio/mpeg' })); urlsAudio.set(id, url); return url;
    } catch (e) { N.erro = String((e && e.message) || e); console.warn('[nuvem] não leu o áudio:', N.erro); return null; }
  };
  N.limpar = async (sala) => { enviadas.clear(); if (!iniciar() || !sala) return; try { await comTempo(DB.ref(raiz(sala)).remove(), 8000); } catch {} };
  // usados pela sala (rede.js) quando o Firebase carrega as mensagens
  N.db = () => (iniciar() ? DB : null);
  N.caminho = (sala) => (window.FIREBASE_PREFIXO || 'um-anel/salas/') + limpa(sala);
  window.Nuvem = N;
})();
