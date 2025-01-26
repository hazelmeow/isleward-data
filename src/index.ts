import $ from "dax-sh";
import { checkoutRepo, generateOutput, makeDirs, REPOS } from "./files";
import { OUTPUTS } from "./outputs";

$.setPrintCommand(true);

const checkDeps = async () => {
  try {
    await $`which git`.quiet();
  } catch {
    throw new Error("`git` not found");
  }
};

const run = async () => {
  await checkDeps();
  await makeDirs();

  for (const repo of REPOS) {
    await checkoutRepo(repo);
  }

  for (const output of OUTPUTS) {
    await generateOutput(output);
  }
};

run();
