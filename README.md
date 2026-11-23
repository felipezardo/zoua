# O Um Anel 2ª edição: ficha e Mesa virtual (zoua)

Ficha interativa de **O Um Anel 2ª edição** com uma Mesa virtual para o Historiador: cenas com tokens, combate, Jornada compartilhada, música, tabelas de apoio e rolagens que todos veem. É um site estático (sem servidor próprio): HTML, CSS e JavaScript puros, publicável no GitHub Pages ou na Vercel.

## Como usar

**Publicar.** Deixe todos os arquivos na raiz do repositório e ative o GitHub Pages (ou Vercel). Duas páginas:
- `index.html`: a ficha, a Jornada e as Cenas dos **jogadores**.
- `historiador.html`: a **Mesa do Historiador**.

**Historiador.** Abra `historiador.html`, toque no ícone de sinal, **Criar sala nova** e use **Copiar link para os jogadores**. Ao fim da sessão, **Encerrar sala para todos** apaga do banco as imagens, áudios e mensagens enviados. Em Companhia ou Jornada, **Salvar a mesa inteira** baixa um arquivo com tudo (Jornada, Companhia, adversários, cena, combate) e **Carregar mesa salva** o traz de volta.

**Jogador.** Abra o link que o Historiador mandou (ou `index.html`), crie ou abra uma ficha e entre na sala pelo ícone de sinal. A ficha, a Jornada e as Cenas passam a falar com a Mesa.

## O que cada um tem

| Quem | Recursos |
|---|---|
| Jogador | Ficha completa com criação passo a passo; rolagens com todas as regras (Favorecida, Esperança, Exausto, Arrasado, ícones); Jornada compartilhada; Cenas com zoom, tela cheia e tamanho ajustável; ataque pelo token com autorização; mover o próprio token (se o Historiador permitir); retrato com enquadramento quadrado; música e rolagens da mesa |
| Historiador | Combate (Vanguarda, Aberta, Retaguarda, ordem de resolução); Companhia e adversários do bestiário com arte do livro; Cenas (fila de imagens, desenho, borracha, tokens); Jornada compartilhada com o mapa de terrenos; trilha sonora (links e arquivos); **Tabelas** por local e contexto; expulsar jogador e encerrar sala |

## Conexão em tempo real

A sala usa o **Firebase Realtime Database** (as mensagens são criptografadas com o código da sala) e, se o Firebase recusar ou não carregar, volta sozinha para o **MQTT** público. Imagens de cena e arquivos de música vão para o Firebase e os jogadores os leem de lá.

**Configuração do Firebase** (uma vez):
1. Em `firebase-config.js`, coloque os dados do seu projeto (Console do Firebase > Configurações do projeto > Seus apps). Já vem preenchido com o projeto do Candela Obscura; os dados deste jogo ficam em `um-anel/salas/<CÓDIGO>`.
2. Em Realtime Database > Regras, acrescente ao lado do que já existir:

```json
"um-anel": {
  "salas": {
    "$sala": {
      ".read": "$sala.matches(/^[A-Z0-9-]{5,14}$/)",
      ".write": "$sala.matches(/^[A-Z0-9-]{5,14}$/)",
      "imgs": { "$k": { "src": { ".validate": "newData.isString() && newData.val().length < 3000000" } } },
      "audio": { "$k": { "b64": { ".validate": "newData.isString() && newData.val().length < 8000000" } } },
      "msgs": { "$m": { ".validate": "newData.hasChildren(['t','ts']) && newData.child('t').isString() && newData.child('t').val().length < 2000000" } }
    }
  }
}
```
Para forçar o MQTT (teste): `localStorage.setItem('um-anel-transporte','mqtt')`.

## Regras do jogo conferidas com o livro

Conferido: Dado de Façanha e de Sucesso, Runa e Olho, graus de sucesso, Favorecida/Desfavorecida, Esperança (+1d, Inspirado +2d), Exausto (automático por Carga + Fadiga), Arrasado, Golpe Pesado, Golpe Perfurante, Proteção (Façanha + dados de Armadura) e os valores base das seis culturas. Não são automáticos (ficam como lembrete): Defender, Pancada de Escudo, esquivar, tarefas de combate. Veja os botões "?" (Saber mais) na ficha e nos painéis.

## Estrutura de arquivos

