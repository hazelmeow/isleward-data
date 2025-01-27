import { Lang, parseAsync } from "@ast-grep/napi";
import assert from "assert";
import { createHash } from "crypto";
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

const isObject = (item: unknown) => {
  return !!item && typeof item === "object" && !Array.isArray(item);
};
/**
 * Merges objects without overwriting keys
 */
export const deepMerge = (target: any, ...sources: any[]): any => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        if (target[key] !== undefined && !isObject(target[key])) {
          throw new Error("deep merge refusing to overwrite");
        }
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

export const sha256sum = (s: string): string => {
  return createHash("sha256").update(s, "utf8").digest("hex");
};

export const assertReplaceAll = (src: string, a: string, b: string): string => {
  const replaced = src.replaceAll(a, b);
  assert(src !== replaced, "nothing was replaced");
  return replaced;
};
