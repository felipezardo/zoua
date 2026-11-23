import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
STUB = """
([papel, meuId]) => {
  const bc = new BroadcastChannel('sala-teste2');
  Rede.conectado = () => true; Rede.sala = 'TESTE-123'; Rede.presentes = new Map();
  Rede.enviar = (t, d, para) => { bc.postMessage({ t, d, para: para || null, de: meuId, p: papel }); return Promise.resolve(); };
  bc.onmessage = (ev) => { const m = ev.data; if (m.de === meuId) return; if (m.para && m.para !== meuId) return; (RedeUI.aoMensagem[m.t] || []).forEach((f) => f({ t: m.t, d: m.d, de: m.de, p: m.p })); };
}
"""
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1300,'height':1000}); gm=c.new_page(); jg=c.new_page(); errs=[]
    for pg,n in ((gm,'gm'),(jg,'jg')):
        pg.on('pageerror', lambda e,n=n: errs.append(n+': '+str(e)))
    gm.goto(''+BASE+'historiador.html'); jg.goto(''+BASE+'index.html'); gm.wait_for_timeout(600); jg.wait_for_timeout(600)
    gm.evaluate(STUB, ['gm','G1']); jg.evaluate(STUB, ['jogador','J1'])
    # GM: adversário na cena e cena enviada
    gm.evaluate("adicionarAdv('saqueador-sulista',1)"); gm.click('text=Cenas'); gm.wait_for_timeout(300)
    gm.click('[data-pal^="a:"]'); gm.wait_for_timeout(300)
    gm.evaluate("CenaGM.C().ativa = true; CenaGM.sincronizar(true)"); gm.wait_for_timeout(600)
    tok = gm.evaluate("JSON.stringify(CenaGM.C().tokens.map(t=>({id:t.id,tp:t.tp,ref:t.ref})))"); print('tokens', tok)
    # jogador: ficha com arma e nível de força
    jg.click('#hub-novo'); jg.wait_for_timeout(300)
    jg.evaluate("state.nome='Aragorn'; state.forca_nivel=5; state.g0_sel=ARMAS.find(a=>a.p==='Espadas').n; state.p_Espadas=3; aplicar(); salvar();")
    print('arma', jg.evaluate("JSON.stringify(armaAtual(0)).slice(0,120)"))
    # recebe a cena
    jg.click('[data-aba=cenas]'); jg.wait_for_timeout(500)
    print('cena no jogador', jg.evaluate("RedeUI.cenaJogador.cena && RedeUI.cenaJogador.cena.tokens.length"))
    # seleciona o token via visor
    tid = gm.evaluate("CenaGM.C().tokens[0].id")
    jg.evaluate("(id) => RedeUI.cenaJogador.visor.selecionar(id)", tid); jg.wait_for_timeout(300)
    print('botoes de arma', jg.locator('#cena-atq .atq-arma').count(), jg.locator('#cena-atq').inner_text()[:80].replace('\n',' | '))
    jg.evaluate("Math.random = () => 0.9"); gm.evaluate("Math.random = () => 0.4")
    jg.locator('#cena-atq .atq-arma').first.click(); jg.wait_for_timeout(500)
    print('card GM', gm.locator('.atq-card').count(), '|', gm.locator('.atq-card').first.inner_text().replace('\n',' / ')[:140])
    print('jogador espera', jg.locator('#cena-atq').inner_text()[:70].replace('\n',' '))
    before = gm.evaluate("mesa.advs[0].res+'/'+mesa.advs[0].feridas")
    gm.click('[data-atqgm=ok]'); jg.wait_for_selector('.atq-gasto', timeout=4000); print('painel gasto:', jg.locator('#cena-atq').inner_text()[:150].replace('\n',' | ')); jg.click('[data-atq=menos]'); jg.click('[data-atq=confirmar]'); gm.wait_for_timeout(1200)
    after = gm.evaluate("mesa.advs[0].res+'/'+mesa.advs[0].feridas")
    print('antes/depois', before, after); print('log', gm.evaluate("mesa.log[0].txt"))
    print('aviso no jogador', jg.evaluate("(document.querySelector('#aviso')||{}).textContent"))
    jg.screenshot(path='tests/saida/atq.png'); gm.screenshot(path='tests/saida/atq-gm.png')
    b.close(); print([e for e in errs if 'encrypt' not in e])
