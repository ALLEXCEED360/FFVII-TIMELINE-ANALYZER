// Usage: node scripts/check-bundle.ts (after `vite build`) — fails if the build outgrows its
// budgets (docs/decisions/0013-hardening.md). Sizes are gzipped, as browsers download them.
import { readFile, readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const DIST = new URL("../dist/", import.meta.url);

/** What every visitor downloads before the first screen: the entry script, its preloads, the CSS. */
const INITIAL_JS_BUDGET = 135 * 1024;
const CSS_BUDGET = 15 * 1024;
/** Any one page's own code (the graph libraries are separate, and load only on network pages). */
const PAGE_BUDGET = 30 * 1024;

const gzipped = async (path: string) => gzipSync(await readFile(new URL(path, DIST))).length;
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`;

const html = await readFile(new URL("index.html", DIST), "utf8");
const initial = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1] ?? "");
const css = [...html.matchAll(/href="\/(assets\/[^"]+\.css)"/g)].map((m) => m[1] ?? "");
const pages = (await readdir(new URL("assets/", DIST))).filter((f) => /Page-[\w-]+\.js$/.test(f));

const failures: string[] = [];
const report = (label: string, size: number, budget: number) => {
  const ok = size <= budget;
  console.log(
    `${ok ? "ok  " : "OVER"} ${label.padEnd(44)} ${kb(size).padStart(9)} / ${kb(budget)}`,
  );
  if (!ok) failures.push(label);
};

let initialSize = 0;
for (const file of initial) initialSize += await gzipped(file);
report(`initial JavaScript (${String(initial.length)} files)`, initialSize, INITIAL_JS_BUDGET);

let cssSize = 0;
for (const file of css) cssSize += await gzipped(file);
report("CSS", cssSize, CSS_BUDGET);

for (const file of pages.sort())
  report(file.replace(/-[\w-]+\.js$/, ""), await gzipped(`assets/${file}`), PAGE_BUDGET);

if (failures.length > 0) {
  console.error(`\nOver budget: ${failures.join(", ")}`);
  process.exit(1);
}
