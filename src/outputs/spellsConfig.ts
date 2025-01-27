import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { curatedSpellsConfig } from "../../curated/spellsConfig";
import { getSourceFile } from "../utils/files";
import { astGrep, containsDuplicateKeys } from "../utils/utils";

const spellsConfigSchema = z.record(
  z.string(),
  z
    .object({
      auto: z.boolean(),
      cdMax: z.number(),
      castTimeMax: z.number(),
      useWeaponRange: z.boolean(),
      random: z.record(z.string(), z.tuple([z.number(), z.number()])),
      manaCost: z.number(),
      range: z.number(),
      statType: z.string().or(z.array(z.string())),
      element: z.string(),
      radius: z.number(),
      threatMult: z.number(),
      needLos: z.boolean(),
      isAttack: z.boolean(),
      negativeStats: z.array(z.string()),
      manaReserve: z.object({ percentage: z.number() }),
      auraRange: z.number(),
      effect: z.string(),
    })
    .partial()
    .strict()
);
type SpellsConfig = z.infer<typeof spellsConfigSchema>;

const serverSpellsConfig = async (): Promise<SpellsConfig> => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/config/spellsConfig.js"
  );

  const val = await astGrep(src, "let spells = $X");
  return spellsConfigSchema.parse(JSON5.parse(val));
};

const modNecromancerSpellsConfig = async (): Promise<SpellsConfig> => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/mods/class-necromancer/index.js"
  );

  const grep = async (name: string) => {
    const val = await astGrep(src, `spells['${name}'] = $X`);
    return {
      [name]: JSON5.parse(val),
    };
  };

  return {
    ...(await grep("harvest life")),
    ...(await grep("summon skeleton")),
    ...(await grep("blood barrier")),
  };
};

export default {
  key: "spellsConfig",
  schema: spellsConfigSchema,
  get: async () => {
    const configs = await Promise.all([
      serverSpellsConfig(),
      modNecromancerSpellsConfig(),
      curatedSpellsConfig,
    ]);

    if (containsDuplicateKeys(configs)) throw new Error("duplicate keys");

    const merged = Object.assign({}, ...configs);
    return merged;
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<SpellsConfig>;
