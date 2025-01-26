import { Lang, parseAsync } from "@ast-grep/napi";
import assert from "assert";
import JSON5 from "json5";

export const astGrep = async (src: string, pattern: string) => {
  const ast = await parseAsync(Lang.JavaScript, src);
  const root = ast.root();
  const node = root.find(pattern);
  const val = node?.getMatch("X")?.text();
  assert(val, `astGrep failed for "${pattern}"`);
  return val;
};

export const convertJson5ToJson = (src: string) => {
  return JSON.stringify(JSON5.parse(src), null, 4);
};

export const containsDuplicateKeys = (objects: object[]) => {
  const allKeys = objects.map((o) => Object.keys(o)).flat();
  const uniqueKeys = allKeys.filter((k, i, a) => a.indexOf(k) === i);
  return uniqueKeys.length < allKeys.length;
};
