// Bestiário do livro básico (capítulo "O Historiador"). Números conferidos com as fichas; habilidades em resumo.
// dados = Dados de Sucesso do ataque; dano/ferimento = Dano/Ferimento; bloqueio = modificador somado ao NA do herói.
const ADVERSARIOS = [
 {
  "id": "saqueador-sulista",
  "nome": "Saqueador Sulista",
  "categoria": "Homens do Sul",
  "tracos": [
   "Sagaz",
   "Endurecido"
  ],
  "nivel": 4,
  "resistencia": 16,
  "poder": 1,
  "tipo": "determinacao",
  "pontos": 4,
  "bloqueio": 1,
  "armadura": 2,
  "proficiencias": [
   {
    "nome": "Machado",
    "dados": 3,
    "dano": 5,
    "ferimento": 18,
    "especial": []
   },
   {
    "nome": "Lança Curta",
    "dados": 2,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Povo Feroz",
    "texto": "Gaste 1 de Determinação para ganhar (1d) e tornar o ataque Favorecido."
   }
  ]
 },
 {
  "id": "campeao-sulista",
  "nome": "Campeão Sulista",
  "categoria": "Homens do Sul",
  "tracos": [
   "Cruel",
   "Resistente"
  ],
  "nivel": 5,
  "resistencia": 20,
  "poder": 1,
  "tipo": "determinacao",
  "pontos": 5,
  "bloqueio": 2,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Lança",
    "dados": 3,
    "dano": 4,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Machado de Haste Longa",
    "dados": 3,
    "dano": 6,
    "ferimento": 18,
    "especial": [
     "Quebrar Escudo"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Povo Feroz",
    "texto": "Gaste 1 de Determinação para ganhar (1d) e tornar o ataque Favorecido."
   }
  ]
 },
 {
  "id": "salteador",
  "nome": "Salteador",
  "categoria": "Rufiões",
  "tracos": [
   "Ligeiro",
   "Cauteloso"
  ],
  "nivel": 2,
  "resistencia": 8,
  "poder": 1,
  "tipo": "determinacao",
  "pontos": 2,
  "bloqueio": 0,
  "armadura": 1,
  "proficiencias": [
   {
    "nome": "Cassetete",
    "dados": 2,
    "dano": 3,
    "ferimento": 12,
    "especial": []
   },
   {
    "nome": "Arco",
    "dados": 2,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Medroso",
    "texto": "Ao ser afetado por Intimidar Inimigo, perde também 1 de Determinação."
   }
  ]
 },
 {
  "id": "chefe-rufiao",
  "nome": "Chefe Rufião",
  "categoria": "Rufiões",
  "tracos": [
   "Implacável",
   "Sigiloso"
  ],
  "nivel": 3,
  "resistencia": 12,
  "poder": 1,
  "tipo": "determinacao",
  "pontos": 3,
  "bloqueio": 1,
  "armadura": 2,
  "proficiencias": [
   {
    "nome": "Espada Curta",
    "dados": 3,
    "dano": 3,
    "ferimento": 16,
    "especial": []
   },
   {
    "nome": "Arco",
    "dados": 2,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Grito de Triunfo",
    "texto": "Gaste 1 de Determinação para restaurar 1 de Determinação em todos os outros Rufiões na luta."
   }
  ]
 },
 {
  "id": "ladrao-de-estrada",
  "nome": "Ladrão de Estrada",
  "categoria": "Rufiões",
  "tracos": [
   "Ágil",
   "Vingativo"
  ],
  "nivel": 4,
  "resistencia": 16,
  "poder": 1,
  "tipo": "determinacao",
  "pontos": 4,
  "bloqueio": 0,
  "armadura": 2,
  "proficiencias": [
   {
    "nome": "Lança",
    "dados": 3,
    "dano": 4,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Arco",
    "dados": 2,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Velocidade de Serpente",
    "texto": "Ao ser alvo de um ataque, gaste 1 de Determinação para tornar a jogada de ataque Desfavorecida."
   }
  ]
 },
 {
  "id": "chefe-grande-orc",
  "nome": "Chefe Grande Orc",
  "categoria": "Orcs",
  "tracos": [
   "Bravo",
   "Astuto"
  ],
  "nivel": 7,
  "resistencia": 48,
  "poder": 2,
  "tipo": "odio",
  "pontos": 7,
  "bloqueio": 3,
  "armadura": 4,
  "proficiencias": [
   {
    "nome": "Cimitarra Pesada",
    "dados": 3,
    "dano": 5,
    "ferimento": 18,
    "especial": [
     "Quebrar Escudo"
    ]
   },
   {
    "nome": "Lança de Ponta Larga",
    "dados": 3,
    "dano": 5,
    "ferimento": 16,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Força Horrível",
    "texto": "Após acertar um Golpe Perfurante em combate corpo a corpo, gaste 1 de Ódio para tornar o teste de Proteção do alvo Desfavorecido."
   },
   {
    "nome": "Velocidade de Serpente",
    "texto": "Ao ser alvo de um ataque, gaste 1 de Ódio para tornar a jogada de ataque Desfavorecida."
   },
   {
    "nome": "Grito de Triunfo",
    "texto": "Gaste 1 de Ódio para restaurar 1 de Ódio em todos os outros orcs na luta."
   }
  ]
 },
 {
  "id": "guarda-costas-grande-orc",
  "nome": "Guarda-Costas Grande Orc",
  "categoria": "Orcs",
  "tracos": [
   "Feroz",
   "Cauteloso"
  ],
  "nivel": 6,
  "resistencia": 24,
  "poder": 2,
  "tipo": "odio",
  "pontos": 6,
  "bloqueio": 2,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Machado Orc",
    "dados": 3,
    "dano": 5,
    "ferimento": 18,
    "especial": [
     "Quebrar Escudo"
    ]
   },
   {
    "nome": "Lança de Ponta Larga",
    "dados": 3,
    "dano": 5,
    "ferimento": 16,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Resistência Hedionda",
    "texto": "Imune a ataques desarmados. Se um ataque o levaria a 0 de Resistência, vira Golpe Perfurante e, se sobreviver, a Resistência cai para metade do máximo."
   }
  ]
 },
 {
  "id": "guarda-orc",
  "nome": "Guarda Orc",
  "categoria": "Orcs",
  "tracos": [
   "Forte",
   "Vigilante"
  ],
  "nivel": 4,
  "resistencia": 16,
  "poder": 1,
  "tipo": "odio",
  "pontos": 4,
  "bloqueio": 2,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Cimitarra",
    "dados": 3,
    "dano": 3,
    "ferimento": 16,
    "especial": []
   },
   {
    "nome": "Lança",
    "dados": 3,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": []
 },
 {
  "id": "soldado-orc",
  "nome": "Soldado Orc",
  "categoria": "Orcs",
  "tracos": [
   "Rebelde",
   "Vingativo"
  ],
  "nivel": 3,
  "resistencia": 12,
  "poder": 1,
  "tipo": "odio",
  "pontos": 3,
  "bloqueio": 1,
  "armadura": 2,
  "proficiencias": [
   {
    "nome": "Cimitarra",
    "dados": 3,
    "dano": 3,
    "ferimento": 16,
    "especial": []
   },
   {
    "nome": "Lança",
    "dados": 2,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Covarde",
    "texto": "Ao ser afetado por Intimidar Inimigo, perde também 1 de Ódio."
   }
  ]
 },
 {
  "id": "arqueiro-goblin",
  "nome": "Arqueiro Goblin",
  "categoria": "Orcs",
  "tracos": [
   "Astuto",
   "Olhar Aguçado"
  ],
  "nivel": 2,
  "resistencia": 8,
  "poder": 1,
  "tipo": "odio",
  "pontos": 2,
  "bloqueio": 0,
  "armadura": 1,
  "proficiencias": [
   {
    "nome": "Arco de Chifre",
    "dados": 3,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Faca Serrilhada",
    "dados": 2,
    "dano": 2,
    "ferimento": 14,
    "especial": []
   }
  ],
  "habilidades": [
   {
    "nome": "Medroso",
    "texto": "Ao ser afetado por Intimidar Inimigo, perde também 1 de Ódio."
   },
   {
    "nome": "Veneno de Orc",
    "texto": "Se um ataque causar Ferimento, o alvo também fica envenenado (veja o livro, p. 134)."
   }
  ]
 },
 {
  "id": "chefe-orc",
  "nome": "Chefe Orc",
  "categoria": "Orcs",
  "tracos": [
   "Cruel",
   "Endurecido"
  ],
  "nivel": 5,
  "resistencia": 20,
  "poder": 1,
  "tipo": "odio",
  "pontos": 5,
  "bloqueio": 3,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Cimitarra",
    "dados": 3,
    "dano": 3,
    "ferimento": 16,
    "especial": []
   },
   {
    "nome": "Lança",
    "dados": 3,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Grande Salto",
    "texto": "Gaste 1 de Ódio para atacar qualquer herói, em qualquer posição, inclusive na Retaguarda."
   },
   {
    "nome": "Velocidade de Serpente",
    "texto": "Ao ser alvo de um ataque, gaste 1 de Ódio para tornar a jogada de ataque Desfavorecida."
   },
   {
    "nome": "Grito de Triunfo",
    "texto": "Gaste 1 de Ódio para restaurar 1 de Ódio em todos os outros Orcs na luta."
   }
  ]
 },
 {
  "id": "grande-troll-das-cavernas",
  "nome": "Grande Troll das Cavernas",
  "categoria": "Trolls",
  "tracos": [
   "Bruto",
   "Perverso"
  ],
  "nivel": 10,
  "resistencia": 80,
  "poder": 2,
  "tipo": "odio",
  "pontos": 10,
  "bloqueio": 0,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Esmagamento",
    "dados": 3,
    "dano": 6,
    "ferimento": 12,
    "especial": [
     "Agarrar"
    ]
   },
   {
    "nome": "Mordida",
    "dados": 2,
    "dano": 6,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Causar Medo",
    "texto": "Gaste 1 de Ódio: todos os heróis à vista ganham 2 de Sombra (Pavor). Quem falhar no teste fica assustado e não pode gastar Esperança até o fim da luta."
   },
   {
    "nome": "Pele Grossa",
    "texto": "Gaste 1 de Ódio para ganhar (2d) numa jogada de Proteção."
   }
  ]
 },
 {
  "id": "troll-das-cavernas-furtivo",
  "nome": "Troll das Cavernas: Furtivo",
  "categoria": "Trolls",
  "tracos": [
   "Furtivo",
   "Cauteloso"
  ],
  "nivel": 6,
  "resistencia": 50,
  "poder": 2,
  "tipo": "odio",
  "pontos": 6,
  "bloqueio": 0,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Tacape",
    "dados": 3,
    "dano": 6,
    "ferimento": 16,
    "especial": [
     "Quebrar Escudo"
    ]
   },
   {
    "nome": "Mordida",
    "dados": 2,
    "dano": 6,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Habitante das Trevas",
    "texto": "Todos os ataques são Favorecidos enquanto no escuro."
   },
   {
    "nome": "Medo de Fogo",
    "texto": "Perde 1 de Ódio no início de cada rodada em combate corpo a corpo com quem empunha tocha ou item em chamas."
   },
   {
    "nome": "Pele Grossa",
    "texto": "Gaste 1 de Ódio para ganhar (2d) numa jogada de Proteção."
   }
  ]
 },
 {
  "id": "troll-de-pedra-ladrao",
  "nome": "Troll de Pedra: Ladrão",
  "categoria": "Trolls",
  "tracos": [
   "Faminto",
   "Irritável"
  ],
  "nivel": 8,
  "resistencia": 60,
  "poder": 2,
  "tipo": "odio",
  "pontos": 8,
  "bloqueio": 0,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Tacape",
    "dados": 3,
    "dano": 6,
    "ferimento": 16,
    "especial": [
     "Quebrar Escudo"
    ]
   },
   {
    "nome": "Esmagamento",
    "dados": 2,
    "dano": 6,
    "ferimento": 12,
    "especial": [
     "Agarrar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Asco (Anões)",
    "texto": "Contra Anões, todas as jogadas da criatura são Favorecidas."
   },
   {
    "nome": "Força Horrível",
    "texto": "Após acertar um Golpe Perfurante, gaste 1 de Ódio para tornar o teste de Proteção do alvo Desfavorecido."
   }
  ]
 },
 {
  "id": "troll-de-pedra-chefe",
  "nome": "Troll de Pedra: Chefe",
  "categoria": "Trolls",
  "tracos": [
   "Cruel",
   "Suspeito"
  ],
  "nivel": 9,
  "resistencia": 70,
  "poder": 2,
  "tipo": "odio",
  "pontos": 9,
  "bloqueio": 0,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Tacape",
    "dados": 3,
    "dano": 6,
    "ferimento": 16,
    "especial": [
     "Quebrar Escudo"
    ]
   },
   {
    "nome": "Esmagamento",
    "dados": 2,
    "dano": 6,
    "ferimento": 12,
    "especial": [
     "Agarrar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Asco (Anões)",
    "texto": "Contra Anões, todas as jogadas da criatura são Favorecidas."
   },
   {
    "nome": "Força Horrível",
    "texto": "Após acertar um Golpe Perfurante, gaste 1 de Ódio para tornar o teste de Proteção do alvo Desfavorecido."
   },
   {
    "nome": "Grito de Triunfo",
    "texto": "Gaste 1 de Ódio para restaurar 1 de Ódio em todos os outros Trolls na luta."
   }
  ]
 },
 {
  "id": "aparicao-tumular",
  "nome": "Aparição Tumular",
  "categoria": "Mortos-vivos",
  "tracos": [
   "Astuto",
   "Vingativo"
  ],
  "nivel": 6,
  "resistencia": 24,
  "poder": 1,
  "tipo": "odio",
  "pontos": 6,
  "bloqueio": 0,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Espada Antiga",
    "dados": 3,
    "dano": 5,
    "ferimento": 16,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Toque Gélido",
    "dados": 2,
    "dano": 6,
    "ferimento": 12,
    "especial": [
     "Agarrar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Habitante das Trevas",
    "texto": "Todos os ataques são Favorecidos enquanto no escuro."
   },
   {
    "nome": "Feitiços Terríveis",
    "texto": "Gaste 1 de Ódio: um herói ganha 3 de Sombra (Feitiçaria). Quem falhar no teste, ou já estiver Arrasado, fica inconsciente (acorda com uma jogada de MÚSICA ou após 1 hora)."
   },
   {
    "nome": "Aversão à Luz do Sol",
    "texto": "Perde 1 de Ódio no início de cada rodada exposta à luz plena do sol."
   }
  ]
 },
 {
  "id": "espectro-mortal",
  "nome": "Espectro Mortal",
  "categoria": "Mortos-vivos",
  "tracos": [
   "Ágil",
   "Cauteloso"
  ],
  "nivel": 4,
  "resistencia": 16,
  "poder": 1,
  "tipo": "odio",
  "pontos": 4,
  "bloqueio": 1,
  "armadura": 2,
  "proficiencias": [
   {
    "nome": "Lâmina Enferrujada",
    "dados": 3,
    "dano": 4,
    "ferimento": 16,
    "especial": []
   },
   {
    "nome": "Lança Cruel",
    "dados": 2,
    "dano": 4,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Habitante das Trevas",
    "texto": "Todos os ataques são Favorecidos enquanto no escuro."
   },
   {
    "nome": "Medo de Fogo",
    "texto": "Perde 1 de Ódio no início de cada rodada em combate corpo a corpo com quem empunha tocha ou item em chamas."
   }
  ]
 },
 {
  "id": "habitantes-dos-pantanos",
  "nome": "Habitantes dos Pântanos",
  "categoria": "Criaturas",
  "tracos": [
   "Feroz",
   "Furtivo"
  ],
  "nivel": 3,
  "resistencia": 12,
  "poder": 1,
  "tipo": "odio",
  "pontos": 3,
  "bloqueio": 0,
  "armadura": 1,
  "proficiencias": [
   {
    "nome": "Mordida",
    "dados": 3,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Garras",
    "dados": 2,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Agarrar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Medo de Fogo",
    "texto": "Perde 1 de Ódio no início de cada rodada em combate corpo a corpo com quem empunha tocha ou item em chamas."
   },
   {
    "nome": "Aversão à Luz do Sol",
    "texto": "Perde 1 de Ódio no início de cada rodada exposta à luz plena do sol."
   }
  ]
 },
 {
  "id": "lobo-selvagem",
  "nome": "Lobo Selvagem",
  "categoria": "Lobos e feras",
  "tracos": [
   "Olhar Aguçado",
   "Soturno"
  ],
  "nivel": 3,
  "resistencia": 12,
  "poder": 1,
  "tipo": "odio",
  "pontos": 3,
  "bloqueio": 0,
  "armadura": 1,
  "proficiencias": [
   {
    "nome": "Presas",
    "dados": 3,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Medo de Fogo",
    "texto": "Perde 1 de Ódio no início de cada rodada em combate corpo a corpo com quem empunha tocha ou item em chamas."
   },
   {
    "nome": "Velocidade de Serpente",
    "texto": "Ao ser alvo de um ataque, gaste 1 de Ódio para tornar a jogada de ataque Desfavorecida."
   }
  ]
 },
 {
  "id": "lobo-chefe",
  "nome": "Lobo Chefe",
  "categoria": "Lobos e feras",
  "tracos": [
   "Rápido",
   "Violento"
  ],
  "nivel": 4,
  "resistencia": 16,
  "poder": 1,
  "tipo": "odio",
  "pontos": 4,
  "bloqueio": 0,
  "armadura": 1,
  "proficiencias": [
   {
    "nome": "Presas",
    "dados": 3,
    "dano": 4,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Garras",
    "dados": 2,
    "dano": 4,
    "ferimento": 14,
    "especial": [
     "Agarrar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Medo de Fogo",
    "texto": "Perde 1 de Ódio no início de cada rodada em combate corpo a corpo com quem empunha tocha ou item em chamas."
   },
   {
    "nome": "Velocidade de Serpente",
    "texto": "Ao ser alvo de um ataque, gaste 1 de Ódio para tornar a jogada de ataque Desfavorecida."
   },
   {
    "nome": "Uivo de Triunfo",
    "texto": "Gaste 1 de Ódio para restaurar 1 de Ódio em todos os outros wargs na luta."
   }
  ]
 },
 {
  "id": "cao-de-sauron",
  "nome": "Cão de Sauron",
  "categoria": "Lobos e feras",
  "tracos": [
   "Astuto",
   "Feroz"
  ],
  "nivel": 5,
  "resistencia": 20,
  "poder": 2,
  "tipo": "odio",
  "pontos": 5,
  "bloqueio": 1,
  "armadura": 2,
  "proficiencias": [
   {
    "nome": "Presas",
    "dados": 3,
    "dano": 5,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Garras",
    "dados": 3,
    "dano": 5,
    "ferimento": 14,
    "especial": [
     "Agarrar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Ferimento Letal",
    "texto": "Heróis Feridos rolam o Dado de Façanha Desfavorecido para a gravidade do ferimento."
   },
   {
    "nome": "Resistência Hedionda",
    "texto": "Imune a ataques desarmados. Se um ataque o levaria a 0 de Resistência, vira Golpe Perfurante e, se sobreviver, a Resistência cai para metade do máximo."
   },
   {
    "nome": "Causar Medo",
    "texto": "Gaste 1 de Ódio: todos os heróis à vista ganham 3 de Sombra (Pavor). Quem falhar no teste fica assustado e não pode gastar Esperança até o fim da luta."
   }
  ]
 },
 {
  "id": "rei-das-aparicoes",
  "nome": "Rei das Aparições",
  "categoria": "Mortos-vivos",
  "tracos": [
   "Astuto",
   "Feroz",
   "Vingativo"
  ],
  "nivel": 9,
  "resistencia": 45,
  "poder": 2,
  "tipo": "odio",
  "pontos": 9,
  "bloqueio": 0,
  "armadura": 4,
  "proficiencias": [
   {
    "nome": "Espada Antiga",
    "dados": 3,
    "dano": 5,
    "ferimento": 18,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Toque Gélido",
    "dados": 3,
    "dano": 6,
    "ferimento": 12,
    "especial": [
     "Quebrar Escudo"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Mais Escuro que a Escuridão",
    "texto": "Gaste 1 de Ódio para invocar escuridão sobrenatural: heróis em corpo a corpo perdem (2d) no 1º ataque contra a criatura, e ataques à distância perdem (2d) durante toda a luta."
   },
   {
    "nome": "Habitante das Trevas",
    "texto": "Todos os ataques são Favorecidos enquanto no escuro."
   },
   {
    "nome": "Feitiços Terríveis",
    "texto": "Gaste 1 de Ódio: um herói ganha 3 de Sombra (Feitiçaria). Quem falhar no teste, ou já estiver Arrasado, fica inconsciente (acorda com uma jogada de MÚSICA ou após 1 hora)."
   },
   {
    "nome": "Aversão à Luz do Sol",
    "texto": "Perde 1 de Ódio no início de cada rodada exposta à luz plena do sol."
   }
  ]
 },
 {
  "id": "burzgul",
  "nome": "Búrzgul",
  "categoria": "Orcs",
  "tracos": [
   "Cruel",
   "Olhar Aguçado"
  ],
  "nivel": 5,
  "resistencia": 22,
  "poder": 1,
  "tipo": "odio",
  "pontos": 5,
  "bloqueio": 3,
  "armadura": 3,
  "proficiencias": [
   {
    "nome": "Cimitarra",
    "dados": 3,
    "dano": 3,
    "ferimento": 16,
    "especial": [
     "Quebrar Escudo"
    ]
   },
   {
    "nome": "Lança",
    "dados": 2,
    "dano": 3,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   }
  ],
  "habilidades": [
   {
    "nome": "Veneno de Orc",
    "texto": "Se um ataque causar Ferimento, o alvo também fica envenenado (veja o livro, p. 134)."
   },
   {
    "nome": "Velocidade de Serpente",
    "texto": "Ao ser alvo de um ataque, gaste 1 de Ódio para tornar a jogada de ataque Desfavorecida."
   },
   {
    "nome": "Grito de Triunfo",
    "texto": "Gaste 1 de Ódio para restaurar 1 de Ódio em todos os outros orcs na luta."
   }
  ]
 },
 {
  "id": "cinzas",
  "nome": "Cinzas",
  "categoria": "Lobos e feras",
  "tracos": [
   "Astuto",
   "Ágil"
  ],
  "nivel": 4,
  "resistencia": 20,
  "poder": 1,
  "tipo": "odio",
  "pontos": 4,
  "bloqueio": 2,
  "armadura": 1,
  "proficiencias": [
   {
    "nome": "Presas",
    "dados": 3,
    "dano": 4,
    "ferimento": 14,
    "especial": [
     "Perfurar"
    ]
   },
   {
    "nome": "Garras",
    "dados": 2,
    "dano": 5,
    "ferimento": 14,
    "especial": []
   }
  ],
  "habilidades": [
   {
    "nome": "Medo de Fogo",
    "texto": "Perde 1 de Ódio no início de cada rodada em combate corpo a corpo com quem empunha tocha ou item em chamas."
   },
   {
    "nome": "Ataque Selvagem",
    "texto": "Gaste 1 de Ódio após um ataque de Presas para fazer logo um ataque de Garras no mesmo alvo."
   }
  ]
 }
];
