// Molduras laterais do livro (só aparecem em telas largas, nas margens): ornamento extraído da página do capítulo.
(() => {
  const mk = (cls) => { const d = document.createElement('div'); d.className = 'moldura ' + cls; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<i class="m-topo"></i><i class="m-meio"></i><i class="m-base"></i>'; return d; };
  document.body.prepend(mk('moldura-e'), mk('moldura-d'));
})();
