import { expect, test } from "vitest";
import { deepMerge } from "./utils";

test("deepMergeWithoutOverwriting", () => {
  expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({
    a: 1,
    b: 2,
  });
  expect(deepMerge({ x: { a: 1 } }, { x: { b: 2 } })).toEqual({
    x: {
      a: 1,
      b: 2,
    },
  });

  expect(() => {
    deepMerge({ a: 1 }, { a: 2 });
  }).toThrow();
  expect(() => {
    deepMerge({ x: { a: 1 } }, { x: { a: 2 } });
  }).toThrow();
});
