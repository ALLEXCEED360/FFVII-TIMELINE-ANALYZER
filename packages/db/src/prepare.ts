import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { Db } from "./client.ts";
import { seedState } from "./schema.ts";
import { buildSeedRows, seed } from "./seed.ts";

// Brings the database up to date as the API starts, in the same process: on a small host, starting
// three programs and reseeding every time made each wake take most of a minute.

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const MIGRATIONS = here("../migrations");
/** The code that turns the data into rows: a change to it reseeds, as a change to the data does. */
const CODE = [here("."), here("../../shared/src"), here("../../data/src")];

/** A hash of every file under the folders (tests aside), by path and content. */
export async function fingerprintOf(folders: readonly string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const [i, folder] of folders.entries()) {
    const files = (await readdir(folder, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile() && !entry.name.endsWith(".test.ts"))
      .map((entry) => join(entry.parentPath, entry.name))
      .sort();
    for (const file of files) {
      hash.update(`${String(i)}:${file.slice(folder.length).replaceAll("\\", "/")}\0`);
      hash.update(await readFile(file));
      hash.update("\0");
    }
  }
  return hash.digest("hex");
}

/** Applies pending migrations, then reseeds from `dataDir` unless nothing has changed since last time. */
export async function prepareDatabase(
  db: Db,
  dataDir: string,
  log: (message: string) => void = console.log,
): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS });
  log("migrations applied");

  const fingerprint = await fingerprintOf([dataDir, MIGRATIONS, ...CODE]);
  const [last] = await db.select().from(seedState).where(eq(seedState.id, 1));
  if (last?.fingerprint === fingerprint) {
    log("data unchanged since the last seed: not reseeding");
    return;
  }

  // Loaded only now: reading and checking every file is the slow part of a start.
  const { formatIssue, loadDataset, readDataDir, validateDataset } = await import("@ffvii/data");
  const { dataset, issues } = loadDataset(await readDataDir(dataDir));
  const errors = [...issues, ...validateDataset(dataset)].filter((i) => i.level === "error");
  if (errors.length > 0) {
    throw new Error(
      `Not seeding: ${String(errors.length)} error(s)\n${errors.map(formatIssue).join("\n")}`,
    );
  }
  const rows = buildSeedRows(dataset);
  await seed(db, rows, fingerprint);
  log(
    `seeded ${String(rows.entities.length)} entities, ${String(rows.appearances.length)} appearances, ` +
      `${String(rows.differences.length)} differences, ${String(rows.edges.length)} relationships`,
  );
}
