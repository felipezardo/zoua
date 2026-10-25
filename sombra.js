// ============ Sombra e Esperança: teste de Sombra, Firmar Vontade e recuperação ============
const FONTES_SOMBRA = { pavor: ['Pavor', 'valor'], ganancia: ['Ganância', 'sab'], feiticaria: ['Feitiçaria', 'sab'], transgressao: ['Transgressão', 'sab'] };
const maxEsp = () => (state._max_esp != null ? state._max_esp : null);
const lim = (v, mini, maxi) => Math.max(mini, maxi == null ? v : Math.min(maxi, v));

function statusSombra() {
  const me = maxEsp(), e = num('esp_atual'), s = num('sombra') || 0, c = num('cicatrizes') || 0;
  $('#s-status').textContent = `Esperança ${e ?? '–'}${me != null ? ' de ' + me : ''} | Sombra ${s} (Cicatrizes ${c})`;
  const avisos = [];
  if (me != null && s >= me) avisos.push('Sombra igual à Esperança máxima: todas as jogadas ficam Desfavorecidas.');
  else if (e != null && s >= e) avisos.push('Sombra igual ou acima da Esperança atual: você está Arrasado (Olho de Sauron falha sozinho).');
  $('#s-ajuda').textContent = avisos.join(' ');
}
function abrirSombra() { $('#s-res').textContent = ''; statusSombra(); $('#dlg-sombra').showModal(); }
$('#abrir-sombra').onclick = abrirSombra;
$('#s-fechar').onclick = () => $('#dlg-sombra').close();

function mudar(campo, delta, teto) {
  const atual = num(campo) || 0;
  state[campo] = String(lim(atual + delta, 0, teto));
  aplicar(true); salvar(); statusSombra();
}
function lancar(n, modo, exausto) {
  const f = [d(12)]; if (modo !== 'n') f.push(d(12));
  const peso = (v) => (v === 12 ? -1 : v);
  const fac = modo === 'f' ? f.reduce((a, b) => (peso(b) > peso(a) ? b : a)) : modo === 'd' ? f.reduce((a, b) => (peso(b) < peso(a) ? b : a)) : f[0];
  const suc = Array.from({ length: n }, () => d(6));
  return { f, fac, suc, soma: suc.reduce((t, v) => t + (exausto && v <= 3 ? 0 : v), 0), runa: fac === 11, olho: fac === 12, icones: suc.filter(v => v === 6).length };
}

$('#s-rolar').onclick = () => {
  const [nome, base] = FONTES_SOMBRA[$('#s-fonte').value], c = cult(), fonte = $('#s-fonte').value;
  const valor = base === 'valor';
  const nivelAtr = num((valor ? 'coracao' : 'astucia') + '_nivel');
  if (nivelAtr === null) return ($('#s-res').textContent = 'Preencha o Nível do Atributo (Coração para VALOR, Astúcia para SABEDORIA).');
  const na = naDe(valor ? 'coracao' : 'astucia'), notas = [];
  let dados = nivel(valor ? 'coracao_valor' : 'astucia_valor'), modo = 'n';
  if (c === CULTURAS.hobbits && fonte === 'ganancia') { dados++; notas.push('Bom-senso Hobbit: +1d'); }
  if (tem('indomavel') && fonte === 'feiticaria') { dados++; notas.push('Espírito Indomável: +1d'); }
  if (tem('vontade') && fonte === 'pavor') { dados++; notas.push('Força de Vontade: +1d'); }
  if (tem('invisivel') && fonte === 'pavor') { modo = 'f'; notas.push('Contra o Invisível: Favorecido'); }
  if ((valor && c?.favValor) || (!valor && c?.favSab)) { modo = 'f'; notas.push(valor ? 'Coração Forte: VALOR Favorecido' : 'Bom-senso Hobbit: SABEDORIA Favorecida'); }
  const me = maxEsp();
  if (me != null && (num('sombra') || 0) >= me) { modo = modo === 'f' ? 'n' : 'd'; notas.push('Sombra no limite: Desfavorecido'); }
  if ($('#s-esp').checked) {
    if ((num('esp_atual') ?? 0) <= 0) return ($('#s-res').textContent = 'Você não tem Esperança para gastar.');
    state.esp_atual = String(num('esp_atual') - 1); dados++; notas.push('Esperança: +1d'); $('#s-esp').checked = false;
  }
  const exausto = !!state.exausto, arrasado = !!state.arrasado;
  const r = lancar(dados, modo, exausto), total = (r.olho ? 0 : r.fac) + r.soma;
  const ok = r.runa || (!(arrasado && r.olho) && total >= na);
  const pts = parseInt($('#s-pts').value) || 0, reduz = ok ? 1 + r.icones : 0, recebe = Math.max(0, pts - reduz);
  const novo = lim((num('sombra') || 0) + recebe, 0, me);
  state.sombra = String(novo);
  aplicar(true); salvar(); statusSombra();
  const fmt = (v) => (v === 11 ? 'Runa' : v === 12 ? 'Olho' : v);
  $('#s-res').innerHTML = `<strong class="${ok ? 'ok' : 'falha'}">${ok ? 'Teste bem-sucedido' : 'Teste falhou'}</strong> (${nome}, NA ${na})<br>
    Façanha ${r.f.map(fmt).join('/')}${modo !== 'n' ? ' (' + fmt(r.fac) + ')' : ''} + Sucesso [${r.suc.map(v => (v === 6 ? '6✦' : v)).join(', ')}] = ${r.runa ? 'automático' : total}${exausto ? ' | Exausto' : ''}${arrasado ? ' | Arrasado' : ''}<br>
    Sombra em jogo: ${pts}. Reduzida em ${reduz}. <strong>Você ganha ${recebe} ponto${recebe === 1 ? '' : 's'} de Sombra</strong> (agora ${novo}).${notas.length ? '<br><em>' + notas.join('; ') + '</em>' : ''}`;
};

$('#dlg-sombra').addEventListener('click', (e) => {
  const b = e.target.closest('[data-s]'); if (!b) return;
  const a = b.dataset.s, me = maxEsp(), cic = num('cicatrizes') || 0, som = num('sombra') || 0;
  if (a === 'esp-') return mudar('esp_atual', -1, me);
  if (a === 'esp+') return mudar('esp_atual', 1, me);
  if (a === 'som-') { state.sombra = String(Math.max(cic, som - 1)); aplicar(true); salvar(); return statusSombra(); }
  if (a === 'som+') return mudar('sombra', 1, me);
  if (a === 'firmar') {
    if (me == null) return ($('#s-ajuda').textContent = 'Escolha a Cultura e os Atributos primeiro.');
    if (som >= me) return ($('#s-ajuda').textContent = 'Firmar Vontade só vale enquanto a Sombra ainda está abaixo da Esperança máxima.');
    state.cicatrizes = String(cic + 1); state.sombra = String(cic + 1);
    aplicar(true); salvar(); statusSombra(); return ($('#s-ajuda').textContent = 'Vontade firmada: a Sombra virou 1 Cicatriz de Sombra permanente.');
  }
  if (a === 'recup' || a === 'yule') { delete state.elb_usos; delete state.prem_usos; }
  if (a === 'recup') { const ganho = num('coracao_nivel') || 0; return mudar('esp_atual', ganho + (ganho > 0 && tem('fumo') ? 1 : 0), me); }
  if (a === 'yule') { if (me == null) return; state.esp_atual = String(me); aplicar(true); salvar(); return statusSombra(); }
  if (/^rem\d$/.test(a)) { state.sombra = String(Math.max(cic, som - +a[3])); aplicar(true); salvar(); statusSombra(); }
});
