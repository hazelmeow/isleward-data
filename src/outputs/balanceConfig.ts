import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { astGrep } from "../utils/utils";

const balanceConfigSchema = z.object({
  maxLevel: z.number(),
  dmgMults: z.array(z.number()),
  hpMults: z.array(z.number()),
});
type BalanceConfig = z.infer<typeof balanceConfigSchema>;
const getBalanceConfig = async () => {
  const src = await getSourceFile(
    "repo:isleward-upstream/src/server/config/balance.js"
  );
  const obj = await astGrep(src, "const serverBalance = $X");
  return balanceConfigSchema.parse(JSON5.parse(obj));
};

export default {
  key: "balanceConfig",
  schema: balanceConfigSchema,
  get: async () => {
    return await getBalanceConfig();
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<BalanceConfig>;
