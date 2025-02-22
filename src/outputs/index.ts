import type { z } from "zod";
import balanceConfig from "./balanceConfig";
import baseStats from "./baseStats";
import itemTypes from "./itemTypes";
import passiveTree from "./passiveTree";
import spellsExt from "./spellsExt";
import spiritStats from "./spiritStats";
import statRanges from "./statRanges";
import statScales from "./statScales";

export const OUTPUTS: Output<any>[] = [
  balanceConfig,
  baseStats,
  itemTypes,
  passiveTree,
  spellsExt,
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
