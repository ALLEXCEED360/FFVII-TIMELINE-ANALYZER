import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { SourceFile } from "./load.ts";

/** Every data file under `dir` (Markdown notes such as README.md are skipped). */
export async function readDataDir(dir: string): Promise<SourceFile[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && !entry.name.endsWith(".md"));
  return Promise.all(
    files.map(async (entry) => {
      const absolute = join(entry.parentPath, entry.name);
      return {
        path: relative(dir, absolute).split(sep).join("/"),
        content: await readFile(absolute, "utf8"),
      };
    }),
  );
}
