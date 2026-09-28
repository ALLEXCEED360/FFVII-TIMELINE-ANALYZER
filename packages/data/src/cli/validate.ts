// Usage: node packages/data/src/cli/validate.ts [data folder]
import { resolve } from "node:path";
import { readDataDir } from "../files.ts";
import { formatIssue } from "../issues.ts";
import { loadDataset } from "../load.ts";
import { validateDataset } from "../validate.ts";

const dataDir = resolve(process.argv[2] ?? "data");
const { dataset, issues } = loadDataset(await readDataDir(dataDir));
issues.push(...validateDataset(dataset));

for (const issue of issues) console.log(formatIssue(issue));

const errors = issues.filter((issue) => issue.level === "error").length;
const warnings = issues.length - errors;
const appearances = [...dataset.entities.values()].reduce(
  (sum, { entity }) => sum + entity.appearances.length,
  0,
);
console.log(
  `\n${String(dataset.entities.size)} entities, ${String(appearances)} appearances, ` +
    `${String(dataset.edges.length)} relationships — ` +
    `${String(errors)} error(s), ${String(warnings)} warning(s)`,
);
process.exitCode = errors > 0 ? 1 : 0;
