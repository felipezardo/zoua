import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':1000}); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(''+BASE+'historiador.html'); pg.wait_for_timeout(600)
    pg.click('[data-aba=tabelas]'); pg.wait_for_timeout(400)
    print('cards jornada', pg.locator('.tab-card').count())
    pg.click('[data-id=jor-evento] summary'); pg.wait_for_timeout(200)
    pg.select_option('[data-id=jor-evento] [data-modo]','des')
    pg.evaluate("Math.random=()=>0.99"); pg.click('[data-id=jor-evento] [data-rolar]'); pg.wait_for_timeout(300)
    print('resultado', pg.inner_text('[data-id=jor-evento] .tab-resultado'), '| linha', pg.inner_text('[data-id=jor-evento] tr.sorteado').replace('\n',' ')[:60])
    pg.screenshot(path='tests/saida/tabelas1.png')
    pg.fill('#tab-busca','Ferido'); pg.wait_for_timeout(500); print('busca Ferido ->', pg.locator('.tab-card').count())
    pg.fill('#tab-busca',''); pg.wait_for_timeout(300)
    for l in ('luta','perigo','olho','conselho','tesouro','sociedade','coisa'):
        pg.click(f'[data-local={l}]'); pg.wait_for_timeout(150); print(l, pg.locator('.tab-card').count(), end=' | ')
    print(); pg.click('[data-local=coisa]'); pg.click('[data-id=coi-6] summary'); pg.evaluate("Math.random=()=>0.0"); pg.click('[data-id=coi-6] [data-rolar]'); pg.wait_for_timeout(200)
    print('coi-6', pg.inner_text('[data-id=coi-6] tr.sorteado').replace('\n',' ')[:60])
    pg.screenshot(path='tests/saida/tabelas2.png'); print(errs); b.close()
