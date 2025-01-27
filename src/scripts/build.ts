import $ from "dax-sh";
import fs from "fs/promises";
import { createTypeAlias, printNode, zodToTs } from "zod-to-ts";
import { OUTPUTS } from "../outputs";

$.setPrintCommand(true);

const generateIndex = async () => {
  const lines = [];

  for (const output of OUTPUTS) {
    const key = output.key;
    const typeIdent = key + "Type";
    const dataIdent = key;
    const { node } = zodToTs(output.schema, typeIdent);
    const typeAlias = createTypeAlias(node, typeIdent);
    lines.push(printNode(typeAlias));
    lines.push(
      `export const ${dataIdent} = require("../generated/${key}.json") as ${typeIdent};`
    );
  }

  await fs.writeFile("./build/index.ts", lines.join("\n"), {
    encoding: "utf-8",
  });
};

const run = async () => {
  await $`mkdir -p ./build`;
  await generateIndex();
};

run();
