// ============ DADOS DO JOGO (O Um Anel 2e, livro básico) ============
// Para corrigir ou acrescentar algo, edite apenas este arquivo.
const PADROES = ['Pobre', 'Frugal', 'Comum', 'Próspero', 'Rico', 'Muito Rico'];
const PROFS = ['Machados', 'Arcos', 'Lanças', 'Espadas'];
const SET = 'Fascínio,Atletismo,Vigilância,Caçada,Música,Ofício|Indução,Viagem,Discernimento,Cura,Cortesia,Batalha|Persuasão,Furtividade,Busca,Exploração,Enigma,História';
// níveis iniciais na ordem das três colunas da ficha (Força | Coração | Astúcia)
const nivelP = (s) => { const nomes = SET.split('|').flatMap(c => c.split(',')); const o = {}; s.split(/[,|]/).forEach((v, i) => o[nomes[i]] = +v); return o; };

const CULTURAS = {
  anoes: { nome: 'Anões de Durin', padrao: 'Próspero', base: { res: 22, esp: 8, blo: 10 },
    bencao: ['Formidável', 'Você reduz pela metade (arredondando para cima) a Carga de qualquer armadura e elmo que usar. Escudos não entram.'],
    traco: ['Naugrim', 'Não podem usar Arco Grande, Lança Longa nem Escudo Grande.'],
    proibidos: ['Arco Grande', 'Lança Longa', 'Escudo Grande'],
    conjuntos: [[7,2,5],[7,3,4],[6,3,5],[6,4,4],[5,4,5],[6,2,6]],
    pericias: nivelP('2,1,0,0,1,2|0,3,0,0,1,1|0,0,3,2,2,1'), fav: ['Viagem', 'Ofício'], prof: ['Machados', 'Espadas'],
    tracos: ['Astuto','Cauteloso','Feroz','Nobre','Orgulhoso','Severo','Sigiloso','Teimoso'] },
  bardeses: { nome: 'Bardeses de Vale', padrao: 'Próspero', base: { res: 20, esp: 8, blo: 12 }, favValor: true,
    bencao: ['Coração Forte', 'Suas jogadas de VALOR são Favorecidas.'], traco: null,
    conjuntos: [[5,7,2],[4,7,3],[5,6,3],[4,6,4],[5,5,4],[6,6,2]],
    pericias: nivelP('1,1,0,2,1,1|2,1,2,0,2,2|3,0,1,1,0,1'), fav: ['Indução', 'Atletismo'], prof: ['Arcos', 'Espadas'],
    tracos: ['Alto','Ansioso','Belo','Bravo','Feroz','Generoso','Orgulhoso','Teimoso'] },
  elfos: { nome: 'Elfos de Lindon', padrao: 'Frugal', base: { res: 20, esp: 8, blo: 12 },
    bencao: ['Perícia Élfica', 'Se não estiver Arrasado, gaste 1 Esperança para obter um sucesso Mágico ao usar uma Perícia em que tenha ao menos 1 nível.'],
    traco: ['A Longa Derrota', 'Na Fase de Sociedade você só remove no máximo 1 ponto de Sombra.'],
    conjuntos: [[5,2,7],[4,3,7],[5,3,6],[4,4,6],[5,4,5],[6,2,6]],
    pericias: nivelP('2,2,2,0,2,2|1,0,0,1,0,0|0,3,0,0,0,3'), fav: ['Música', 'História'], prof: ['Arcos', 'Lanças'],
    tracos: ['Ágil','Alegre','Belo','Cauteloso','Nobre','Olhar Aguçado','Paciente','Sutil'] },
  hobbits: { nome: 'Hobbits do Condado', padrao: 'Comum', base: { res: 18, esp: 10, blo: 12 }, favSab: true,
    bencao: ['Bom-senso Hobbit', 'Seus testes de SABEDORIA são Favorecidos e você ganha (1d) nos Testes de Sombra contra Ganância.'],
    traco: ['Pequeninos', 'Só usam: Adaga, Arco, Cassetete, Espada Curta, Lança Curta, Lança, Machado e Tacape. Sem Escudo Grande.'],
    permitidas: ['Adaga','Arco','Cassetete','Espada Curta','Lança Curta','Lança','Machado','Tacape'], proibidos: ['Escudo Grande'],
    conjuntos: [[3,6,5],[3,7,4],[2,7,5],[4,6,4],[4,5,5],[2,6,6]],
    pericias: nivelP('0,0,2,0,2,1|0,0,2,1,2,0|2,3,0,0,3,0'), fav: ['Furtividade', 'Cortesia'], prof: ['Arcos', 'Espadas'],
    tracos: ['Alegre','Ansioso','Eloquente','Fiel','Honrado','Inquisitivo','Olhar Aguçado','Rústico'] },
  bri: { nome: 'Homens de Bri', padrao: 'Comum', base: { res: 20, esp: 10, blo: 10 },
    bencao: ['Sangue de Bri', 'Cada homem de Bri na Companhia aumenta o Nível da Sociedade em 1 ponto.'], traco: null,
    conjuntos: [[2,5,7],[3,4,7],[3,5,6],[4,4,6],[4,5,5],[2,6,6]],
    pericias: nivelP('0,1,1,1,1,2|2,1,2,0,3,0|2,1,1,1,2,0'), fav: ['Discernimento', 'Enigma'], prof: ['Machados', 'Lanças'],
    tracos: ['Astuto','Inquisitivo','Eloquente','Fiel','Generoso','Paciente','Rústico','Sincero'] },
  patrulheiros: { nome: 'Patrulheiros do Norte', padrao: 'Frugal', base: { res: 20, esp: 6, blo: 14 }, bonusAttr: true,
    bencao: ['Reis dos Homens', 'Adicione 1 ponto a um Atributo de sua escolha (use o seletor ao lado).'],
    traco: ['Fidelidade dos Dúnedain', 'Na Fase de Sociedade você recupera no máximo metade do seu CORAÇÃO (arredondado para cima) em Esperança.'],
    conjuntos: [[7,5,2],[7,4,3],[6,5,3],[6,4,4],[5,5,4],[6,6,2]],
    pericias: nivelP('1,2,2,2,0,0|0,2,0,2,0,2|0,2,1,2,0,2'), fav: ['Caçada', 'História'], prof: ['Lanças', 'Espadas'],
    tracos: ['Ágil','Alto','Bravo','Honrado','Severo','Sigiloso','Sincero','Sutil'] },
};