```
index.html, historiador.html     as duas páginas
style.css, mesa.css              visual da ficha e da Mesa
animacoes.css, livro.css         animações e estilo do livro (cantos retos, filetes, molduras)
data.js, adversarios-data.js     regras e bestiário
tabelas-data.js, tabelas.js      tabelas do Historiador
app.js, hub.js, rolagem.js, sombra.js, mapa.js    ficha, rolagens, Jornada
mesa.js, cena-gm.js, ataque-gm.js, jornada-gm.js  Mesa do Historiador
cena-jogador.js, jornada-jogador.js               Cenas e Jornada do jogador
visor.js, palco.js, arrastar.js                   cena (zoom, desenho, tokens), tamanho e painéis arrastáveis
jornada.js                       Jornada compartilhada (sincronização)
rede.js, rede-ui.js, rede-ficha.js, nuvem.js, firebase-config.js   conexão e Firebase
musica.js, biblioteca.js         música e bibliotecas (imagens e áudios no navegador)
arte.js, saber.js, livro.js      arte do livro, "Saber mais", molduras
assets/                          mapas, dados, arte (adv, herois) e molduras
tests/                           testes de navegador (python3 tests/rodar.py)
```

Ao atualizar arquivos, aumente o número `?v=` nas páginas HTML para o navegador não usar cópias antigas.

## Onde ficam os dados

- **Navegador de cada pessoa** (localStorage e IndexedDB): fichas, a mesa do Historiador, biblioteca de imagens e áudios, posições dos painéis. Limpar os dados do site apaga tudo: por isso o botão "Salvar a mesa inteira" e a exportação de ficha.
- **Firebase** (só enquanto a sala existe): mensagens criptografadas, imagens de cena e áudios da faixa tocando. Quem tem o código da sala consegue ler as imagens e os áudios, que não são criptografados. Use "Encerrar sala" ao fim da sessão.

## Testes

Playwright com Chromium (`pip install playwright pillow` e `playwright install chromium`):
`python3 tests/rodar.py` sobe um servidor local e roda os 10 testes (carregamento, retrato, fila de imagens e trilha, Jornada compartilhada, ataque pelo token, transporte Firebase simulado, cena com desenho e token, arte, tabelas, persistência). A conexão real com o Firebase e o MQTT precisa ser testada à mão.

## Pontos de atenção e próximos passos

- **Direitos autorais:** mapas, ilustrações e ornamentos vêm do livro e do PDF de mapas (© Middle-Earth Enterprises e Sophisticated Games). Para uso na sua mesa; se o repositório for público, retire `assets/adv`, `assets/herois`, `assets/livro` e os mapas.
- **Código da sala:** quem o souber entra. Para impedir alguém de voltar, crie outra sala.
- **Mover token:** não valida distância nem terreno; é confiança de mesa (o Historiador liga e desliga).
- **Ataque pelo token:** não checa alcance nem postura; considera sempre o Golpe Pesado e o Perfurar como únicas formas de gastar ícones automáticas.
- **Limites do plano gratuito do Firebase:** arquivos de música até 5 MB por faixa; muita imagem pesada com a sala aberta consome a cota mensal de download.
- **Ideias:** Registro de Jornada impresso ou em PDF, ficha em PDF, ordem de iniciativa por token, várias cenas salvas, modo de leitura para quem entra no meio da sessão.

---

# Notas de cada etapa (histórico)

Site estático (sem servidor próprio). Publica direto na Vercel/GitHub Pages: basta manter esta estrutura na **raiz** do repositório.

### Estrutura (tudo na raiz, exceto `assets/`)

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

### Como usar a mesa

1. O Historiador abre `historiador.html`, toca no ícone de sinal (barra superior) e **Cria uma sala**. Aparece um código (ex.: `K7Q2-XM9P`) e o botão **Copiar link para os jogadores**.
2. Cada jogador abre o link (ou `index.html`, abre o personagem e informa o código no ícone de sinal).
3. A partir daí: o Historiador vê as fichas em tempo real (Companhia), todos veem as rolagens de todos (aba **Cenas** e feed), e o dano/condições/posição aplicados pelo Historiador chegam à ficha do jogador.
4. Na aba **Cenas** do Historiador: escolha o fundo (mapa dos jogadores, mapa do Historiador ou uma imagem sua), coloque os tokens, e use **Mostrar aos jogadores**.

### Observações

- A sala usa brokers MQTT públicos e gratuitos (`broker.emqx.io`, `broker.hivemq.com`, `mqtt.eclipseprojects.io`, `test.mosquitto.org`), sem conta. Tudo é criptografado com o código da sala (AES-GCM). Se um servidor cair, o próximo da lista é usado. Pode-se trocar a lista em *Servidores (avançado)*.
- Exige **HTTPS** (a Vercel já fornece) para a criptografia do navegador.
- Os arquivos de mapa e o bestiário vêm de material com direitos autorais: se o repositório for público, considere deixar `assets/` e `adversarios-data.js` privados.

### Novidades da etapa 1

