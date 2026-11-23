import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':1100}); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(''+BASE+'historiador.html'); pg.wait_for_timeout(500)
    pg.click('text=Cenas'); pg.wait_for_timeout(300)
    pg.set_input_files('#bib-arq',['tests/saida/img0.png','tests/saida/img1.png']); pg.wait_for_timeout(1200)
    print('tiles', pg.locator('#fila-grade .bib-item').count())
    pg.locator('#fila-grade .bib-usar').nth(1).click(); pg.wait_for_timeout(400)
    print('fundo', pg.evaluate("mesa.cena.fundo.tipo+' lib='+!!mesa.cena.fundo.lib"), 'em uso', pg.locator('#fila-grade .bib-item.on').count())
    pg.fill('#mus-url','https://www.youtube.com/watch?v=dQw4w9WgXcQ'); pg.fill('#mus-nome','Taverna'); pg.click('[data-mus=salvar]'); pg.wait_for_timeout(300)
    pg.set_input_files('#mus-arq','tests/saida/som.wav'); pg.wait_for_timeout(800)
    print('faixas', pg.locator('.mus-faixa').count())
    pg.locator('.mus-faixa .mus-play').nth(1).click(); pg.wait_for_timeout(600)
    print('tocando', pg.locator('.mus-faixa.on').count(), pg.inner_text('#musica-titulo'))
    pg.screenshot(path='tests/saida/cenas.png'); print(errs); b.close()
