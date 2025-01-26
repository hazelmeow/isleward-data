import $ from "dax-sh";
import fs from "fs/promises";
import type { Output } from "../outputs";

export type Repo = {
  key: string;
  url: string;
  rev: string;
};
export const REPOS: Repo[] = [
  {
    key: "isleward-upstream",
    url: "https://gitlab.com/isleward/isleward.git",
    rev: "origin/release",
  },
];

const REPOS_PATH = "./temp/repos";
const GENERATED_PATH = "./generated";

export const makeDirs = async () => {
  await $`mkdir -p ${REPOS_PATH}`;
  await $`mkdir -p ${GENERATED_PATH}`;
};

export const getRepoPath = (repo: Repo) => {
  return `./temp/repos/${repo.key}`;
};

const exists = async (path: string) => {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
};

export const checkoutRepo = async (repo: Repo) => {
  const repoPath = getRepoPath(repo);

  if (!(await exists(repoPath))) {
    $.log("Cloning isleward-upstream");
    await $`git clone ${repo.url} ${repoPath}`;
  }

  await $`git fetch`.cwd(repoPath);

  const revSha = await $`git rev-parse ${repo.rev}`.cwd(repoPath).text();
  if (!revSha) {
    $.logError(`Error rev-parse failed for ${repo.key}`);
    return;
  }

  const currentRev = await $`git rev-parse HEAD`.cwd(repoPath).text();
  if (!currentRev) {
    $.logError(`Error rev-parse failed for ${repo.key}`);
    return;
  }

  if (currentRev != revSha) {
    $.log(`Checking out ${repo.rev} (${revSha})`);
    await $`git checkout ${revSha}`.cwd(repoPath);
  }
};

export const getSourceFile = async (source: string) => {
  if (source.startsWith("repo:")) {
    const match = source.match(/^repo:([^\/]*)\/(.*)$/);
    if (!match) throw new Error("failed to parse source string");

    const [_, repoKey, path] = match;

    const repo = REPOS.find((r) => r.key === repoKey);
    if (!repo) throw new Error("failed to parse source string");
    const repoPath = getRepoPath(repo);

    const sourceFilePath = `${repoPath}/${path}`;

    return await fs.readFile(sourceFilePath, { encoding: "utf-8" });
  } else {
    throw new Error("failed to parse source string");
  }
};

export const getOutputPath = (output: Output) => {
  return `./generated/${output.key}`;
};

export const generateOutput = async (output: Output) => {
  const outputPath = getOutputPath(output);
  const contents = await output.get();
  await fs.writeFile(outputPath, contents, { encoding: "utf-8" });
};
