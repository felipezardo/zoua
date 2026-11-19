// ============ "Saber mais": lembretes curtos das regras, conferidos com o livro ============
// Botão "?" discreto ao lado do que importa. Abre um quadro pequeno; fecha com Esc, clique fora ou no próprio botão.
(() => {
  const T = {
    rolagem: ['Como ler a rolagem', ['Role o Dado de Façanha (d12) e os Dados de Sucesso (d6) e some tudo. Se o total alcançar o Número Alvo (NA = 20 − o atributo), a ação dá certo.', 'Runa de Gandalf no Dado de Façanha é sucesso automático. Olho de Sauron vale 0. Cada 6 nos dados de Sucesso é um ícone: 1 ícone é Grande Sucesso; 2 ou mais, Sucesso Extraordinário.']],
    favorecida: ['Favorecida e Desfavorecida', ['Favorecida: role dois Dados de Façanha e fique com o melhor (a Runa é o melhor). Desfavorecida: fique com o pior (o Olho é o pior).', 'Se a jogada for Favorecida e Desfavorecida ao mesmo tempo, vale a jogada normal, com um só Dado de Façanha.']],
    esperanca: ['Gastar Esperança', ['Antes de rolar, gaste 1 ponto de Esperança para ganhar 1 dado de Sucesso. Só um ponto por jogada.', 'Se estiver Inspirado (por uma Característica Notável ou certas Virtudes Culturais), o benefício dobra: ganha 2 dados.']],
    condicoes: ['Condições', ['Exausto: a Resistência Atual ficou igual ou abaixo da Carga. Nos dados de Sucesso, os resultados 1, 2 e 3 contam como 0.', 'Arrasado: a Sombra alcançou a Esperança Atual. Se sair o Olho de Sauron no Dado de Façanha, a jogada falha.', 'Ferido: veja "Ferimentos" no combate. Perder Resistência não é estar Ferido.']],
    ataque: ['Atacar', ['Faça a jogada com a perícia da arma. O NA é 20 menos o atributo, mais o Bloqueio do adversário.', 'Acertando, o adversário perde Resistência igual ao Dano da arma. Cada ícone de Sucesso pode virar um dano especial: Golpe Pesado, Perfurar, Defender ou Pancada de Escudo.']],
    pesado: ['Golpe Pesado', ['Gaste 1 ícone de Sucesso: o adversário perde Resistência adicional igual ao seu valor de FORÇA (+1 se a arma for de duas mãos).']],
    perfurar: ['Perfurar', ['Arcos, Lanças e Espadas: gaste 1 ou mais ícones para elevar o resultado do Dado de Façanha a 10 no máximo. Com 10, o golpe conta como Golpe Perfurante.']],
    perfurante: ['Golpe Perfurante e Ferimento', ['Um ataque que acerta e tira 10 (ou a Runa) no Dado de Façanha é um Golpe Perfurante.', 'O atingido faz um teste de Proteção: um Dado de Façanha mais os dados de Proteção da armadura, contra o valor de Ferimento da arma. Se falhar, fica Ferido.']],
    ferimento: ['Ferimentos', ['Herói: só corre risco de morte com Golpe Perfurante. Ao ser Ferido pela primeira vez, marca "Ferido" e faz o teste de Gravidade do Ferimento. Ferido pela segunda vez, está Morrendo e precisa de um sucesso em CURA em cerca de 1 hora.', 'Adversário: cada Ferimento conta; ao chegar ao seu Poder, cai na hora. Chegando a 0 de Resistência, também sai do combate.']],
    protecaoadv: ['Proteção do adversário', ['Quando o Golpe Perfurante acerta, o adversário faz a Proteção: Dado de Façanha mais os dados da Armadura, contra o Ferimento da arma. Runa protege sempre; o Olho conta 0. (Adversários do tipo Ódio usam o Dado de Façanha invertido.)']],
    defender: ['Defender', ['Corpo a corpo: gaste 1 ícone para aumentar seu Bloqueio na rodada: +1 com Machados e Briga, +2 com Espadas, +3 com Lanças.']],
    pancada: ['Pancada de Escudo', ['Se sua FORÇA for maior que o Nível de Atributo do alvo, gaste 1 ícone para empurrá-lo: ele perde 1 dado no resto da rodada.']],
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const btn = (k) => `<button type="button" class="saber" data-saber="${k}" aria-label="Saber mais: ${esc(T[k] ? T[k][0] : k)}" title="Saber mais">?</button>`;
  let pop = null, dono = null;
  function fechar() { if (pop) pop.remove(); pop = null; if (dono) dono.setAttribute('aria-expanded', 'false'); dono = null; }
  function abrir(b) {
    const k = b.dataset.saber, e = T[k]; if (!e) return; if (dono === b) return fechar(); fechar();
    pop = document.createElement('div'); pop.className = 'saber-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', e[0]);
    pop.innerHTML = `<h4>${esc(e[0])}</h4>${e[1].map((p) => `<p>${esc(p)}</p>`).join('')}<small>Conforme o livro de regras.</small>`;
    document.body.appendChild(pop); dono = b; b.setAttribute('aria-expanded', 'true');
    const r = b.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let x = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2)), y = r.bottom + 8; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-saber]'); if (b) { e.stopPropagation(); abrir(b); } else if (pop && !pop.contains(e.target)) fechar(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop) { const d = dono; fechar(); d && d.focus(); } });
  addEventListener('resize', fechar);

  // botões fixos nas telas onde as regras aparecem
  const poe = (el, k, onde) => { if (!el || el.querySelector(':scope > .saber')) return; if (onde === 'antes-de' ) { const alvo = el.querySelector('select,input'); alvo ? alvo.insertAdjacentHTML('beforebegin', btn(k)) : el.insertAdjacentHTML('beforeend', btn(k)); } else el.insertAdjacentHTML('beforeend', ' ' + btn(k)); };
  function injetar() {
    poe(document.querySelector('#rolagem .r-topo h3'), 'rolagem');
    document.querySelectorAll('#vista-ficha h3').forEach((h) => { if (/^Condições\b/.test(h.textContent.trim())) poe(h, 'condicoes'); });
    const m = document.querySelector('#r-modo'); if (m) poe(m.closest('label'), 'favorecida', 'antes-de');
    const e = document.querySelector('#r-esp'); if (e) poe(e.closest('label'), 'esperanca');
  }
  injetar(); let t = 0; new MutationObserver(() => { clearTimeout(t); t = setTimeout(injetar, 120); }).observe(document.body, { childList: true, subtree: true });
  window.Saber = { btn, T };
})();
