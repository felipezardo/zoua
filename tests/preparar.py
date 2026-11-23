# Cria os arquivos de apoio dos testes (imagens e um som curto) em tests/saida/
import os, struct, wave
from PIL import Image
os.makedirs('tests/saida', exist_ok=True)
Image.new('RGB', (900, 600), (200, 60, 60)).save('tests/saida/img0.png')
Image.new('RGB', (900, 600), (60, 120, 200)).save('tests/saida/img1.png')
im = Image.new('RGB', (800, 500), (200, 160, 90)); im.save('tests/saida/teste.png')
w = wave.open('tests/saida/som.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000)
w.writeframes(b''.join(struct.pack('<h', int(3000 * ((i // 20) % 2 * 2 - 1))) for i in range(16000))); w.close()
