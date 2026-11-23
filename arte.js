// ============ Arte do livro: ilustrações de adversários e retratos padrão das culturas ============
// Extraídas do livro de regras. Quando um adversário não tem ilustração própria, usa a mais próxima.
// Retrato padrão: aparece enquanto o jogador não escolhe o próprio.
(() => {
  const A = (n, r) => ({ arte: `assets/adv/arte-${n}.webp`, rosto: `assets/adv/rosto-${r}.jpg` });
  const POR_ID = {
    // Homens do Sul e Rufiões: Salteador usa Cassetete (o brutamontes de tacape); os demais, o mais próximo
    'saqueador-sulista': A(14, 'sulista'), 'campeao-sulista': A(14, 'sulista'), 'salteador': A(14, 'sulista'),
    'chefe-rufiao': A(77, 'rufiao'), 'ladrao-de-estrada': A(77, 'rufiao'),
    // Orcs: Grandes Orcs de cimitarra e escudo; Guarda e Soldado com escudo redondo; Chefe e Búrzgul o capataz de chicote; Arqueiro Goblin o arqueiro do livro
    'chefe-grande-orc': A('196c', 'orc-grande'), 'guarda-costas-grande-orc': A('196c', 'orc-grande'),
    'guarda-orc': A('196b', 'orc-escudo'), 'soldado-orc': A('196b', 'orc-escudo'),
    'chefe-orc': A(154, 'orc-chicote'), 'burzgul': A(154, 'orc-chicote'),
    'arqueiro-goblin': A('196a', 'goblin-arqueiro'),
    'grande-troll-das-cavernas': A(333, 'troll-caverna'), 'troll-das-cavernas-furtivo': A(333, 'troll-caverna'),
    'troll-de-pedra-ladrao': A(434, 'troll-pedra'), 'troll-de-pedra-chefe': A(434, 'troll-pedra'),
    'aparicao-tumular': A(471, 'aparicao'), 'rei-das-aparicoes': A(471, 'aparicao'),
    'espectro-mortal': A(514, 'espectro'), 'habitantes-dos-pantanos': A(514, 'espectro'),
    'lobo-selvagem': A(618, 'lobo-menor'), 'lobo-chefe': A(573, 'lobo-grande'), 'cao-de-sauron': A(573, 'lobo-grande'), 'cinzas': A(618, 'lobo-menor'),
  };
  const POR_CATEGORIA = { 'Homens do Sul': A(14, 'sulista'), 'Rufiões': A(77, 'rufiao'), 'Orcs': A('196b', 'orc-escudo'), 'Trolls': A(434, 'troll-pedra'), 'Mortos-vivos': A(471, 'aparicao'), 'Criaturas': A(514, 'espectro'), 'Lobos e feras': A(618, 'lobo-menor') };
  const HEROIS = { anoes: 'anoes', bardeses: 'bardeses', elfos: 'elfos', hobbits: 'hobbits', bri: 'bri', patrulheiros: 'patrulheiros' };
  window.Arte = {
    // { arte, rosto } do adversário (por id da base; senão pela categoria), ou null
    adv: (baseId, categoria) => POR_ID[baseId] || POR_CATEGORIA[categoria] || null,
    heroi: (cultura) => (HEROIS[cultura] ? `assets/herois/${HEROIS[cultura]}.jpg` : ''),
  };
})();
