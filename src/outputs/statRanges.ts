import assert from "assert";
import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { assertReplaceAll, astGrep, sha256sum } from "../utils/utils";

const serverBalanceSchema = z.object({
  maxLevel: z.number(),
  dmgMults: z.array(z.number()),
  hpMults: z.array(z.number()),
});
const getServerBalance = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/config/balance.js"
  );
  const obj = await astGrep(src, "const serverBalance = $X");
  return serverBalanceSchema.parse(JSON5.parse(obj));
};

const itemStatBalanceEntrySchema = z.object({
  level: z
    .object({
      min: z.number(),
    })
    .optional(),
  slots: z.array(z.string()).optional(),
});
const itemStatBalanceSchema = z.record(
  z.string(),
  z.union([
    itemStatBalanceEntrySchema.extend({
      generator: z.string(),
    }),
    itemStatBalanceEntrySchema.extend({
      min: z.number(),
      max: z.number(),
    }),
  ])
);
const getItemStatBalance = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/items/generators/stats/itemStatBalance.js"
  );
  const obj = await astGrep(src, "const itemStatBalance = $X");
  const evaled = eval("(" + obj + ")");
  return itemStatBalanceSchema.parse(evaled);
};

const getStatRanges = async () => {
  const serverBalance = await getServerBalance();
  const itemStatBalance = await getItemStatBalance();
  const randomCode = await getRandomCode();
  const statGeneratorsCode = await getStatGeneratorsCode();

  const genStat = (
    stat: string,
    slot: string,
    level: number,
    perfection: number
  ) => {
    const statBlueprint = itemStatBalance[stat];
    assert(statBlueprint);

    let val;
    if ("generator" in statBlueprint) {
      const code = [
        randomCode,
        statGeneratorsCode,
        `const balance = ${JSON.stringify(serverBalance)};`,
        `const item = {slot: "${slot}"};`,
        `(generators["${statBlueprint.generator}"](item, ${level}, ${perfection}))`,
      ].join("\n");
      const evaled = eval(code);
      val = z.number().parse(evaled);
    } else {
      val =
        statBlueprint.min +
        (statBlueprint.max - statBlueprint.min) * perfection;
    }

    // always gets rounded and 0 mapped to 1
    val = Math.round(val);
    if (val === 0) {
      val = 1;
    }
    return val;
  };

  const statRanges = Object.fromEntries(
    Object.keys(itemStatBalance).map((stat) => {
      const range = new Array(serverBalance.maxLevel).fill(0).map((_, i) => {
        const level = i + 1;
        return [
          genStat(stat, "oneHanded", level, 0),
          genStat(stat, "oneHanded", level, 1),
        ];
      });
      const range2h = new Array(serverBalance.maxLevel).fill(0).map((_, i) => {
        const level = i + 1;
        return [
          genStat(stat, "twoHanded", level, 0),
          genStat(stat, "twoHanded", level, 1),
        ];
      });

      const statBlueprint = itemStatBalance[stat];
      assert(statBlueprint);

      return [
        stat,
        {
          range,
          range2h,
          level: statBlueprint.level,
          slots: statBlueprint.slots,
        },
      ];
    })
  );

  return statRanges;
};

/**
 * Gets the code for the stat generators
 */
const getStatGeneratorsCode = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/items/generators/stats/generators.js"
  );

  const modified = assertReplaceAll(src, "module.exports = generators;", "");

  return modified;
};

/**
 * Get the code for the global random functions
 *
 * Checks the hash of the file contents. If it changes this will need to be manually checked.
 * This is because the code touches the global scope, which is bad if we're going to eval it...
 */
const getRandomCode = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/misc/random.js"
  );
  assert(
    sha256sum(src) ===
      "3985f1718a7504b120a3c1cc20e6351b3836a4de47b2af056fe3915bcc268f3b",
    "hash changed"
  );

  let modified = assertReplaceAll(
    src,
    "global.random = new Random();",
    "const random = new Random();"
  );
  modified = assertReplaceAll(
    modified,
    "extend(random, {",
    "Object.assign(random, {"
  );

  return modified;
};

export default {
  key: "statRanges.json",
  get: async () => {
    const statRanges = await getStatRanges();
    return JSON.stringify(statRanges);
  },
} satisfies Output;
