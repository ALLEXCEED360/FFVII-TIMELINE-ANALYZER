import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { OPENAPI_FILE, openApiDocument } from "./openapi.ts";

it("the web app's copy of the OpenAPI document is up to date — run `pnpm api:types` if this fails", async () => {
  expect(await readFile(OPENAPI_FILE, "utf8")).toBe(await openApiDocument());
});
