// Usage: node packages/db/src/cli/seed.ts [data folder]
// Rebuilds the database from data/. Refuses to run if the data doesn't validate.
import { resolve } from "node:path";
import { formatIssue, loadDataset, readDataDir, validateDataset } from "@ffvii/data";
import { connect } from "../client.ts";
import { buildSeedRows, seed } from "../seed.ts";

const dataDir = resolve(process.argv[2] ?? "data");
const { dataset, issues } = loadDataset(await readDataDir(dataDir));
const errors = [...issues, ...validateDataset(dataset)].filter((i) => i.level === "error");
if (errors.length > 0) {
  for (const issue of errors) console.error(formatIssue(issue));
  console.error(`\nNot seeding: ${String(errors.length)} error(s). Run \`pnpm validate\`.`);
  process.exit(1);
}

const rows = buildSeedRows(dataset);
const { db, close } = connect();
try {
  await seed(db, rows);
  console.log(
    `seeded ${String(rows.entities.length)} entities, ${String(rows.appearances.length)} appearances, ` +
      `${String(rows.differences.length)} differences, ${String(rows.edges.length)} relationships`,
  );
} finally {
  await close();
}
