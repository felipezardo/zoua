// ============ Rede: sala compartilhada em tempo real (grátis, sem conta) ============
// Como funciona: cada sala é um "tópico" num broker MQTT público e gratuito, acessado por WebSocket seguro.
// Tudo que passa por lá é criptografado (AES-GCM) com uma chave derivada do código da sala, então o broker
// só enxerga bytes ilegíveis. Não há servidor nosso: se um broker cair, o cliente tenta o próximo da lista.
(() => {
  const BROKERS_PADRAO = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://mqtt.eclipseprojects.io:443/mqtt', 'wss://test.mosquitto.org:8081'];
  const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const TAM_PARTE = 24000; // caracteres por mensagem (imagens grandes são fatiadas)
  const enc = new TextEncoder(), dec = new TextDecoder();

  // ---------- utilidades ----------
  const juntar = (lista) => { const t = lista.reduce((s, a) => s + a.length, 0), o = new Uint8Array(t); let p = 0; for (const a of lista) { o.set(a, p); p += a.length; } return o; };
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
  const desb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');
  const aleat = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const normalizar = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const formatar = (s) => normalizar(s).replace(/(.{4})(?=.)/g, '$1-');
  function novoCodigo() { const b = crypto.getRandomValues(new Uint8Array(8)); return formatar([...b].map((x) => ALFABETO[x % ALFABETO.length]).join('')); }

  // ---------- MQTT 3.1.1 mínimo (só o que usamos: CONNECT, SUBSCRIBE, PUBLISH QoS 0, PING) ----------
  const strM = (s) => { const b = enc.encode(s); return juntar([Uint8Array.of(b.length >> 8, b.length & 255), b]); };
  const tamVar = (n) => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return Uint8Array.from(o); };
  const pacote = (b0, corpo) => juntar([Uint8Array.of(b0), tamVar(corpo.length), corpo]);
  class Fluxo { // reagrupa os pacotes que chegam fatiados nos quadros do WebSocket
    constructor() { this.buf = new Uint8Array(0); }
    empurrar(chunk) { this.buf = juntar([this.buf, chunk]); const out = []; for (;;) {
      if (this.buf.length < 2) break; let i = 1, mult = 1, rest = 0, b;
      do { if (i >= this.buf.length) return out; b = this.buf[i++]; rest += (b & 127) * mult; mult *= 128; } while (b & 128 && i < 5);
      if (this.buf.length < i + rest) break;
      out.push({ tipo: this.buf[0] >> 4, flags: this.buf[0] & 15, corpo: this.buf.slice(i, i + rest) }); this.buf = this.buf.slice(i + rest);
    } return out; }
  }

  // ---------- estado ----------
  const ouvintes = {};
  const R = {
    estado: 'desconectado', erro: '', sala: '', papel: 'jogador', nome: '', id: aleat(5), broker: '', presentes: new Map(),
    brokers: (() => { try { const l = JSON.parse(localStorage.getItem('um-anel-brokers') || 'null'); if (Array.isArray(l) && l.length) return l; } catch {} return window.REDE_BROKERS || BROKERS_PADRAO; })(),
    novoCodigo, formatar, normalizar,
    conectado() { return this.estado === 'conectado'; },
    on(ev, fn) { (ouvintes[ev] = ouvintes[ev] || []).push(fn); return () => { ouvintes[ev] = ouvintes[ev].filter((f) => f !== fn); }; },
  };
  const emitir = (ev, d) => (ouvintes[ev] || []).slice().forEach((f) => { try { f(d); } catch (e) { console.error(e); } });
  const mudar = (estado, erro = '') => { R.estado = estado; R.erro = erro; emitir('estado', estado); };

  let ws = null, chave = null, topico = '', deve = false, tentativa = 0, idxBroker = 0, ping = null, ultimaAtividade = 0, hb = null, pacoteId = 1;
  const vistos = new Set(), partes = new Map(), respondeu = new Map();

  async function prepararSala(sala) {
    const base = await crypto.subtle.importKey('raw', enc.encode(sala), 'PBKDF2', false, ['deriveKey']);
    chave = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('um-anel-mesa-v1'), iterations: 100000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    topico = 'um-anel/1/' + hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(sala)))).slice(0, 20);
  }
  async function cifrar(obj) { const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, enc.encode(JSON.stringify(obj)))); return b64(juntar([iv, ct])); }
  async function decifrar(s) { const raw = desb64(s), pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, chave, raw.slice(12)); return JSON.parse(dec.decode(pt)); }

  function publicarBruto(texto) { if (!ws || ws.readyState !== 1) return false; const corpo = juntar([strM(topico), enc.encode(texto)]); ws.send(pacote(0x30, corpo)); return true; }
  async function enviar(t, d, para) {
    if (!R.conectado()) return false;
    const env = { v: 1, i: aleat(6), de: R.id, n: R.nome, p: R.papel, t, d, para: para || null, ts: Date.now() };
    const s = await cifrar(env);
    if (s.length <= TAM_PARTE) return publicarBruto(s);
    const id = aleat(4), total = Math.ceil(s.length / TAM_PARTE);
    for (let k = 0; k < total; k++) { publicarBruto(`P|${id}|${k}|${total}|${s.slice(k * TAM_PARTE, (k + 1) * TAM_PARTE)}`); if (k % 4 === 3) await espera(20); }
    return true;
  }
  R.enviar = enviar;

  async function receber(texto) {
    let s = texto;
    if (texto.startsWith('P|')) {
      const [, id, k, total, parte] = texto.split('|'); const m = partes.get(id) || { total: +total, p: [], n: 0, t: Date.now() };
      if (m.p[+k] === undefined) { m.p[+k] = parte; m.n++; } partes.set(id, m);
      if (m.n < m.total) { if (partes.size > 20) [...partes.keys()].slice(0, 10).forEach((x) => partes.delete(x)); return; }
      partes.delete(id); s = m.p.join('');
    }
    let env; try { env = await decifrar(s); } catch { return; } // outra sala ou mensagem corrompida
    if (!env || env.v !== 1 || env.de === R.id || vistos.has(env.i)) return;
    vistos.add(env.i); if (vistos.size > 400) vistos.delete(vistos.values().next().value);
    if (env.para && env.para !== R.id && env.para !== '*') return;
    if (env.t === 'oi' || env.t === 'tchau') { tratarPresenca(env); }
    emitir('msg', env);
  }
  function tratarPresenca(env) {
    if (env.t === 'tchau') { R.presentes.delete(env.de); emitir('presenca', R.presentes); return; }
    const novo = !R.presentes.has(env.de);
    R.presentes.set(env.de, { id: env.de, nome: env.d?.nome || env.n || '?', papel: env.p, visto: Date.now() });
    if (novo || (env.d && env.d.responder)) { const ult = respondeu.get(env.de) || 0; if (Date.now() - ult > 15000) { respondeu.set(env.de, Date.now()); setTimeout(() => enviar('oi', { nome: R.nome }), 200 + Math.random() * 600); } }
    if (novo) emitir('presenca', R.presentes); else emitir('presenca', R.presentes);
  }

  function abrir() {
    const url = R.brokers[idxBroker % R.brokers.length]; R.broker = url; mudar('conectando');
    let aberto = false;
    try { ws = new WebSocket(url, 'mqtt'); } catch { return agendar(); }
    ws.binaryType = 'arraybuffer'; const fluxo = new Fluxo(), meu = ws;
    ws.onopen = () => { meu.send(pacote(0x10, juntar([strM('MQTT'), Uint8Array.of(4, 2, 0, 30), strM('um' + R.id + aleat(2))]))); };
    ws.onmessage = (ev) => {
      ultimaAtividade = Date.now();
      for (const p of fluxo.empurrar(new Uint8Array(ev.data))) {
        if (p.tipo === 2) { if (p.corpo[1] === 0) { aberto = true; tentativa = 0; meu.send(pacote(0x82, juntar([Uint8Array.of(0, 1), strM(topico), Uint8Array.of(0)]))); } else { mudar('erro', 'O servidor recusou a conexão.'); meu.close(); } }
        else if (p.tipo === 9) { mudar('conectado'); anunciar(true); }
        else if (p.tipo === 3) { const tl = (p.corpo[0] << 8) | p.corpo[1], qos = (p.flags >> 1) & 3, ini = 2 + tl + (qos ? 2 : 0); receber(dec.decode(p.corpo.slice(ini))); }
      }
    };
    ws.onclose = () => { clearInterval(ping); if (meu !== ws) return; if (deve) { mudar('conectando', aberto ? 'Conexão perdida. Tentando de novo…' : ''); if (!aberto) idxBroker++; agendar(); } else mudar('desconectado'); };
    ws.onerror = () => {};
    clearInterval(ping); ultimaAtividade = Date.now();
    ping = setInterval(() => { if (meu.readyState !== 1) return; if (Date.now() - ultimaAtividade > 50000) { meu.close(); return; } meu.send(Uint8Array.of(0xC0, 0)); }, 20000);
  }
  function agendar() { if (!deve) return; tentativa++; setTimeout(() => { if (deve) abrir(); }, Math.min(10000, 800 * 2 ** Math.min(tentativa, 4))); }
  function anunciar(responder) { enviar('oi', { nome: R.nome, responder: !!responder }); }

  R.entrar = async ({ sala, papel, nome }) => {
    sala = normalizar(sala); if (sala.length < 6) throw new Error('Código de sala inválido.');
    if (deve) R.sair();
    if (!crypto?.subtle) throw new Error('Este navegador/página não permite criptografia (use https ou localhost).');
    R.sala = formatar(sala); R.papel = papel || 'jogador'; R.nome = nome || 'Sem nome'; R.presentes = new Map(); R.erro = '';
    await prepararSala(sala); deve = true; tentativa = 0; abrir();
    clearInterval(hb); hb = setInterval(() => { if (R.conectado()) anunciar(false); const lim = Date.now() - 110000; let mudou = false; R.presentes.forEach((p, k) => { if (p.visto < lim) { R.presentes.delete(k); mudou = true; } }); if (mudou) emitir('presenca', R.presentes); }, 40000);
  };
  R.sair = () => { deve = false; clearInterval(hb); clearInterval(ping); if (ws && ws.readyState === 1) { try { enviar('tchau', {}); setTimeout(() => ws && ws.close(), 150); } catch { ws.close(); } } else if (ws) ws.close(); R.presentes = new Map(); mudar('desconectado'); };
  R.renomear = (nome) => { R.nome = nome; if (R.conectado()) anunciar(false); };
  window.Rede = R;
})();
