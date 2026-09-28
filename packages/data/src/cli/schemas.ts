// Usage: node packages/data/src/cli/schemas.ts — regenerates packages/data/schemas/
import { mkdir, writeFile } from "node:fs/promises";
import { SCHEMA_DIR, generateSchemas } from "../schemas.ts";

await mkdir(SCHEMA_DIR, { recursive: true });
for (const [name, content] of generateSchemas()) {
  await writeFile(new URL(name, SCHEMA_DIR), content);
  console.log(`wrote schemas/${name}`);
}
