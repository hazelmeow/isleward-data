import JSON5 from "json5";
import { z } from "zod";
import type { Output } from ".";
import { getSourceFile } from "../utils/files";
import { astGrep } from "../utils/utils";
import { StatSchema } from "isleward-types";

const nodeSchema = z
  .object({
    id: z.number(),
    pos: z.object({
      x: z.number(),
      y: z.number(),
    }),
    size: z.number(),
    color: z.number(),
    stats: z.record(StatSchema, z.number()),
    spiritStart: z.enum(["owl", "bear", "lynx"]).optional(),
  })
  .strict();
const linkSchema = z
  .object({
    from: z.number(),
    to: z.number(),
  })
  .strict();
const passiveTreeSchema = z
  .object({
    nodes: z.array(nodeSchema),
    links: z.array(linkSchema),
  })
  .strict();
type PassiveTree = z.infer<typeof passiveTreeSchema>;

export default {
  key: "passiveTree",
  schema: passiveTreeSchema,
  get: async () => {
    const src = await getSourceFile(
      "repo:isleward-upstream/src/server/config/passiveTree.js"
    );
    const obj = await astGrep(src, "module.exports = $X;");
    return passiveTreeSchema.parse(JSON5.parse(obj));
  },
  print: (val) => {
    return JSON.stringify(val, null, 4);
  },
} satisfies Output<PassiveTree>;
