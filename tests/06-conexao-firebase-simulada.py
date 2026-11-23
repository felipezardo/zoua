import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
MOCK = """
(() => {
  const bc = new BroadcastChannel('fbmock'); const ls = {};
  const snap = (v) => ({ val: () => v });
  const DB = { ref: (path) => ({
    on(ev, cb) { if (path === '.info/connected') { setTimeout(() => cb(snap(true)), 20); return; } (ls[path] = ls[path] || []).push(cb); },
    off() { if (path !== '.info/connected') delete ls[path]; },
    push(v) { const key = Math.random().toString(36).slice(2); bc.postMessage({ path, v }); (ls[path] || []).forEach((cb) => cb(snap(v))); return Promise.resolve({ remove() {} }); },
    remove() { return Promise.resolve(); } }) };
  bc.onmessage = (e) => { (ls[e.data.path] || []).forEach((cb) => cb(snap(e.data.v))); };
  Nuvem.db = () => DB;
})()
"""
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(); gm=c.new_page(); jg=c.new_page(); errs=[]
    for pg,n in ((gm,'gm'),(jg,'jg')): pg.on('pageerror', lambda e,n=n: errs.append(n+': '+str(e)))
    gm.goto(''+BASE+'historiador.html'); jg.goto(''+BASE+'index.html'); gm.wait_for_timeout(500); jg.wait_for_timeout(500)
    gm.evaluate(MOCK); jg.evaluate(MOCK)
    gm.evaluate("Rede.entrar({sala:'ABCD-2345', papel:'gm', nome:'Historiador'})"); jg.evaluate("Rede.entrar({sala:'ABCD-2345', papel:'jogador', nome:'Aragorn'})")
    gm.wait_for_timeout(1800)
    print('estados', gm.evaluate("Rede.estado+' '+Rede.broker"), jg.evaluate("Rede.estado"))
    print('presentes GM', gm.evaluate("[...Rede.presentes.values()].map(p=>p.nome+':'+p.papel).join(',')"), '| JG', jg.evaluate("[...Rede.presentes.values()].map(p=>p.nome+':'+p.papel).join(',')"))
    # expulsar
    jid = gm.evaluate("[...Rede.presentes.keys()][0]")
    gm.evaluate("(id)=>Rede.expulsar(id)", jid); jg.wait_for_timeout(1000)
    print('jogador após expulsão', jg.evaluate("Rede.estado"))
    print(errs); b.close()
