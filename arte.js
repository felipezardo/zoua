// ============ Arte do livro: ilustrações de adversários e retratos padrão das culturas ============
// Extraídas do livro de regras. Quando um adversário não tem ilustração própria, usa a mais próxima.
// Retrato padrão: aparece enquanto o jogador não escolhe o próprio.
(() => {
  const A = (n, r) => ({ arte: `assets/adv/arte-${n}.webp`, rosto: `assets/adv/rosto-${r}.jpg` });
  const POR_ID = {
    'saqueador-sulista': A(14, 'sulista'), 'campeao-sulista': A(14, 'sulista'), 'chefe-rufiao': A(14, 'sulista'),
    'salteador': A(77, 'rufiao'), 'ladrao-de-estrada': A(77, 'rufiao'),
    'chefe-grande-orc': A(154, 'orc-chicote'), 'chefe-orc': A(154, 'orc-chicote'), 'arqueiro-goblin': A(154, 'orc-chicote'),
    'guarda-costas-grande-orc': A(196, 'orc-grande'), 'burzgul': A(196, 'orc-grande'), 'guarda-orc': A(196, 'orc-escudo'), 'soldado-orc': A(196, 'orc-escudo'),
    'grande-troll-das-cavernas': A(333, 'troll-caverna'), 'troll-das-cavernas-furtivo': A(333, 'troll-caverna'),
    'troll-de-pedra-ladrao': A(434, 'troll-pedra'), 'troll-de-pedra-chefe': A(434, 'troll-pedra'),
    'aparicao-tumular': A(471, 'aparicao'), 'rei-das-aparicoes': A(471, 'aparicao'),
    'espectro-mortal': A(514, 'espectro'), 'habitantes-dos-pantanos': A(514, 'espectro'),
    'lobo-selvagem': A(618, 'lobo-menor'), 'lobo-chefe': A(573, 'lobo-grande'), 'cao-de-sauron': A(573, 'lobo-grande'), 'cinzas': A(573, 'lobo-grande'),
  };
  const POR_CATEGORIA = { 'Homens do Sul': A(14, 'sulista'), 'Rufiões': A(77, 'rufiao'), 'Orcs': A(196, 'orc-grande'), 'Trolls': A(434, 'troll-pedra'), 'Mortos-vivos': A(471, 'aparicao'), 'Criaturas': A(514, 'espectro'), 'Lobos e feras': A(618, 'lobo-menor') };
  const HEROIS = { anoes: 'anoes', bardeses: 'bardeses', elfos: 'elfos', hobbits: 'hobbits', bri: 'bri', patrulheiros: 'patrulheiros' };
  window.Arte = {
    // { arte, rosto } do adversário (por id da base; senão pela categoria), ou null
    adv: (baseId, categoria) => POR_ID[baseId] || POR_CATEGORIA[categoria] || null,
    heroi: (cultura) => (HEROIS[cultura] ? `assets/herois/${HEROIS[cultura]}.jpg` : ''),
  };
})();
