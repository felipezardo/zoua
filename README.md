# O Um Anel 2e: ficha interativa e Mesa do Historiador

Site estático (sem servidor próprio). Publica direto na Vercel/GitHub Pages: basta manter esta estrutura na **raiz** do repositório.

## Estrutura (tudo na raiz, exceto `assets/`)

```
index.html            ficha, jornada e cenas dos JOGADORES
historiador.html      Mesa do HISTORIADOR (combate, cenas, jornada, companhia, adversários)

style.css             visual compartilhado (tema claro/escuro, ficha, cenas, rolagens, animações)
mesa.css              visual extra da Mesa do Historiador

data.js               regras (culturas, virtudes, recompensas, equipamento, posturas)
adversarios-data.js   bestiário do livro (24 fichas)
mesa-exemplo.js       3 heróis de exemplo (botão "Carregar exemplo")
jornada.js            modelo e HTML compartilhado da Ficha de Jornada

app.js                lógica da ficha do jogador
hub.js                galeria de fichas, abas, recorte quadrado (1:1) de retrato, Jornada, tema
mapa.js               mapa da Jornada (Eriador) com grade hexagonal e proteção por senha ("mordor")
sombra.js             testes de Sombra e Esperança
rolagem.js            resultado das rolagens, animações, histórico

rede.js               conexão em tempo real (MQTT por WebSocket + criptografia + recuperação NACK de pacotes)
rede-ui.js            botão de sala, janela de conexão, expulsar/encerrar/sair, rolagens da mesa
rede-ficha.js         liga a ficha e a Jornada compartilhada à sala em tempo real
visor.js              visor de cena (mapa ou imagem + tokens, zoom e arrasto)
cena-jogador.js       aba "Cenas" do jogador (visor + seleção de adversário e ataque contextual)
cena-gm.js            aba "Cenas" do Historiador
jornada-gm.js         aba "Jornada" compartilhada na Mesa do Historiador
mesa.js               Mesa do Historiador (companhia, bestiário, combate, tokens, autorização de ataques)
tutorial.js           Guia de Uso e Tutorial interativo (botão "?" na barra superior)

assets/
  eriador.webp                mapa dos jogadores
  eriador-historiador.webp    mapa do Historiador
  dados/
    olho-de-sauron.png  olho-fechado.png  icone-de-sucesso.png  runa-de-gandalf.png
```

## Tutorial Completo de Uso

> **Dica:** Dentro do próprio site (tanto na ficha do jogador quanto na Mesa do Historiador), clique no botão **`?`** na barra superior direita para abrir o **Guia de Uso Interativo** a qualquer momento.

### 1. Conexão da Sala, Expulsar, Sair e Rolagens
1. **Abrir Sala (Historiador):** Abra `historiador.html`, clique no **ícone de sinal** (ondas na barra superior direita) e clique em **Criar sala nova**. Copie o código (ex.: `K7Q2-XM9P`) ou clique em **Copiar link para os jogadores**.
2. **Conectar (Jogadores):** Cada jogador abre o link ou entra em `index.html`, abre sua ficha, clica no **ícone de sinal**, digita o código da sala e clica em **Entrar**.
3. **Gerenciar Conexão vs. Histórico de Rolagens:**
   - Clicar no **ícone de sinal** (`#rede-bt`) **sempre abre a janela da Sala da Mesa** (`#dlg-rede`), mesmo quando já conectado.
   - Ao lado do ícone de sinal há o **ícone de dado** (`#rede-rolagens-bt`), que abre e fecha a bandeja flutuante com as **Rolagens da Mesa**.
4. **Sair, Expulsar e Encerrar Sala:**
   - **Jogador:** Pode clicar no ícone de sinal e escolher **Sair da sala** a qualquer momento.
   - **Historiador — Expulsar jogador:** Na janela da sala, clique em **Expulsar** ao lado do nome de um jogador. Após confirmar, o jogador expulso é desconectado com aviso e todos os demais jogadores migram automaticamente para um novo código de sala seguro.
   - **Historiador — Encerrar sala:** Clique em **Encerrar sala para todos** para encerrar a conexão de toda a mesa.