- **Conexão:** o ícone de sinal agora abre sempre a janela da sala. As rolagens da mesa têm botão próprio (ícone de dado, com contador de novas). O jogador pode **Sair da sala**; o Historiador pode **Expulsar** um jogador, **Readmitir** e **Encerrar a sala para todos**.
- **Retrato:** ao escolher a imagem abre um editor quadrado com zoom e arrasto (o círculo mostra o token). O que você enquadra é o que aparece na ficha, no hub e na mesa.
- **Música:** botão de nota musical na Mesa do Historiador (link do YouTube ou de áudio, biblioteca e repetir). Os jogadores ganham um mini-player com volume e mudo próprios.
- **Visual:** hovers e animações nos botões, cartões, tokens, abas, sala e player.

### Etapa 2: imagens das cenas

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

### Etapa 3: bibliotecas de imagens e músicas

- **Imagens:** em Cenas > "Imagem…" abre a biblioteca (`biblioteca.js`, guardada no navegador do Historiador). Suba várias de uma vez e clique numa para trocar o fundo da cena a qualquer momento.
- **Músicas:** no botão de nota musical, "Arquivos do computador": adicione vários arquivos e toque quando quiser. Até 5 MB por arquivo vão para os jogadores pelo Firebase (`um-anel/salas/<CÓDIGO>/audio`); maiores tocam só para você. Links do YouTube/áudio continuam funcionando.
- Ao encerrar a sala, imagens e áudios enviados são apagados do banco.

### Etapa 4: fluxo simplificado (modelo candeiaescura)

- **Cenas:** uma fila de imagens no topo (os dois mapas + suas imagens e links). Um clique mostra a imagem aos jogadores na hora, já com a vista do Historiador; não existem mais os botões "Levar os jogadores a esta vista" nem "Transmitir minha vista". "Esconder cena"/"Mostrar cena" liga e desliga a projeção. Os jogadores acompanham o Historiador por padrão (podem desmarcar "Seguir o Historiador").
- **Trilha sonora:** uma lista única (links do YouTube/áudio e arquivos do computador) com ▶ em cada faixa; clicou, tocou para a sala. Aparece na aba Cenas e também na janela da nota musical.

### Etapa 5: Jornada compartilhada, ataque pelo token e Firebase na conexão

- **Jornada compartilhada** (`jornada.js`, `jornada-gm.js`, `jornada-jogador.js`): a ficha de Jornada (registro, Companhia, pôneis, diário, eventos e marcas do mapa) é a mesma para o Historiador e os jogadores conectados. Nova aba **Jornada** na Mesa do Historiador. O Historiador guarda tudo na mesa (vai no "Salvar a mesa inteira"). O jogador que entra recebe a Jornada do Historiador; se a do Historiador estiver vazia, a do jogador a preenche. O mapa dos jogadores é sempre o dos jogadores; só o Historiador tem o olho para ver o mapa dele (na tela dele).
- **Ataque pelo token** (`ataque-gm.js`, `cena-jogador.js`): o jogador toca num token adversário e vê as armas da própria ficha. Ao escolher uma, o Historiador recebe um cartão para **Autorizar** ou **Negar**. Autorizado, a rolagem sai com os valores da ficha (com o Bloqueio do adversário somado ao NA). Ao acertar, o dano (arma + Golpe Pesado por ícone) é descontado da Resistência; num Golpe Perfurante o adversário faz a Proteção (dados de Armadura contra o Ferimento da arma) e, se falhar, sofre um Ferimento.
- **Firebase na conexão** (`rede.js`): a sala agora passa as mensagens pelo Firebase (`um-anel/salas/<CÓDIGO>/msgs`, criptografadas com o código). Se o Firebase recusar ou não carregar, volta sozinha para o MQTT público. Para forçar o MQTT: `localStorage.setItem('um-anel-transporte','mqtt')`.

### Regras finais do Firebase (Realtime Database > Regras)

Acrescente o bloco `"um-anel"` ao lado do `"salas"` que já existe:

```json
"um-anel": { "salas": { "$sala": {
  ".read": "$sala.matches(/^[A-Z0-9-]{5,14}$/)",
  ".write": "$sala.matches(/^[A-Z0-9-]{5,14}$/)",
  "imgs": { "$k": { "src": { ".validate": "newData.isString() && newData.val().length < 3000000" } } },
  "audio": { "$k": { "b64": { ".validate": "newData.isString() && newData.val().length < 8000000" } } },
  "msgs": { "$m": { ".validate": "newData.hasChildren(['t','ts']) && newData.child('t').isString() && newData.child('t').val().length < 2000000" } }
} } }
```
Use **Encerrar sala** ao fim da sessão: apaga do banco as imagens, áudios e mensagens da sala.

### Etapa 6: visual do livro, ferramentas da cena

