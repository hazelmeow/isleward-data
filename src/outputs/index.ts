import itemTypes from "./itemTypes";
import spellsConfig from "./spellsConfig";

export const OUTPUTS: Output[] = [itemTypes, spellsConfig];

export type Output = {
  key: string;
  get: () => Promise<string>;
};
