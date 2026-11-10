// ============ Jornada (página 2 da ficha): modelo compartilhado pela ficha e pela Mesa do Historiador ============
// Chaves que fazem parte da Jornada compartilhada (todo o resto é da ficha de cada jogador).
const JORNADA_CHAVE = /^(j_ano|j_estacao|j_de|j_destino|j_dias|diario|c[0-6]_(nome|papel|fad)|p[0-6]_(nome|vigor)|e[1-6]_(alvo|evento|res))$/;
const jornadaDe = (e) => { const v = {}; for (const k in e) if (JORNADA_CHAVE.test(k) && e[k] !== '' && e[k] !== undefined && e[k] !== 0) v[k] = e[k]; return { v, m: { ...(e.mapa_eriador || {}) } }; };
function diffJornada(a, b) { // o que mudou de a para b (null = nada)
  const v = {}, m = {}; let mudou = false;
  for (const k in b.v) if (JSON.stringify(a.v[k]) !== JSON.stringify(b.v[k])) { v[k] = b.v[k]; mudou = true; }
  for (const k in a.v) if (!(k in b.v)) { v[k] = ''; mudou = true; }
  for (const k in b.m) if (a.m[k] !== b.m[k]) { m[k] = b.m[k]; mudou = true; }
  for (const k in a.m) if (!(k in b.m)) { m[k] = null; mudou = true; }
  return mudou ? { v, m } : null;
}
// ---------- Jornada (página 2 da ficha) ----------
const caixas = (k, n) => `<span class="pontos caixas" data-k="${k}">` + Array.from({ length: n }, (_, i) => `<button type="button" data-v="${i + 1}" aria-label="Fadiga ${i + 1}"></button>`).join('') + '</span>';
const campo = (rot, k, extra = '') => `<label class="campo">${rot}<input data-k="${k}" ${extra}></label>`;
function htmlJornada() {
  const L7 = [0, 1, 2, 3, 4, 5, 6];
  return `
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
}