### 2. Ficha do Aventureiro e Retrato Quadrado (1:1)
- **Recorte Quadrado do Retrato:** Ao clicar no quadro **Retrato** na ficha (ou no botão **Retrato** no cartão do personagem na tela inicial) e escolher uma imagem do computador, abre-se o **Seletor de Recorte Quadrado (1:1)**.
- Arraste a imagem dentro do quadrado e ajuste o controle de **Zoom** para centralizar o rosto do personagem. Ao lado, confira em tempo real a **Prévia no Token** circular e clique em **Salvar recorte quadrado**.

### 3. Ficha de Jornada Compartilhada e Mapa de Eriador (Senha `"mordor"`)
- **Jornada Compartilhada:** A aba **Jornada** está presente tanto em `index.html` quanto em `historiador.html`. A partir do momento em que estão conectados na sala, qualquer preenchimento de rota, dias, papéis da Companhia, fadiga de viagem, pôneis, eventos ou marcação de hexágonos no mapa é sincronizado automaticamente entre todos os jogadores e o Historiador.
- **Salvar Tudo para a Próxima Sessão:** Na aba **Companhia** do Historiador, o botão **Salvar mesa** baixa o arquivo `.json` com **toda a sessão**: Combate, Companhia, Cenas e toda a Ficha de Jornada compartilhada.
- **Olhinho do Mapa e Senha (`mordor`):**
  - Por padrão, o mapa exibido é sempre o **Mapa dos Jogadores** (`assets/eriador.webp`).
  - Ao clicar no botão do **Olhinho** (`#mapa-olho`) no canto superior direito do mapa — seja o Historiador ou qualquer pessoa — o sistema exige a senha **`mordor`**.
  - Quando o Historiador alterna a versão do mapa na sala conectada, a versão escolhida (**Mapa dos Jogadores** ou **Mapa do Historiador**) passa a ser exibida automaticamente para todos os jogadores conectados.

### 4. Aba Cenas, Botão "Enquadrar Cena" e Ataques Contextuais
- **O que faz o botão "Enquadrar cena" (antigo *"Ver tudo"*):**
  - No visor de Cenas, você pode dar zoom com a roda do mouse (ou pinça) e arrastar a câmera.
  - O botão **Enquadrar cena** serve para **recentralizar o mapa/imagem e ajustar o zoom automaticamente** para que a cena inteira caiba novamente na sua tela.
- **Imagens Selecionadas no Computador:** Na aba **Cenas** do Historiador, clique em **Imagem…** para escolher qualquer imagem do seu computador e clique em **Mostrar aos jogadores**. O protocolo de rede divide a imagem em pacotes compactos com retransmissão automática de partes perdidas, garantindo que todos os jogadores recebam a imagem rapidamente.
- **Selecionar Token do Adversário e Atacar com Autorização do Historiador:**
  1. Na aba **Cenas** do jogador, **clique no token de um adversário** no mapa (ou no botão com o nome dele na barra acima do mapa).
  2. Abre-se na lateral o painel **⚔ Atacar [Adversário]**, já preenchido com as **armas equipadas, proficiências, posição de combate, Força, Esperança e condições** da própria ficha do jogador, somando automaticamente o **Bloqueio do adversário** ao **NA de Força**.
  3. O jogador escolhe a arma e opções (Esperança, Inspirado, modo) e clica em **⚔ Rolar ataque (pedir autorização ao Historiador)**.
  4. Na tela do Historiador, abre-se imediatamente a janela **⚔ Autorizar ataque na Cena** com todos os parâmetros (permitindo ao Historiador ajustar o modo ou dados extras se desejar).
  5. Quando o Historiador clica em **Autorizar e rolar**, a rolagem acontece, é publicada no feed da mesa e **aplica automaticamente a perda de Resistência, Golpes Pesados, Golpe Perfurante, a rolagem de Proteção da armadura do adversário e os Ferimentos** diretamente no adversário!

## Observações Técnicas

- A sala usa brokers MQTT públicos e gratuitos (`broker.emqx.io`, `broker.hivemq.com`, `mqtt.eclipseprojects.io`, `test.mosquitto.org`), sem conta. Tudo é criptografado com o código da sala (AES-GCM).
- Exige **HTTPS** (ou `localhost`) para a API Web Crypto (`crypto.subtle`) do navegador.
