import $ from "dax-sh";
import { OUTPUTS } from "../outputs";
import { checkoutRepo, generateOutput, makeDirs, REPOS } from "../utils/files";

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
