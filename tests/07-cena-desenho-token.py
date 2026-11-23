import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
STUB = """
([papel, meuId]) => {
  const bc = new BroadcastChannel('sala-teste3');
  Rede.conectado = () => true; Rede.sala = 'TESTE-123'; Rede.presentes = new Map();
  Rede.enviar = (t, d, para) => { bc.postMessage({ t, d, para: para || null, de: meuId, p: papel }); return Promise.resolve(); };
  bc.onmessage = (ev) => { const m = ev.data; if (m.de === meuId) return; if (m.para && m.para !== meuId) return; (RedeUI.aoMensagem[m.t] || []).forEach((f) => f({ t: m.t, d: m.d, de: m.de, p: m.p })); };
}
"""
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1300,'height':950}); gm=c.new_page(); jg=c.new_page(); errs=[]
    for pg,n in ((gm,'gm'),(jg,'jg')): pg.on('pageerror', lambda e,n=n: errs.append(n+': '+str(e)))
    gm.goto(''+BASE+'historiador.html'); jg.goto(''+BASE+'index.html'); gm.wait_for_timeout(600); jg.wait_for_timeout(600)
    gm.evaluate(STUB, ['gm','G1']); jg.evaluate(STUB, ['jogador','J1'])
    jg.click('#hub-novo'); jg.wait_for_timeout(300); jg.evaluate("state.nome='Aragorn'; salvar();")
    gm.evaluate("(()=>{ const h = novoHeroi({nome:'Aragorn', retrato:''}); mesa.herois[h.id]=h; salvar(); render(); })()")
    gm.click('text=Cenas'); gm.wait_for_timeout(300)
    gm.click('[data-pal^="h:"]'); gm.wait_for_timeout(300)
    gm.evaluate("CenaGM.C().ativa = true; CenaGM.sincronizar(true)"); gm.wait_for_timeout(600)
    jg.click('[data-aba=cenas]'); jg.wait_for_timeout(600)
    print('player tokens', jg.evaluate("RedeUI.cenaJogador.cena.tokens.length"))
    tok = gm.evaluate("JSON.stringify(CenaGM.C().tokens[0])"); print('token', tok[:120])
    # 1) sem permissão: arrastar não move
    pos0 = gm.evaluate("[CenaGM.C().tokens[0].x, CenaGM.C().tokens[0].y].join(',')")
    def arrastar():
        box = jg.locator('#cena-visor canvas').first.bounding_box()
        xy = jg.evaluate("(() => { const v = RedeUI.cenaJogador.visor; return v.paraTela ? v.paraTela(...v.posToken()) : null })()")
        return box
    # usa API interna do visor: encontra posição de tela do token
    sp = jg.evaluate("""(() => { const v = RedeUI.cenaJogador.visor; const t = RedeUI.cenaJogador.cena.tokens[0]; return v.paraTela ? v.paraTela(t.x, t.y) : null; })()""")
    print('paraTela?', sp)
    # 2) liga permissão e cria traço pelo GM
    gm.evaluate("CenaGM.C().moverLivre = true; CenaGM.sincronizar(true)"); gm.wait_for_timeout(500)
    print('jogador vê moverLivre', jg.evaluate("RedeUI.cenaJogador.cena.moverLivre"), 'token meu', jg.evaluate("!!RedeUI.cenaJogador.visor && RedeUI.cenaJogador.cena.tokens[0].nome"))
    gm.click('[data-f=pena]'); box=gm.locator('#cena-visor-gm canvas').first.bounding_box()
    gm.mouse.move(box['x']+150,box['y']+150); gm.mouse.down()
    for i in range(10): gm.mouse.move(box['x']+150+i*15,box['y']+150+i*8)
    gm.mouse.up(); gm.wait_for_timeout(700)
    print('traços GM', gm.evaluate("(CenaGM.C().desenhos||[]).length"), 'traços jogador', jg.evaluate("RedeUI.cenaJogador.visor.tracos().length"))
    # 3) token do jogador: simula movimento via mensagem (aoMover do visor)
    tid = gm.evaluate("CenaGM.C().tokens[0].id")
    jg.evaluate("(id) => Rede.enviar('token-mover', {id, x: 1234, y: 987, heroi: 'Aragorn'}, 'G1')", tid); gm.wait_for_timeout(500)
    print('GM token pos', gm.evaluate("[CenaGM.C().tokens[0].x, CenaGM.C().tokens[0].y].join(',')"), 'antes', pos0)
    # outro nome não pode
    jg.evaluate("(id) => Rede.enviar('token-mover', {id, x: 5, y: 5, heroi: 'Boromir'}, 'G1')", tid); gm.wait_for_timeout(400)
    print('após intruso', gm.evaluate("[CenaGM.C().tokens[0].x, CenaGM.C().tokens[0].y].join(',')"))
    # desligado: ignora
    gm.evaluate("CenaGM.C().moverLivre = false"); jg.evaluate("(id) => Rede.enviar('token-mover', {id, x: 7, y: 7, heroi: 'Aragorn'}, 'G1')", tid); gm.wait_for_timeout(400)
    print('desligado', gm.evaluate("[CenaGM.C().tokens[0].x, CenaGM.C().tokens[0].y].join(',')"))
    # 4) painel arrastável
    jg.evaluate("document.querySelector('#rolagem').classList.add('aberto')")
    r0 = jg.evaluate("JSON.stringify(document.querySelector('#rolagem').getBoundingClientRect())")
    top = jg.locator('#rolagem .r-topo').bounding_box()
    jg.mouse.move(top['x']+20, top['y']+10); jg.mouse.down(); jg.mouse.move(top['x']-300, top['y']-250, steps=6); jg.mouse.up(); jg.wait_for_timeout(200)
    r1 = jg.evaluate("JSON.stringify(document.querySelector('#rolagem').getBoundingClientRect())")
    print('rolagem moveu', r0[:60], '->', r1[:60]); print('salvo', jg.evaluate("localStorage.getItem('um-anel-posicoes')"))
    # 5) alças de tamanho
    h0 = jg.locator('#cena-visor').bounding_box()['height']; al = jg.locator('.palco-alca').first.bounding_box()
    jg.mouse.move(al['x']+al['width']/2, al['y']+6); jg.mouse.down(); jg.mouse.move(al['x']+al['width']/2, al['y']+156, steps=5); jg.mouse.up(); jg.wait_for_timeout(300)
    print('altura', round(h0), '->', round(jg.locator('#cena-visor').bounding_box()['height']))
    jg.screenshot(path='tests/saida/livro-jg.png'); print(errs); b.close()
