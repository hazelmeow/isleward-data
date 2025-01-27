import type { z } from "zod";
import baseStats from "./baseStats";
import itemTypes from "./itemTypes";
import passiveTree from "./passiveTree";
import spellsConfig from "./spellsConfig";
import spiritStats from "./spiritStats";
import statRanges from "./statRanges";
import statScales from "./statScales";

export const OUTPUTS: Output<any>[] = [
  baseStats,
  itemTypes,
  passiveTree,
  spellsConfig,
  spiritStats,
  statRanges,
  statScales,
];

export type Output<T> = {
  key: string;
  schema: z.ZodType;
  get: () => Promise<T>;
  print: (value: T) => string;
};
