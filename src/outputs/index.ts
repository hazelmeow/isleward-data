import itemTypes from "./itemTypes";
import spellsConfig from "./spellsConfig";
import statRanges from "./statRanges";

export const OUTPUTS: Output[] = [itemTypes, spellsConfig, statRanges];

export type Output = {
  key: string;
  get: () => Promise<string>;
};
