// ============ Biblioteca do Historiador: imagens de cena e músicas guardadas no navegador (IndexedDB) ============
// Fica só neste navegador; o que for usado na mesa é enviado aos jogadores pela nuvem (nuvem.js).
(() => {
  let aberto = null;
  const abrir = () => aberto || (aberto = new Promise((ok, no) => {
    const r = indexedDB.open('zoua-biblioteca', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('itens', { keyPath: 'id' });
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  }));
  const tx = async (modo, fn) => { const d = await abrir(); return new Promise((ok, no) => { const t = d.transaction('itens', modo); const q = fn(t.objectStore('itens')); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); t.onabort = () => no(t.error); }); };
  const PESADOS = { img: 'src', musica: 'blob' };
  window.Biblioteca = {
    id: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    // Lista sem os campos pesados (a imagem inteira / o arquivo de áudio): use obter(id) para pegar o item completo.
    listar: async (tipo) => {
      const d = await abrir();
      return new Promise((ok, no) => {
        const saida = [], t = d.transaction('itens', 'readonly'), c = t.objectStore('itens').openCursor();
        c.onsuccess = () => { const cur = c.result; if (!cur) return; const it = cur.value; if (it.tipo === tipo) { const leve = { ...it }; delete leve[PESADOS[tipo]]; saida.push(leve); } cur.continue(); };
        t.oncomplete = () => ok(saida.sort((a, b) => b.criado - a.criado)); t.onerror = () => no(t.error);
      });
    },
    adicionar: (item) => tx('readwrite', (s) => s.put(item)),
    remover: (id) => tx('readwrite', (s) => s.delete(id)),
    obter: (id) => tx('readonly', (s) => s.get(id)),
    renomear: async (id, nome) => { const it = await tx('readonly', (s) => s.get(id)); if (it) { it.nome = nome; await tx('readwrite', (s) => s.put(it)); } },
    miniatura: (src, max = 220) => new Promise((ok) => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.7)); }; im.onerror = () => ok(''); im.src = src; })
  };
})();
