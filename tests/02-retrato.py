import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':900}); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(''+BASE+'index.html'); pg.wait_for_timeout(300)
    pg.click('#hub-novo'); pg.wait_for_timeout(300)
    pg.click('#retrato'); pg.wait_for_timeout(300)
    pg.set_input_files('#ret-arquivo','tests/saida/teste.png'); pg.wait_for_timeout(500)
    print('enq open', pg.evaluate("document.getElementById('dlg-enq').open"))
    pg.fill('#enq-z','2'); pg.dispatch_event('#enq-z','input')
    box=pg.locator('#enq-cv').bounding_box()
    pg.mouse.move(box['x']+160,box['y']+160); pg.mouse.down(); pg.mouse.move(box['x']+110,box['y']+150,steps=5); pg.mouse.up()
    pg.screenshot(path='tests/saida/enq.png')
    pg.click('#enq-ok'); pg.wait_for_timeout(400)
    r=pg.evaluate("state.retrato.length+' '+state.retrato.slice(0,22)"); print('retrato', r)
    dims=pg.evaluate("new Promise(ok=>{const i=new Image();i.onload=()=>ok(i.width+'x'+i.height);i.src=state.retrato})"); print(dims)
    pg.click('#rede-bt'); pg.wait_for_timeout(300); pg.screenshot(path='tests/saida/dlg.png')
    print(errs); b.close()
