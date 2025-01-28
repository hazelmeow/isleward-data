import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { curatedSpellsConfig } from "../../curated/spellsConfig";
import { getSourceFile } from "../utils/files";
import {
  astGrep,
  astGrepNullifyFunctions,
  containsDuplicateKeys,
} from "../utils/utils";
import { Lang, parseAsync } from "@ast-grep/napi";

export const spellConfigSchema = z
  .object({
    // required
    type: z.string(),

    // required (always set in spellTemplate)
    cdMax: z.number(),
    manaCost: z.number(),
    threatMult: z.number(),
    castTimeMax: z.number(),

    random: z.record(z.string(), z.tuple([z.number(), z.number()])),

    spellType: z.enum(["heal", "buff", "aura"]).optional(),

    element: z.string().optional(),
    statType: z.string().or(z.array(z.string())).optional(),

    range: z.number().optional(),
    radius: z.number().optional(),

    auto: z.boolean().optional(),
    useWeaponRange: z.boolean().optional(),
    isAttack: z.boolean().optional(),
    needLos: z.boolean().optional(),
    targetGround: z.boolean().optional(),
    targetPlayerPos: z.boolean().optional(),
    targetFriendly: z.boolean().optional(),

    negativeStats: z.array(z.string()).optional(),

    manaReserve: z.object({ percentage: z.number() }).optional(),
    auraRange: z.number().optional(),

    effect: z.string().optional(),

    // spell info
    name: z.string().optional(),
    description: z.string().optional(),
    icon: z.tuple([z.number(), z.number()]).optional(),
    spritesheet: z.string().optional(),
    animation: z.string().optional(),
    row: z.number().nullish(),
    col: z.number().nullish(),
    frames: z.number().optional(),
    speed: z.number().optional(),
    particles: z.unknown(),
  })
  .strict();
export type SpellConfig = z.infer<typeof spellConfigSchema>;

export const spellsSchema = z.record(z.string(), spellConfigSchema);
export type Spells = z.infer<typeof spellsSchema>;

export const partialSpellConfigSchema = spellConfigSchema.partial();
export type PartialSpellConfig = z.infer<typeof partialSpellConfigSchema>;

export const configMapSchema = z.record(z.string(), partialSpellConfigSchema);
export type ConfigMap = z.infer<typeof configMapSchema>;

// base template for all spells
const spellTemplateSchema = z.object({
  cdMax: z.number(),
  manaCost: z.number(),
  threatMult: z.number(),
  castTimeMax: z.number(),
});
const getSpellTemplate = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/config/spells/spellTemplate.js"
  );
  const val = await astGrepNullifyFunctions(src, "module.exports = $X");
  const obj = spellTemplateSchema.parse(JSON5.parse(val));
  return obj;
};

// template for spell type
const capitalize = (s: string) => (s[0]?.toUpperCase() ?? "") + s.slice(1);
const getSpellTypeTemplate = async (
  spellType: string
): Promise<PartialSpellConfig> => {
  let path = `src/server/config/spells`;
  if (
    spellType === "harvestLife" ||
    spellType === "summonSkeleton" ||
    spellType === "bloodBarrier"
  ) {
    path = "src/server/mods/class-necromancer/spells";
  }

  let src;
  try {
    src = await getSourceFile(
      `repo:isleward-upstream/${path}/spell${capitalize(spellType)}.js`
    );
  } catch (e) {
    console.warn(`couldn't find spell type template for "${spellType}"`);
    return {
      type: spellType,
    };
  }

  // HACK: can't parse this without eval, but we don't really care
  src = src.replaceAll("particles: particles,", "");

  const val = await astGrepNullifyFunctions(src, "module.exports = $X");
  const obj = partialSpellConfigSchema.strip().parse(JSON5.parse(val));
  return obj;
};

// config/spellsConfig.js
export const getSpellsConfig = async (): Promise<ConfigMap> => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/config/spellsConfig.js"
  );
  const val = await astGrep(src, "let spells = $X");
  return configMapSchema.parse(JSON5.parse(val));
};
// config/spells.js
const getSpellsInfo = async (): Promise<PartialSpellConfig[]> => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/config/spells.js"
  );
  const val = await astGrep(src, "let spells = $X");
  return z.array(partialSpellConfigSchema).parse(JSON5.parse(val));
};

// class-necromancer
const getModNecromancer = async (): Promise<
  [ConfigMap, PartialSpellConfig[]]
> => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/mods/class-necromancer/index.js"
  );

  const grepConfig = async (name: string) => {
    const val = await astGrep(src, `spells['${name}'] = $X`);
    return partialSpellConfigSchema.parse(JSON5.parse(val));
  };

  const configMap = {
    "harvest life": await grepConfig("harvest life"),
    "summon skeleton": await grepConfig("summon skeleton"),
    "blood barrier": await grepConfig("blood barrier"),
  };

  const ast = await parseAsync(Lang.JavaScript, src);
  const root = ast.root();
  const nodes = root.findAll("spells.push($X)");
  const vals = nodes.map((node) => {
    const match = node.getMatch("X");
    if (!match) throw new Error("failed to match");
    return match.text();
  });
  const infos = vals.map((val) => {
    const clean = val
      .replace("${this.folderName}", "server/mods/class-necromancer")
      .replaceAll("`", "'");
    return partialSpellConfigSchema.parse(JSON5.parse(clean));
  });

  return [configMap, infos];
};

const getCuratedConfig = async (): Promise<ConfigMap> => {
  return configMapSchema.parse(curatedSpellsConfig);
};

export default {
  key: "spellsExt",
  schema: spellsSchema,
  get: async () => {
    // base template for all spells
    const spellTemplate = await getSpellTemplate();

    // class-necromancer
    const [modNecroConfig, modNecroInfos] = await getModNecromancer();

    // spells.js
    const spellsInfo: PartialSpellConfig[] = [
      await getSpellsInfo(),
      modNecroInfos,
    ].flat();

    // use spellsConfig.js, necro spell config, and curated config as set of spells to find
    const configMaps: ConfigMap[] = [
      await getSpellsConfig(),
      await getCuratedConfig(),
      modNecroConfig,
    ];
    if (containsDuplicateKeys(configMaps)) throw new Error("duplicate keys");

    // flatten
    const configs = configMaps
      .map((configMap) => Object.entries(configMap))
      .flat();

    // extend each base config on to template and type template
    const extendedSpells = await Promise.all(
      configs.map(async ([key, config]) => {
        const spellInfo =
          spellsInfo.find((i) => i.name?.toLowerCase() === key.toLowerCase()) ??
          {};
        const type = config.type ?? spellInfo.type;
        if (!type) throw new Error(`spell missing type: ${key}`);

        const typeTemplate = type ? await getSpellTypeTemplate(type) : {};

        const extended = Object.assign(
          {
            type,
            random: {},
          },
          spellTemplate,
          typeTemplate,
          spellInfo,
          config
        ) satisfies SpellConfig;

        return { key, extended };
      })
    );

    return Object.fromEntries(
      extendedSpells.map(({ key, extended }) => [key, extended])
    );
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<Spells>;