// Recompensas: uma na criação (VALOR 1) e uma nova a cada nível de VALOR (máx. 6).
const RECOMPENSAS = [
  { id: 'afiada', nome: 'Afiada', alvo: ['arma'], desc: 'Também causa Golpe Perfurante com 9 no Dado de Façanha.' },
  { id: 'ajustado', nome: 'Ajustado', alvo: ['armadura', 'elmo'], desc: 'Soma +2 ao resultado da jogada de PROTEÇÃO.' },
  { id: 'fabricacao', nome: 'Fabricação Habilidosa', alvo: ['armadura', 'elmo', 'escudo'], desc: 'Reduz a Carga do item em 2 (mínimo 0).' },
  { id: 'cruel', nome: 'Cruel', alvo: ['arma'], desc: 'Soma 2 ao valor de Ferimento da arma.' },
  { id: 'atroz', nome: 'Atroz', alvo: ['arma'], desc: 'Soma 1 ao valor de Dano da arma.' },
  { id: 'reforcado', nome: 'Reforçado', alvo: ['escudo'], desc: 'Soma 1 ao bônus de Bloqueio do escudo.' },
];

// Virtudes: uma na criação (SABEDORIA 1) e uma nova a cada nível de SABEDORIA.
// As Culturais só entram a partir de SABEDORIA 2 e só para a própria Cultura. ef = efeito automático.
const VIRTUDES = [
  { id: 'dom', nome: 'Dom', desc: 'Reduza em 1 o NA de um Atributo (aumente o Nível dele em 1 à mão).' },
  { id: 'confianca', nome: 'Confiança', desc: 'Esperança máxima +2.', ef: { esp: 2 } },
  { id: 'destreza', nome: 'Destreza', desc: 'Bloqueio +1.', ef: { blo: 1 } },
  { id: 'maestria', nome: 'Maestria', desc: 'Escolha duas Perícias e torne-as Favorecidas (marque as caixas).' },
  { id: 'maos', nome: 'Mãos Inclementes', desc: 'No Dano Especial: +1 FORÇA no Golpe Pesado e +1 no Dado de Façanha do Perfurar.' },
  { id: 'resiliencia', nome: 'Resiliência', desc: 'Resistência máxima +2, ou o valor de SABEDORIA se maior.', ef: { res: 'sab' } },
  // Anões
  { c: 'anoes', id: 'baruk', nome: 'Baruk Khazâd!', desc: 'Uma vez por combate, na Vanguarda: ataque Favorecido e Intimidar Inimigo como ação secundária.' },
  { c: 'anoes', id: 'durin', nome: 'Caminho de Durin', desc: 'Bloqueio +2 ao lutar no subsolo ou em locais apertados.' },
  { c: 'anoes', id: 'duro', nome: 'Duro como Pedra', desc: 'Resistência máxima +1. Jogadas de PROTEÇÃO Favorecidas enquanto não Arrasado.', ef: { res: 1 } },
  { c: 'anoes', id: 'escuro', nome: 'Escuro para Negócios Obscuros', desc: 'No escuro (noite ou subsolo) você está Inspirado em todas as jogadas.' },
  { c: 'anoes', id: 'indomavel', nome: 'Espírito Indomável', desc: 'Esperança máxima +1 e (1d) nos Testes de Sombra contra Feitiçaria.', ef: { esp: 1 } },
  { c: 'anoes', id: 'encantamentos', nome: 'Pedaços de Encantamentos', desc: 'Marque 3 Perícias com ao menos 1 nível; ao usá-las, gaste 1 Esperança para um sucesso Mágico.' },
  // Bardeses
  { c: 'bardeses', id: 'amigo', nome: 'Amigo dos Anões', desc: 'Foco de Sociedade Anão: Proteger Companheiro como ação secundária; anões sempre amigáveis no Conselho.' },
  { c: 'bardeses', id: 'cram', nome: 'Cram', desc: 'Cada evento de Jornada dá 1 Fadiga a menos; no Descanso Curto a Companhia recupera Resistência extra igual à sua SABEDORIA.' },
  { c: 'bardeses', id: 'disparo', nome: 'Disparo Feroz', desc: 'Golpe Perfurante à distância: a jogada de PROTEÇÃO do alvo é Desfavorecida.' },
  { c: 'bardeses', id: 'destino', nome: 'Grande Destino', desc: 'Na primeira vez que receberia um ferimento mortal, você sobrevive Ferido e ganha +1 de Esperança máxima (uma vez).' },
  { c: 'bardeses', id: 'passaros', nome: 'A Língua dos Pássaros', desc: 'Fale com pássaros; ao ar livre, uma vez por Combate, Conselho ou Viagem, fique Inspirado em uma jogada.' },
  { c: 'bardeses', id: 'matador', nome: 'Matador de Dragões', desc: 'Contra criaturas de Poder 2 ou mais, todos os seus ataques são Favorecidos.' },
  // Elfos
  { c: 'elfos', id: 'arqueria', nome: 'Arqueria Mortal', desc: 'Com Arco (não Grande) na Retaguarda, use Preparar Disparo como ação secundária.' },
  { c: 'elfos', id: 'invisivel', nome: 'Contra o Invisível', desc: 'Testes de Sombra por Pavor Favorecidos; (1d) contra espíritos malignos e fantasmas.' },
  { c: 'elfos', id: 'elbereth', nome: 'Elbereth Gilthoniel!', desc: 'Esperança máxima +1. Na Fase de Aventura, fique Inspirado em jogadas iguais à sua SABEDORIA.', ef: { esp: 1 } },
  { c: 'elfos', id: 'luzir', nome: 'Luzir de Ira', desc: 'Ao acertar, o adversário também perde 1 de Ódio/Determinação, mais 1 por ícone de Sucesso.' },
  { c: 'elfos', id: 'memoria', nome: 'Memória dos Tempos Antigos', desc: 'Eventos de Jornada rolam como se a região fosse um nível mais segura; você pode cobrir também o papel de Batedor.' },
  { c: 'elfos', id: 'sonhos', nome: 'Sonhos Élficos', desc: 'Não precisa dormir; o Descanso Curto vale como Descanso Prolongado.' },
  // Hobbits
  { c: 'hobbits', id: 'desaparecer', nome: 'Arte de Desaparecer', desc: 'Havendo qualquer chance de se esconder, teste FURTIVIDADE: no sucesso você simplesmente desaparece.' },
  { c: 'hobbits', id: 'coragem', nome: 'Coragem no Aperto', desc: 'Arrasado, Exausto ou Ferido, você está Inspirado em todas as jogadas.' },
  { c: 'hobbits', id: 'alvo', nome: 'No Alvo', desc: 'Ataques à distância Favorecidos. Pedra arremessada: Perfurante com a runa, Ferimento 12.' },
  { c: 'hobbits', id: 'povo', nome: 'Povo Pequeno', desc: 'Bloqueio +2 contra criatura maior em corpo a corpo; pode ficar na Retaguarda com apenas um outro lutador na linha de frente.' },
  { c: 'hobbits', id: 'resistente', nome: 'Resistente como Raízes Antigas', desc: 'Gravidade do Ferimento com dois Dados de Façanha (o melhor); dobra a FORÇA ao recuperar Resistência no descanso.' },
  { c: 'hobbits', id: 'tres', nome: 'Três é Companhia', desc: 'Sociedade da Companhia +1 e você pode ter um segundo Foco de Sociedade.' },
  // Homens de Bri
  { c: 'bri', id: 'amigavel', nome: 'Amigável e Familiar', desc: '+1 no máximo de testes de Perícia num Conselho; os povos encontrados são sempre amigáveis.' },
  { c: 'bri', id: 'fumo', nome: 'A Arte do Fumo', desc: 'Sempre que recuperar Esperança, recupere 1 ponto adicional.' },
  { c: 'bri', id: 'coragemdes', nome: 'Coragem Desesperada', desc: 'Ao gastar Esperança numa jogada, pode ganhar 1 de Sombra para ficar Inspirado nela.' },
  { c: 'bri', id: 'estranho', nome: 'Estranho como Notícias de Bri', desc: 'Um boato do Historiador por Fase de Sociedade; em Bri, (1d) em DISCERNIMENTO e ENIGMA.' },
  { c: 'bri', id: 'ponei', nome: 'Pônei de Bri', desc: 'Esperança máxima +1; seu pônei tem Vigor 4.', ef: { esp: 1 } },
  { c: 'bri', id: 'bri_res', nome: 'Resiliência de Bri', desc: 'Resistência máxima +1; ao fim de cada Combate, se não Ferido/Exausto/Arrasado, recupere Resistência (CORAÇÃO ou VALOR, o maior).', ef: { res: 1 } },
  // Patrulheiros
  { c: 'patrulheiros', id: 'vontade', nome: 'Força de Vontade', desc: '(1d) nos Testes de Sombra contra Pavor.' },
  { c: 'patrulheiros', id: 'herdeiro', nome: 'Herdeiro de Arnor', desc: 'Com o Historiador, crie um Artefato Magnífico ou Arma Famosa (1 Recompensa Encantada e até 2 normais).' },
  { c: 'patrulheiros', id: 'premonicao', nome: 'Premonição de Seu Povo', desc: 'Na Fase de Aventura, SABEDORIA vezes, refaça todos os dados de uma jogada (sua, de aliado ou de adversário).' },
  { c: 'patrulheiros', id: 'realeza', nome: 'Realeza Revelada', desc: 'Uma vez por combate, na Posição Aberta, use Inspirar Camaradas; a Companhia fica Inspirada na rodada seguinte.' },
  { c: 'patrulheiros', id: 'patr_res', nome: 'Resistência do Patrulheiro', desc: 'Resistência máxima +1. Sem armadura (ou de couro sem Elmo) e sem escudo, nunca ganha Fadiga de viagem.', ef: { res: 1 } },
  { c: 'patrulheiros', id: 'ermos', nome: 'Vida nos Ermos', desc: 'Em EXPLORAÇÃO, CAÇADA ou VIAGEM, gaste 1 Esperança para sucesso Mágico; pode cobrir mais de um papel na Jornada.' },
];

