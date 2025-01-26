import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { astGrep, deepMerge } from "../utils/utils";

const armorMaterialsSchema = z.object({
  plate: z.object({
    armorMult: z.number(),
  }),
  leather: z.object({
    armorMult: z.number(),
  }),
  cloth: z.object({
    armorMult: z.number(),
  }),
});
const getArmorMaterials = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/items/config/armorMaterials.js"
  );
  const obj = await astGrep(src, "module.exports = $X");
  return armorMaterialsSchema.parse(JSON5.parse(obj));
};

const slotArmorMultSchema = z.object({
  head: z.number(),
  chest: z.number(),
  hands: z.number(),
  legs: z.number(),
  feet: z.number(),
});
const getSlotArmorMult = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/items/config/slots.js"
  );
  const obj = await astGrep(
    src,
    "module.exports = { $$$, armorMult: $X, $$$ }"
  );
  return slotArmorMultSchema.parse(JSON5.parse(obj));
};

/**
 * server/items/config/types.js
 *
 * Evals the constant item types since they have some constant math
 */
const srcItemTypes = async () => {
  const slotArmorMult = await getSlotArmorMult();
  const armorMaterials = await getArmorMaterials();

  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/items/config/types.js"
  );

  const objRaw = await astGrep(src, "let types = $X");

  const lines = [
    `const slotArmorMult = ${JSON.stringify(slotArmorMult)};`,
    `const plateArmorMult = ${armorMaterials.plate.armorMult};`,
    `const leatherArmorMult = ${armorMaterials.leather.armorMult};`,
    `const clothArmorMult = ${armorMaterials.cloth.armorMult};`,
    `(` + objRaw + `)`,
  ];
  const objEvaled = eval(lines.join("\n"));

  return objEvaled;
};

/**
 * server/mods/class-necromancer/index.js
 *
 * Evals the beforeGetItemTypes handler
 */
const modNecromancerItemTypes = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/mods/class-necromancer/index.js"
  );

  const beforeGetItemTypes = await astGrep(
    src,
    "module.exports = { $$$, beforeGetItemTypes: $X, $$$ }"
  );

  const lines = [
    `const x = { oneHanded: {} };`,
    `const f = ${beforeGetItemTypes};`,
    `const fbound = f.bind({ folderName: 'server/mods/class-necromancer' });`,
    `fbound(x)`,
    `x`,
  ];
  const evaled = eval(lines.join("\n"));

  return evaled;
};

export default {
  key: "itemTypes.json",
  get: async () => {
    const itemTypes = await Promise.all([
      srcItemTypes(),
      modNecromancerItemTypes(),
    ]);

    const merged = deepMerge(...itemTypes);
    return JSON.stringify(merged, null, 4);
  },
} satisfies Output;
