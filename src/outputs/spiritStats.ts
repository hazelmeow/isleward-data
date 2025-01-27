import { StatSchema } from "isleward-types";
import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { astGrep } from "../utils/utils";

const spiritStatsSchema = z.record(
  z.enum(["owl", "lynx", "bear"]),
  z.object({
    values: z.object({
      hpMax: z.number(),
      hpPerLevel: z.number(),
    }),
    gainStats: z.record(StatSchema, z.number()),
  })
);
type SpiritStats = z.infer<typeof spiritStatsSchema>;

export default {
  key: "spiritStats",
  schema: spiritStatsSchema,
  get: async () => {
    const src = await getSourceFile(
      "repo:isleward-upstream/src/server/config/spirits.js"
    );
    const obj = await astGrep(src, "module.exports = { $$$, stats: $X, $$$ };");
    return spiritStatsSchema.parse(JSON5.parse(obj));
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<SpiritStats>;