- **Visual (`livro.css`, `livro.js`)**: cantos retos, filetes vermelhos finos e duplos, papel liso, sem sombras suaves nem degradês; só tokens e rostos continuam redondos. O ornamento das margens em telas largas (≥1500 px) foi extraído da página de capítulo do livro (`assets/livro/`).
- **Painéis arrastáveis (`arrastar.js`)**: Rolagem, Rolagens da mesa, música e pedidos de ataque se movem pelo cabeçalho; duplo clique devolve ao lugar. A posição fica guardada.
- **Cena ajustável (`palco.js`)**: botões de zoom, "Ajustar" e tela cheia; alça embaixo muda a altura e divisória muda a largura (duplo clique restaura).
- **Desenho na cena**: o Historiador desenha (várias cores e espessuras), apaga com a borracha, desfaz e limpa; os jogadores veem na hora. Os desenhos somem quando o fundo da cena muda.
- **Token do jogador**: caixa "Jogadores movem o próprio token" (liga/desliga). O jogador só move o próprio herói (marcado com um losango).

### Etapa 7: conferência das regras com o livro

Conferido com o livro (PDF): Dado de Façanha e de Sucesso, Runa/Olho, graus de sucesso (ícones), Favorecida/Desfavorecida (e a regra de uma anular a outra), Esperança (+1d, Inspirado +2d), Exausto (1, 2 e 3 valem 0; automático pela Carga + Fadiga), Arrasado (Olho = falha), Golpe Pesado (FORÇA, +1 com arma de duas mãos), Golpe Perfurante (10 ou Runa) e os valores base das seis culturas (Resistência, Esperança, Bloqueio).

Corrigido:
- A Proteção do adversário no ataque vindo do token usava só dados de Armadura. Agora é Dado de Façanha + dados de Armadura contra o Ferimento (Runa protege; adversário de Ódio usa o Dado de Façanha invertido), reaproveitando a mesma função da ficha do token (`aplicarGolpe` em `mesa.js`).
- Ao chegar ao Poder, o adversário cai na hora; com 0 de Resistência, sai do combate.
- Depois de acertar, o jogador escolhe como gastar os ícones: Golpe Pesado ou Perfurar (Arcos, Lanças e Espadas). Defender e Pancada de Escudo seguem manuais, como lembrete.

"Saber mais" (`saber.js`): botão "?" discreto com lembretes curtos em Condições, Rolagem (modo, Esperança), nos painéis de ataque e no cartão de autorização do Historiador.

### Etapa 8: arte do livro

- **Adversários** (`arte.js`, `assets/adv/`): as 24 criaturas têm ilustração extraída do livro, sem fundo (WebP transparente), que aparece na ficha dele (modal do adversário e painel do token) como figura solta sobre o papel. O token usa o rosto recortado, em quadrado, sem depender de ajuste manual. Onde o livro não tem arte própria, vale a mais próxima (por exemplo, Chefe Rufião usa a do Saqueador Sulista; Rei das Aparições, a da Aparição Tumular).
- **Heróis** (`assets/herois/`): retrato padrão por cultura heróica (Anões de Durin, Bardeses de Vale, Elfos de Lindon, Hobbits do Condado, Homens de Bri e Patrulheiros do Norte), tirado da ilustração de cada cultura no livro. Aparece na ficha, no hub, no token e no que o Historiador recebe, até o jogador escolher o próprio retrato.
- Um adversário personalizado com imagem própria continua usando a dele.
- Aviso: as ilustrações são do livro de regras (com direitos autorais). Se o repositório for público, considere deixá-lo privado ou tirar a pasta `assets/adv` e `assets/herois` do que for publicado.

### Etapa 9: mapas do livro, ajustes de arte e Tabelas

- **Mapas:** `assets/eriador.webp` (jogadores) e `assets/eriador-historiador.webp` (terrenos e hexágonos) agora vêm do PDF de mapas do livro, na resolução original embutida (2587 × 1683). A malha do app foi remedida nos hexágonos do próprio mapa e o espaço lógico (5174 × 3366) foi ajustado, mantendo os mesmos índices de hexágono: marcas já salvas continuam no lugar. As Cenas não trazem mais os mapas (nem usam fundo por padrão); mesas antigas que usavam o mapa começam sem fundo.
- **Arte:** corrigida conforme as armas e descrições. Arqueiro Goblin usa o arqueiro do livro; Chefe Grande Orc e Guarda-costas usam o Grande Orc de cimitarra e escudo; Guarda e Soldado Orc, o orc de escudo redondo; Salteador (Cassetete) usa o brutamontes de tacape; Chefe Rufião e Ladrão de Estrada, o rufião sentado.
- **Tabelas do Historiador (`tabelas-data.js`, `tabelas.js`):** nova aba. 8 locais (Na estrada, Na luta, Perigo e Sombra, Vigilância do Olho, Conselho, Tesouro, Descanso e Sociedade, Coisa Inominável) e, dentro deles, grupos por contexto. Cada tabela diz quando e como usar e, nas que se jogam, tem botão Rolar (com região ou severidade para o Dado de Façanha) que destaca a linha. Há busca por palavra.
