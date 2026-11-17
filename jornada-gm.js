// ============ Jornada compartilhada: aba do Historiador ============
// Mesma ficha de Jornada dos jogadores, guardada na mesa (entra no "Salvar mesa" e volta na próxima sessão).
// O mapa abre no mapa dos jogadores; o olho alterna para o mapa do Historiador só na sua tela.
mesa.jornada = mesa.jornada || {};
var state = mesa.jornada;            // mapa.js lê e grava as marcas aqui
function aplicar() {}                // mapa.js estende esta função
(() => {
  const raiz = $('#v-jornada');
  raiz.innerHTML = `<div class="ficha jornada" id="jornada-gm"><p class="nota jor-nota">Esta Jornada é compartilhada: o que você ou os jogadores escreverem e marcarem aparece para todos na sala. Fica salva na mesa para a próxima sessão. Use o olho no mapa para ver a sua versão (os jogadores sempre veem o mapa deles).</p>
    <div class="acoes jor-acoes"><button type="button" data-acao="salvar-mesa" title="Baixa um arquivo com tudo: Jornada, Companhia, adversários, cena e combate">Salvar a mesa inteira (arquivo)</button><button type="button" class="sec" data-acao="carregar-mesa">Carregar mesa salva</button></div>${Jornada.html()}</div>`;
  Jornada.pintar(raiz, state);
  const salvarOrig = window.salvar;
  Jornada.ligar({ papel: 'gm', src: () => mesa.jornada, raiz: '#v-jornada', gravar: () => salvarOrig() });
  window.salvar = function () { const r = salvarOrig.apply(this, arguments); Jornada.agendar(); return r; };
  // ao carregar uma mesa salva, a Jornada dela substitui a que está na tela
  window.aoMesaCarregada = () => {
    mesa.jornada = mesa.jornada || {}; state = mesa.jornada;
    const completo = {}; Jornada.CHAVES.forEach((k) => { completo[k] = state[k] !== undefined ? state[k] : (k === 'mapa_eriador' ? {} : ''); });
    Jornada.pintar(raiz, completo); if (window.mapaAtualizar) mapaAtualizar();
  };
  raiz.addEventListener('input', (e) => {
    const k = e.target.dataset && e.target.dataset.k; if (!k) return;
    state[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; salvar();
  });
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('.pontos button'); if (!b) return;
    const k = b.parentElement.dataset.k, v = +b.dataset.v; state[k] = (+state[k] || 0) === v ? v - 1 : v; Jornada.pintar(raiz, { [k]: state[k] }); salvar();
  });
})();
