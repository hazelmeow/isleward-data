import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { astGrep } from "../utils/utils";

const statScalesSchema = z.object({
  vitToHp: z.number(),
  strToArmor: z.number(),
  intToMana: z.number(),
  dexToDodge: z.number(),
});
type StatScales = z.infer<typeof statScalesSchema>;

export default {
  key: "statScales",
  schema: statScalesSchema,
  get: async () => {
    const src = await getSourceFile(
      "repo:isleward-upstream/src/server/components/stats.js"
    );
    const obj = await astGrep(
      src,
      "module.exports = { $$$, statScales: $X, $$$ };"
    );
    return statScalesSchema.parse(eval("(" + obj + ")"));
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<StatScales>;
