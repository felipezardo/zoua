// ============ Ataques dos jogadores pelo token: o Historiador autoriza, o dano e os ferimentos são aplicados ============
// Fluxo: jogador escolhe o token adversário e a arma > cartão de autorização aqui > jogador rola com a ficha dele
// > chega o resultado > Resistência do adversário diminui e, num Golpe Perfurante, o adversário faz a Proteção.
(() => {
  if (!window.RedeUI || !window.Rede) return;
  const fila = document.createElement('div'); fila.id = 'ataque-fila'; fila.className = 'ataque-fila'; fila.setAttribute('aria-live', 'polite'); document.body.appendChild(fila);
  const pend = new Map(); // rid -> { de, d, adv, tok }
  const base = (adv) => (typeof ADVERSARIOS !== 'undefined' ? ADVERSARIOS : []).concat(mesa.custom || []).find((x) => x.id === adv.baseId) || {};
  const advDoToken = (tokenId) => { const t = CenaGM.C().tokens.find((x) => x.id === tokenId); return t && t.tp === 'a' ? [t, mesa.advs.find((a) => a.id === t.ref)] : [null, null]; };
  const d6 = () => 1 + Math.floor(Math.random() * 6);
  const nega = (de, rid, motivo) => Rede.enviar('ataque-negado', { rid, motivo }, de);

  function pintar() {
    fila.innerHTML = [...pend.entries()].map(([rid, p]) => `<div class="atq-card" data-rid="${rid}" role="alertdialog" aria-label="Pedido de ataque"><p><b>${esc(p.d.heroi)}</b> quer atacar <b>${esc(p.adv.nome)}</b> com <b>${esc(p.d.arma)}</b>.</p><small>Resistência ${p.adv.res}/${p.adv.resMax} · Bloqueio +${p.bloqueio}</small><div class="atq-acoes"><button type="button" data-atqgm="ok">Autorizar</button><button type="button" class="sec" data-atqgm="nao">Negar</button></div></div>`).join('');
  }
  RedeUI.on('ataque-pedir', (env) => {
    const d = env.d || {}; if (!d.rid) return; const [tok, adv] = advDoToken(d.tokenId);
    if (!adv || adv.res <= 0) return nega(env.de, d.rid, 'Esse adversário não pode ser atacado agora.');
    const b = base(adv); pend.set(d.rid, { de: env.de, d, adv, tok, bloqueio: Number(b.bloqueio) || 0 }); pintar();
    RedeUI.aviso(`${d.heroi} pede para atacar ${adv.nome}.`);
  });
  RedeUI.on('ataque-cancelar', (env) => { const rid = env.d && env.d.rid; if (pend.delete(rid)) pintar(); });
  fila.addEventListener('click', (e) => {
    const b = e.target.closest('[data-atqgm]'), card = e.target.closest('[data-rid]'); if (!b || !card) return; const rid = card.dataset.rid, p = pend.get(rid); if (!p) return;
    pend.delete(rid); pintar();
    if (b.dataset.atqgm === 'ok') { p.autorizado = true; ativos.set(rid, p); Rede.enviar('ataque-ok', { rid, bloqueio: p.bloqueio }, p.de); } else nega(p.de, rid, 'O Historiador não autorizou este ataque.');
  });
  const ativos = new Map(); // autorizados, esperando o resultado da rolagem

  RedeUI.on('ataque-resultado', (env) => {
    const r = env.d || {}, p = ativos.get(r.rid); if (!p) return; ativos.delete(r.rid);
    const adv = mesa.advs.find((a) => a.id === p.adv.id); if (!adv) return; let txt;
    if (!r.ok) txt = `${r.heroi} errou o ataque a ${adv.nome} (${r.arma}).`;
    else {
      const dano = (Number(r.dano) || 0) + (Number(r.icones) || 0) * (Number(r.pesado) || 0), antes = adv.res;
      definir('a', adv.id, 'res', adv.res - dano);
      txt = `${r.heroi} acertou ${adv.nome} com ${r.arma} (${r.grau}): −${Math.min(dano, antes)} de Resistência${(r.icones && r.pesado) ? ` (inclui Golpe Pesado +${r.icones * r.pesado})` : ''}.`;
      if (adv.res <= 0) txt += ` ${adv.nome} está fora de combate.`;
      else if (r.perf) {
        const rating = parseInt(r.ferim, 10), dados = Number(base(adv).armadura) || 0;
        if (isNaN(rating)) txt += ' Golpe Perfurante, mas a arma não tem valor de Ferimento.';
        else { const rolls = Array.from({ length: dados }, d6), soma = rolls.reduce((s, v) => s + v, 0);
          if (soma >= rating) txt += ` Golpe Perfurante: Proteção ${soma} (${dados}d) resiste ao Ferimento ${rating}.`;
          else { definir('a', adv.id, 'feridas', (adv.feridas || 0) + 1); txt += ` Golpe Perfurante: Proteção ${soma} (${dados}d) falha contra Ferimento ${rating}: ${adv.nome} sofre um Ferimento (${adv.feridas}/${adv.poder}).`; }
        }
      }
    }
    registrar(txt); render(); CenaGM.sincronizar(true); RedeUI.aviso(txt); Rede.enviar('ataque-aplicado', { texto: txt });
  });
  Rede.on('estado', () => { if (!Rede.conectado()) { pend.clear(); ativos.clear(); pintar(); } });
})();