// Equipamento de guerra: nome, Dano, Ferimento, Carga, Proficiência, notas
// m = mãos: 1, 2 ou 12 (pode ser usada com 1 ou 2). f1 e f2 = Ferimento com 1 e com 2 mãos (null = não se aplica).
const ARMAS = [
  ['Desarmado',1,null,null,0,'Briga',1,'Inclui atirar pedras. Não causa Golpe Perfurante'],
  ['Adaga',2,14,null,0,'Briga',1,'Pode Perfurar como uma Espada'], ['Cassetete',3,12,null,0,'Briga',1,''], ['Tacape',4,14,null,1,'Briga',1,''],
  ['Espada Curta',3,16,null,1,'Espadas',1,''], ['Espada',4,16,null,2,'Espadas',1,''], ['Espada Longa',5,16,18,3,'Espadas',12,'1 ou 2 mãos'],
  ['Lança Curta',3,14,null,2,'Lanças',1,'Pode ser jogada'], ['Lança',4,14,16,3,'Lanças',12,'1 ou 2 mãos; pode ser jogada'], ['Lança Longa',5,null,16,4,'Lanças',2,'2 mãos'],
  ['Machado',5,18,null,2,'Machados',1,''], ['Machado de Haste Longa',6,18,20,3,'Machados',12,'1 ou 2 mãos'], ['Machado Grande',7,null,20,4,'Machados',2,'2 mãos'], ['Picareta',7,null,18,3,'Machados',2,'2 mãos'],
  ['Arco',3,null,14,2,'Arcos',2,'À distância; 2 mãos'], ['Arco Grande',4,null,16,4,'Arcos',2,'À distância; 2 mãos'],
].map(([n, d, f1, f2, c, p, m, nt]) => ({ n, d, f1, f2, c, p, m, nt }));
const ARMADURAS = [ // p = dados de Proteção; req = Padrão de Vida mínimo
  { n: 'Camisa de Couro', p: 1, c: 3 }, { n: 'Colete de Couro', p: 2, c: 6 },
  { n: 'Camisa de Malha', p: 3, c: 9, req: 'Comum' }, { n: 'Cota de Malha', p: 4, c: 12, req: 'Próspero' }];
