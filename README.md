# O Um Anel 2e: ficha interativa e Mesa do Historiador

Site estático (sem servidor próprio). Publica direto na Vercel/GitHub Pages: basta manter esta estrutura na **raiz** do repositório.

## Estrutura (tudo na raiz, exceto `assets/`)

```
index.html            ficha, jornada e cenas dos JOGADORES
historiador.html      Mesa do HISTORIADOR (combate, cenas, companhia, adversários)

style.css             visual compartilhado (tema claro/escuro, ficha, cenas, rolagens)
mesa.css              visual extra da Mesa do Historiador
animacoes.css         hovers, animações, retrato quadrado, janela de conexão e player de música

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
musica.js             música da mesa: o Historiador toca (YouTube ou link de áudio) e a sala ouve
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

## Novidades da etapa 1

- **Conexão:** o ícone de sinal agora abre sempre a janela da sala. As rolagens da mesa têm botão próprio (ícone de dado, com contador de novas). O jogador pode **Sair da sala**; o Historiador pode **Expulsar** um jogador, **Readmitir** e **Encerrar a sala para todos**.
- **Retrato:** ao escolher a imagem abre um editor quadrado com zoom e arrasto (o círculo mostra o token). O que você enquadra é o que aparece na ficha, no hub e na mesa.
- **Música:** botão de nota musical na Mesa do Historiador (link do YouTube ou de áudio, biblioteca e repetir). Os jogadores ganham um mini-player com volume e mudo próprios.
- **Visual:** hovers e animações nos botões, cartões, tokens, abas, sala e player.

## Etapa 2: imagens das cenas

- As imagens de cena (fundo e tokens) agora vão para o **Firebase Realtime Database** (`firebase-config.js`, `nuvem.js`), em `um-anel/salas/<CÓDIGO>/imgs`. O jogador lê direto de lá.
- Se o Firebase falhar (regras, config ou internet), a imagem vai pela sala em **pedaços pequenos**, e o jogador pede de volta os que faltarem.
- Ao encerrar a sala, as imagens são apagadas do banco.
- Regras necessárias no Firebase (Realtime Database > Regras): liberar leitura e escrita em `um-anel/salas/*` (veja as regras na resposta do chat). Exemplo na resposta do chat / abaixo:

```json
"um-anel": { "salas": { "$sala": {
  ".read": "$sala.matches(/^[A-Z0-9-]{5,14}$/)",
  ".write": "$sala.matches(/^[A-Z0-9-]{5,14}$/)",
  "imgs": { "$k": { "src": { ".validate": "newData.isString() && newData.val().length < 3000000" } } }
} } }
```
(dentro de `"rules": { ... }`, ao lado do nó `"salas"` que já existe)

## Etapa 3: bibliotecas de imagens e músicas

- **Imagens:** em Cenas > "Imagem…" abre a biblioteca (`biblioteca.js`, guardada no navegador do Historiador). Suba várias de uma vez e clique numa para trocar o fundo da cena a qualquer momento.
- **Músicas:** no botão de nota musical, "Arquivos do computador": adicione vários arquivos e toque quando quiser. Até 5 MB por arquivo vão para os jogadores pelo Firebase (`um-anel/salas/<CÓDIGO>/audio`); maiores tocam só para você. Links do YouTube/áudio continuam funcionando.
- Ao encerrar a sala, imagens e áudios enviados são apagados do banco.

## Etapa 4: fluxo simplificado (modelo candeiaescura)

- **Cenas:** uma fila de imagens no topo (os dois mapas + suas imagens e links). Um clique mostra a imagem aos jogadores na hora, já com a vista do Historiador; não existem mais os botões "Levar os jogadores a esta vista" nem "Transmitir minha vista". "Esconder cena"/"Mostrar cena" liga e desliga a projeção. Os jogadores acompanham o Historiador por padrão (podem desmarcar "Seguir o Historiador").
- **Trilha sonora:** uma lista única (links do YouTube/áudio e arquivos do computador) com ▶ em cada faixa; clicou, tocou para a sala. Aparece na aba Cenas e também na janela da nota musical.
