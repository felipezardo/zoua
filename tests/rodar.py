# Roda todos os testes de navegador. Na pasta do projeto:  python3 tests/rodar.py
# Precisa de: pip install playwright pillow  e  playwright install chromium
import glob, os, re, subprocess, sys, time
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(raiz)
sys.path.insert(0, 'tests'); import preparar  # noqa: F401  (cria os arquivos de apoio)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
falhas = 0
try:
    for f in sorted(glob.glob('tests/[0-9]*.py')):
        r = subprocess.run([sys.executable, f], capture_output=True, text=True, timeout=240)
        saida = (r.stdout or '') + (r.stderr or '')
        erro = r.returncode != 0 or 'Traceback' in saida or re.search(r"^\[['\"]", saida, re.M)
        print(('FALHOU  ' if erro else 'ok      ') + os.path.basename(f)); falhas += bool(erro)
        if erro: print('   ' + saida.strip().replace('\n', '\n   ')[:900])
finally:
    srv.terminate()
print('\n%d teste(s) com problema' % falhas if falhas else '\nTudo certo.'); sys.exit(1 if falhas else 0)
