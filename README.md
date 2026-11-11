# O Um Anel 2e: ficha interativa e Mesa do Historiador

Site estático (sem servidor próprio). Publica direto na Vercel/GitHub Pages: basta manter esta estrutura na **raiz** do repositório.

## Estrutura (tudo na raiz, exceto `assets/`)

```
index.html            ficha, jornada e cenas dos JOGADORES
historiador.html      Mesa do HISTORIADOR (combate, cenas, companhia, adversários)

style.css             visual compartilhado (tema claro/escuro, ficha, cenas, rolagens)
mesa.css              visual extra da Mesa do Historiador

data.js               regras (culturas, virtudes, recompensas, equipamento, posturas)
adversarios-data.js   bestiário do livro (24 fichas)
mesa-exemplo.js       3 heróis de exemplo (botão "Carregar exemplo")

app.js                lógica da ficha
hub.js                página inicial de fichas, abas, retrato, Jornada, tema
mapa.js               mapa da Jornada (Eriador) da ficha
sombra.js             testes de Sombra e Esperança
rolagem.js            resultado das rolagens, animações, histórico

rede.js               conexão em tempo real (MQTT por WebSocket + criptografia)
rede-ui.js            botão de sala, janela de conexão, rolagens da mesa
rede-ficha.js         liga a ficha à sala (envia ficha/rolagens, recebe ajustes)
visor.js              visor de cena (mapa ou imagem + tokens, zoom e arrasto)
cena-jogador.js       aba "Cenas" do jogador
cena-gm.js            aba "Cenas" do Historiador
mesa.js               Mesa do Historiador (companhia, bestiário, combate, tokens)

assets/
  eriador.webp                mapa dos jogadores
  eriador-historiador.webp    mapa do Historiador
  dados/
    olho-de-sauron.png  olho-fechado.png  icone-de-sucesso.png  runa-de-gandalf.png
```

## Como usar a mesa

1. O Historiador abre `historiador.html`, toca no ícone de sinal (barra superior) e **Cria uma sala**. Aparece um código (ex.: `K7Q2-XM9P`) e o botão **Copiar link para os jogadores**.
2. Cada jogador abre o link (ou `index.html`, abre o personagem e informa o código no ícone de sinal).
3. A partir daí: o Historiador vê as fichas em tempo real (Companhia), todos veem as rolagens de todos (aba **Cenas** e feed), e o dano/condições/posição aplicados pelo Historiador chegam à ficha do jogador.
4. Na aba **Cenas** do Historiador: escolha o fundo (mapa dos jogadores, mapa do Historiador ou uma imagem sua), coloque os tokens, e use **Mostrar aos jogadores**.

## Observações

- A sala usa brokers MQTT públicos e gratuitos (`broker.emqx.io`, `broker.hivemq.com`, `mqtt.eclipseprojects.io`, `test.mosquitto.org`), sem conta. Tudo é criptografado com o código da sala (AES-GCM). Se um servidor cair, o próximo da lista é usado. Pode-se trocar a lista em *Servidores (avançado)*.
- Exige **HTTPS** (a Vercel já fornece) para a criptografia do navegador.
- Os arquivos de mapa e o bestiário vêm de material com direitos autorais: se o repositório for público, considere deixar `assets/` e `adversarios-data.js` privados.
