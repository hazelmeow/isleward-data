import type { z } from "zod";
import baseStats from "./baseStats";
import itemTypes from "./itemTypes";
import spellsConfig from "./spellsConfig";
import statRanges from "./statRanges";

export const OUTPUTS: Output<any>[] = [
  baseStats,
  itemTypes,
  spellsConfig,
  statRanges,
];

export type Output<T> = {
  key: string;
  schema: z.ZodType;
  get: () => Promise<T>;
  print: (value: T) => string;
};
