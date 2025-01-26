import spellsConfig from "./spellsConfig";

export const OUTPUTS: Output[] = [spellsConfig];

export type Output = {
  key: string;
  get: () => Promise<string>;
};
