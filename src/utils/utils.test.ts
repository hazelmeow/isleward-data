import { expect, test } from "vitest";
import { astGrepNullifyFunctions, deepMerge } from "./utils";
import JSON5 from "json5";

test("astGrepNullifyFunctions", async () => {
  const src = String.raw`
module.exports = {
	a: 123,
	b: 'xyz',
	c: function () {
		console.log('asdf');
	}
}
	`;
  const nullified = await astGrepNullifyFunctions(src, "module.exports = $X");
  console.log(nullified);
  expect(JSON5.parse(nullified)).toEqual({ a: 123, b: "xyz", c: null });
});

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
