import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
import sys, json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    for page_name in ['index.html','historiador.html']:
        pg = b.new_page(viewport={'width':1200,'height':800})
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts' not in m.text and 'ERR_' not in m.text else None)
        pg.goto(''+BASE+''+page_name)
        pg.wait_for_timeout(600)
        print(page_name, 'feed-bt' , pg.query_selector('#feed-bt') is not None, 'musica', pg.query_selector('#musica-mini') is not None, 'musica-bt', pg.query_selector('#musica-bt') is not None)
        print(errs)
    b.close()
