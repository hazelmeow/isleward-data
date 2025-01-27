import { StatSchema } from "isleward-types";
import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { astGrep } from "../utils/utils";

const baseStatsSchema = z.record(StatSchema, z.number());
type BaseStats = z.infer<typeof baseStatsSchema>;

export default {
  key: "baseStats",
  schema: baseStatsSchema,
  get: async () => {
    const src = await getSourceFile(
      "repo:isleward-upstream/src/server/components/stats.js"
    );
    const obj = await astGrep(src, "let baseStats = $X;");
    return baseStatsSchema.parse(JSON5.parse(obj));
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<BaseStats>;
