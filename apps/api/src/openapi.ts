import type { Db } from "@ffvii/db";
import { buildApp } from "./app.ts";

/** The API's OpenAPI document. Built without a database: no route handler runs. */
export async function openApiDocument(): Promise<string> {
  const app = await buildApp({ db: {} as Db });
  await app.ready();
  const document = JSON.stringify(app.swagger(), null, 2);
  await app.close();
  return `${document}\n`;
}

/** Where the web app keeps its copy (it generates its API types from it). */
export const OPENAPI_FILE = new URL("../../web/src/api/openapi.json", import.meta.url);