const ELMOS = [{ n: 'Elmo', p: 1, c: 4 }];
const ESCUDOS = [{ n: 'Broquel', b: 1, c: 2 }, { n: 'Escudo', b: 2, c: 4, req: 'Comum' }, { n: 'Escudo Grande', b: 3, c: 6, req: 'Próspero' }];

// Chamados: duas das três Perícias viram Favorecidas; cada um traz uma Característica Notável e um Caminho das Sombras.
const CHAMADOS = {
  cacador: { nome: 'Caçador de Tesouros', pericias: ['Exploração', 'Busca', 'Furtividade'],
    resumo: 'Você busca recuperar a herança perdida de reis anões e senhores élficos, guardada em masmorras e cavernas, mesmo diante de perigos indescritíveis.',
    traco: ['Ladroagem', 'Punga, arrombamento de fechaduras e qualquer meio discutível de tomar bens alheios ou entrar em áreas protegidas.'],
    caminho: ['Doença do Dragão', 'Quem busca riquezas perdidas corre o risco de ser consumido pela cobiça: conforme a Sombra aperta, o mundo e as posses de quem a sofre encolhem.'] },
  campeao: { nome: 'Campeão', pericias: ['Atletismo', 'Fascínio', 'Caçada'],
    resumo: 'Para você, só há um modo de enfrentar a Sombra: vencê-la pela força das armas. É um guerreiro reconhecido entre seu povo e vai direto aonde os inimigos rondam.',
    traco: ['Conhecimento sobre Inimigos', 'Você conhece hábitos, pontos fortes e fracos de um tipo de inimigo à sua escolha.'],
    inimigos: ['Homens Malignos', 'Orcs', 'Aranhas', 'Trolls', 'Wargs', 'Mortos-Vivos'],
    caminho: ['Maldição da Vingança', 'Quem vive pela espada é tentado a sacá-la quando contrariado ou ofendido; com a corrupção, as reações ficam cada vez mais violentas.'] },
  capitao: { nome: 'Capitão', pericias: ['Batalha', 'Indução', 'Persuasão'],
    resumo: 'Em um mundo à beira da ruína, você escolheu pôr seu julgamento a serviço dos outros e guiá-los, para que o sigam por confiança e não por medo.',
    traco: ['Liderança', 'Capacidade de direcionar os outros para a ação; sob pressão, as pessoas se voltam naturalmente para você.'],
    caminho: ['Tentação do Poder', 'Quem recebe autoridade pode confundir o próprio engrandecimento com o bem de quem deveria proteger; o poder é a porta fácil da Sombra.'] },
  erudito: { nome: 'Erudito', pericias: ['Ofício', 'História', 'Enigma'],
    resumo: 'Para você o conhecimento torna o mundo selvagem menos ameaçador: mapas, livros e canções antigas substituem o medo do desconhecido por curiosidade.',
    traco: ['Rimas de História', 'Versos curtos criados pelas Culturas para guardar fatos da história antiga; muito do conhecimento dos eruditos vem deles.'],
    caminho: ['Tentação dos Segredos', 'A curiosidade é uma virtude, mas o saber pode servir à malícia e levar a desprezar os "ignorantes"; o desejo de descobrir segredos corrompe o coração.'] },
  guardiao: { nome: 'Guardião', pericias: ['Vigilância', 'Cura', 'Discernimento'],
    resumo: 'Você jurou defender quem não pode se defender sozinho, muitas vezes longe das áreas civilizadas, e por isso é um estranho aos olhos do povo comum.',
    traco: ['História da Sombra', 'Você percebe o fio oculto que une grande parte do que é maligno na Terra-média, e que engrossa a cada ano.'],
    caminho: ['Caminho do Desespero', 'A Sombra alcança quem a combate minando a autoconfiança: será que sua força bastará, ou você arrastará os inocentes consigo na derrota?'] },
  mensageiro: { nome: 'Mensageiro', pericias: ['Cortesia', 'Música', 'Viagem'],
    resumo: 'Para manter a esperança, os Povos Livres devem ser como um só. Você assumiu o dever de levar notícias e avisos a terras distantes.',
    traco: ['História dos Povos', 'Conhecimento dos costumes, crenças e tradições das comunidades dos Povos Livres, útil para lidar com estranhos.'],
    caminho: ['Loucura da Vagância', 'O mensageiro corre o risco de nunca encontrar um lugar pelo qual lutar: a estrada segue sempre, mas para onde?'] },
};


