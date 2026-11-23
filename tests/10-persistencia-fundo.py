import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':900}); pg=c.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(''+BASE+'historiador.html'); pg.wait_for_timeout(500); pg.click('text=Cenas'); pg.wait_for_timeout(300)
    pg.set_input_files('#bib-arq',['tests/saida/img0.png']); pg.wait_for_timeout(1000)
    pg.locator('#fila-grade .bib-usar').first.click(); pg.wait_for_timeout(600)
    tam=pg.evaluate("(()=>{const o=JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('mesa'))));return JSON.stringify(o.cena.fundo).length+' '+('src' in o.cena.fundo)})()"); print('fundo salvo (tam, tem src):', tam)
    pg.reload(); pg.wait_for_timeout(1200); pg.click('text=Cenas'); pg.wait_for_timeout(500)
    print('após recarregar:', pg.evaluate("CenaGM.C().fundo.tipo+' src='+(!!CenaGM.C().fundo.src)")); print(errs); b.close()
