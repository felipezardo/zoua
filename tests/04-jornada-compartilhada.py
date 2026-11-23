import os
BASE = os.environ.get('BASE', 'http://localhost:8765/')
from playwright.sync_api import sync_playwright
STUB = """
([papel, meuId]) => {
  const bc = new BroadcastChannel('sala-teste');
  Rede.conectado = () => true; Rede.sala = 'TESTE-123';
  Rede.enviar = (t, d, para) => { console.log('SEND '+t+' '+JSON.stringify(d).slice(0,80)); bc.postMessage({ t, d, para: para || null, de: meuId, p: papel }); return Promise.resolve(); };
  bc.onmessage = (ev) => { const m = ev.data; console.log('RECV '+m.t); if (m.de === meuId) return; if (m.para && m.para !== meuId) return; (RedeUI.aoMensagem[m.t] || []).forEach((f) => f({ t: m.t, d: m.d, de: m.de, p: m.p })); };
  window.__anunciar = (outros) => { Rede.presentes = new Map(outros.map(o => [o.id, o])); const ev = Rede.__ouv; };
}
"""
with sync_playwright() as pw:
    b = pw.chromium.launch(); c0 = b.new_context(viewport={'width':1300,'height':1000}); ctxs = [c0, c0]
    gm = ctxs[0].new_page(); jg = ctxs[1].new_page(); errs=[]
    for pg,n in ((gm,'gm'),(jg,'jg')):
        pg.on('pageerror', lambda e, n=n: errs.append(n+': '+str(e)))
        pg.on('console', lambda m, n=n: print(n, m.text) if m.text.startswith(('SEND','RECV')) else None)
    gm.goto(''+BASE+'historiador.html'); jg.goto(''+BASE+'index.html'); gm.wait_for_timeout(600); jg.wait_for_timeout(600)
    gm.evaluate(STUB, ['gm','G1']); jg.evaluate(STUB, ['jogador','J1'])
    # GM abre a aba Jornada e escreve
    gm.click('text=Jornada'); gm.wait_for_timeout(500)
    print('olho GM', gm.locator('#mapa-olho').count(), 'olho jogador', jg.locator('#mapa-olho').count())
    gm.fill('[data-k=j_destino]','Bri'); gm.fill('[data-k=diario]','Chegamos ao Pônei Saltitante'); gm.wait_for_timeout(500)
    # jogador cria ficha e abre a Jornada; handshake: pede estado
    jg.click('#hub-novo'); jg.wait_for_timeout(300); jg.click('[data-aba=jornada]'); jg.wait_for_timeout(300)
    jg.evaluate("Rede.enviar('jor-pedir', {})"); jg.wait_for_timeout(600)
    print('DBG', jg.evaluate("JSON.stringify({st: state.j_destino, n: document.querySelectorAll('#vista-jornada [data-k=j_destino]').length, v: document.querySelector('#vista-jornada [data-k=j_destino]').value, pr: Jornada.conectada()})"))
    print('jogador recebeu', jg.input_value('[data-k=j_destino]'), '|', jg.input_value('[data-k=diario]'))
    # jogador edita -> GM recebe
    jg.fill('[data-k=j_dias]','7'); jg.click('.comp-linha .caixas button[data-v="3"]'); jg.wait_for_timeout(700)
    print('GM recebeu dias', gm.input_value('[data-k=j_dias]'), 'estado GM', gm.evaluate("mesa.jornada.j_dias"), gm.evaluate("mesa.jornada.c0_fad"))
    # marca no mapa pelo GM -> jogador
    gm.evaluate("mesa.jornada.mapa_eriador = {'10_10':1}; salvar();"); gm.wait_for_timeout(600)
    print('jogador mapa', jg.evaluate("JSON.stringify(state.mapa_eriador)"))
    gm.screenshot(path='tests/saida/jgm.png'); print(errs)
    b.close()
