import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { astGrep, deepMerge } from "../utils/utils";

const SLOT_NAMES = [
  "head",
  "neck",
  "chest",
  "hands",
  "finger",
  "waist",
  "legs",
  "feet",
  "trinket",
  "oneHanded",
  "twoHanded",
  "offHand",
  "tool",
] as const;
const slotNamesSchema = z.enum(SLOT_NAMES);

const rangeSchema = z.tuple([z.number(), z.number()]);
const implicitStatSchema = z
  .object({
    stat: z.string(),
    value: rangeSchema.optional(),
    valueMult: z.number().optional(),
    levelMult: z.number().optional(),
  })
  .strict();
const itemTypeSchema = z
  .object({
    sprite: rangeSchema.optional(),
    material: z.string().optional(),
    implicitStat: implicitStatSchema.or(z.array(implicitStatSchema)).optional(),

    attrRequire: z.string().or(z.array(z.string())).optional(),
    spritesheet: z.string().optional(),
    spellName: z.string().optional(),
    spellConfig: z.unknown().optional(),
    noDrop: z.boolean().optional(),
    range: z.number().optional(),
  })
  .partial()
  .strict();
const itemTypesSchema = z.record(
  slotNamesSchema,
  z.record(z.string(), itemTypeSchema)
);
type ItemTypes = z.infer<typeof itemTypesSchema>;

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
const srcItemTypes = async (): Promise<ItemTypes> => {
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
  const objEvaled = eval(lines.join("\n")) as unknown;

  return itemTypesSchema.parse(objEvaled);
};

/**
 * server/mods/class-necromancer/index.js
 *
 * Evals the beforeGetItemTypes handler
 */
const modNecromancerItemTypes = async (): Promise<ItemTypes> => {
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
  const evaled = eval(lines.join("\n")) as unknown;

  return itemTypesSchema.parse(evaled);
};

export default {
  key: "itemTypes",
  schema: itemTypesSchema,
  get: async () => {
    const itemTypes = await Promise.all([
      srcItemTypes(),
      modNecromancerItemTypes(),
    ]);
    const merged = deepMerge(...itemTypes);
    return merged;
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<ItemTypes>;
