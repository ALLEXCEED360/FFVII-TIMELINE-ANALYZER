// Usage: node apps/api/src/cli/openapi.ts — writes the OpenAPI document for the web app.
import { mkdir, writeFile } from "node:fs/promises";
import { OPENAPI_FILE, openApiDocument } from "../openapi.ts";

await mkdir(new URL(".", OPENAPI_FILE), { recursive: true });
await writeFile(OPENAPI_FILE, await openApiDocument());
console.log("wrote apps/web/src/api/openapi.json");
