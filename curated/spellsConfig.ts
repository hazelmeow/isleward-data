export const curatedSpellsConfig = {
  roll: {
    type: "roll",
    manaCost: 6,
    cdMax: 10,
    random: {
      i_maxDistance: [5, 9],
    },
  },
  "barbed chain": {
    type: "barbedChain",
    manaCost: 4,
    cdMax: 9,
    castTimeMax: 2,
    range: 9,
    isAttack: true,
    random: {
      i_damage: [4, 14],
      i_stunDuration: [2, 8],
    },
  },
  taunt: {
    type: "taunt",
    manaCost: 3,
    cdMax: 12,
    castTimeMax: 1,
    range: 9,
    random: {
      i_tauntDuration: [5, 20],
    },
  },
};
