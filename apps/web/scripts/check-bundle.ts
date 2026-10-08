// After `vite build`: fails if the gzipped build outgrows its budgets (ADR 0013), or if any
// animation names keyframes the build left out.
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

// Tailwind drops theme keyframes styles.css doesn't use, so a component borrowing one can lose it.
const sheets = (await readdir(new URL("assets/", DIST))).filter((f) => f.endsWith(".css"));
let allCss = "";
for (const file of sheets) allCss += await readFile(new URL(`assets/${file}`, DIST), "utf8");
const defined = new Set([...allCss.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
const NOT_NAMES = new Set(
  "none normal reverse alternate alternate-reverse forwards backwards both infinite running paused linear ease ease-in ease-out ease-in-out step-start step-end inherit initial unset".split(
    " ",
  ),
);
const missing = new Set<string>();
for (const [, value = ""] of allCss.matchAll(/animation(?:-name)?:([^;}]+)/g)) {
  // Drop functions (timing functions, var() fallbacks), then take each layer's name.
  let plain = value;
  while (/[\w-]+\([^()]*\)/.test(plain)) plain = plain.replace(/[\w-]+\([^()]*\)/g, "");
  for (const layer of plain.split(",")) {
    const name = layer
      .trim()
      .split(/\s+/)
      .find((token) => /^-?[a-z_][\w-]*$/i.test(token) && !NOT_NAMES.has(token));
    if (name && !defined.has(name)) missing.add(name);
  }
}
if (missing.size > 0) {
  console.error(`
Animations with no keyframes in the build: ${[...missing].join(", ")}`);
  failures.push("keyframes");
} else {
  console.log("ok   every animation has its keyframes");
}

if (failures.length > 0) {
  console.error(`\nFailed: ${failures.join(", ")}`);
  process.exit(1);
}
