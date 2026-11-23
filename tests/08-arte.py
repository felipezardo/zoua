import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':900}); gm=c.new_page(); jg=c.new_page(); errs=[]
    for pg,n in ((gm,'gm'),(jg,'jg')): pg.on('pageerror', lambda e,n=n: errs.append(n+': '+str(e)))
    gm.goto(''+BASE+'historiador.html'); gm.wait_for_timeout(600)
    gm.evaluate("adicionarAdv('grande-troll-das-cavernas',1); adicionarAdv('guarda-orc',1); adicionarAdv('lobo-chefe',1); adicionarAdv('aparicao-tumular',1); salvar(); render();")
    gm.evaluate("(()=>{const h=novoHeroi({nome:'Gimli', cultura:'anoes', retrato:''}); mesa.herois[h.id]=h; salvar(); render();})()")
    id0=gm.evaluate("mesa.advs[0].id"); gm.evaluate("(id)=>abrirAdv(mesa.advs.find(a=>a.id===id).baseId)", id0); gm.wait_for_timeout(500)
    gm.screenshot(path='tests/saida/arte-modal.png'); gm.keyboard.press('Escape')
    gm.evaluate("(id)=>abrirToken('a', id)", id0); gm.wait_for_timeout(400); gm.screenshot(path='tests/saida/arte-token-modal.png'); gm.keyboard.press('Escape')
    gm.click('text=Cenas'); gm.wait_for_timeout(300)
    for sel in ('[data-pal^="a:"]','[data-pal^="h:"]'):
        for i in range(gm.locator(sel).count()): gm.locator(sel).nth(i).click(); gm.wait_for_timeout(120)
    gm.wait_for_timeout(800)
    # espalha os tokens para ver
    gm.evaluate("CenaGM.C().tokens.forEach((t,i)=>{t.x=800+i*220; t.y=700})"); gm.evaluate("CenaGM.atualizar && CenaGM.atualizar()"); gm.wait_for_timeout(500)
    gm.evaluate("document.querySelector('#cena-visor-gm').scrollIntoView()"); gm.wait_for_timeout(400)
    gm.screenshot(path='tests/saida/arte-cena.png')
    # jogador: retrato padrão
    jg.goto(''+BASE+'index.html'); jg.wait_for_timeout(500); jg.click('#hub-novo'); jg.wait_for_timeout(300)
    jg.select_option('[data-k=cultura]','bardeses'); jg.wait_for_timeout(400)
    print('retrato padrão:', jg.evaluate("document.querySelector('#retrato-img').getAttribute('src')"))
    jg.screenshot(path='tests/saida/arte-ficha.png', clip={'x':900,'y':160,'width':380,'height':330}); print(errs); b.close()
