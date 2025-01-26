import JSON5 from "json5";
import type { Output } from ".";
import { getSourceFile } from "../files";
import { astGrep, containsDuplicateKeys } from "../utils";
import { curatedSpellsConfig } from "../../curated/spellsConfig";

const serverSpellsConfig = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/config/spellsConfig.js"
  );

  const val = await astGrep(src, "let spells = $X");
  return JSON5.parse(val);
};

const modNecromancerSpellsConfig = async () => {
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
  key: "spellsConfig.json",
  get: async () => {
    const configs = await Promise.all([
      serverSpellsConfig(),
      modNecromancerSpellsConfig(),
      curatedSpellsConfig,
    ]);

    if (containsDuplicateKeys(configs)) throw new Error("duplicate keys");

    const merged = Object.assign({}, ...configs);
    return JSON.stringify(merged, null, 4);
  },
} satisfies Output;