// Características Notáveis (24 comuns). Podem ser invocadas para ficar Inspirado em uma jogada de Perícia plausível.
const NOTAVEIS = {
  'Ágil': 'Você se move com velocidade e é rápido para agir.',
  'Alegre': 'Seu espírito não é facilmente desencorajado; você encontra luz até nas sombras mais escuras.',
  'Alto': 'Você se ergue acima da maioria do seu povo.',
  'Ansioso': 'Você se enche de emoção e impaciência quando um empreendimento desperta seu interesse.',
  'Astuto': 'Sua esperteza é aguçada e você está pronto para usá-la a seu favor.',
  'Belo': 'A maioria das pessoas o considera atraente, mesmo as de outros povos.',
  'Bravo': 'Você confia tanto em suas capacidades que não se intimida facilmente e enfrenta o perigo de frente.',
  'Cauteloso': 'Você está sempre atento ao entorno e observa o discurso e o comportamento de estranhos.',
  'Eloquente': 'Seu discurso e suas maneiras são naturalmente agradáveis e respeitosos; suas palavras raramente ofendem.',
  'Feroz': 'Quando provocado, ou quando necessário, você deixa seu lado selvagem aparecer.',
  'Fiel': 'Você é firmemente dedicado aos ideais ou pessoas que escolheu seguir; a lealdade inabalável o sustenta.',
  'Generoso': 'Você dá de mãos e coração abertos, atento às necessidades dos outros.',
  'Honrado': 'Você acredita em agir com justiça e fazer o que é moralmente certo.',
  'Inquisitivo': 'Sua curiosidade desperta fácil, muitas vezes por assuntos que não são da sua conta; por isso não se deixa enganar por aparências.',
  'Nobre': 'Seu porte digno desperta reverência e respeito em quem o vê.',
  'Olhar Aguçado': 'Sua visão supera a da maioria das pessoas.',
  'Orgulhoso': 'Você tem em alta estima os próprios feitos e realizações, ou os do seu povo.',
  'Paciente': 'Você demora a perder a paciência e lida com tolices, atrasos e dificuldades sem reclamar.',
  'Rústico': 'Seus modos são simples, até grosseiros para alguns, mas você sabe que nem tudo que reluz é ouro.',
  'Severo': 'Você tem natureza austera, que transparece no comportamento, na linguagem corporal e na fala.',
  'Sigiloso': 'Você não divide facilmente seus pensamentos e prefere esconder suas intenções, sobretudo de outros povos.',
  'Sincero': 'Você é honesto, e suas palavras e ações mostram suas intenções reais.',
  'Sutil': 'Você pode não ser mago, mas costuma atingir seus objetivos por meios astutos, se não desonestos.',
  'Teimoso': 'Você é firme de temperamento e crenças e costuma agir apenas por seu próprio julgamento.',
};
