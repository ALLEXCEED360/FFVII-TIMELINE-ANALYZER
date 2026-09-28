import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

const ROOT_ENV = fileURLToPath(new URL("../../../.env", import.meta.url));

/** DATABASE_URL from the environment, falling back to the repository's `.env` file. */
export function databaseUrl(): string {
  if (process.env.DATABASE_URL === undefined && existsSync(ROOT_ENV)) {
    process.loadEnvFile(ROOT_ENV);
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — copy .env.example to .env");
  return url;
}

export function connect(url = databaseUrl()) {
  const client = postgres(url, { max: 5, onnotice: () => undefined });
  const db = drizzle(client, { schema, casing: "snake_case" });
  return { db, close: () => client.end() };
}

export type Db = ReturnType<typeof connect>["db"];
