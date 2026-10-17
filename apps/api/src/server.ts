// Usage: node apps/api/src/server.ts — env: DATABASE_URL, PORT (3000), HOST, CORS_ORIGIN, LOG_LEVEL,
// and SEED_FROM (a data folder) to bring the database up to date before serving, as the image does.
import { resolve } from "node:path";
import { connect, prepareDatabase } from "@ffvii/db";
import { buildApp } from "./app.ts";

const { db, close } = connect();
if (process.env.SEED_FROM) await prepareDatabase(db, resolve(process.env.SEED_FROM));
const app = await buildApp({
  db,
  corsOrigin: process.env.CORS_ORIGIN?.split(",") ?? "*",
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  // Outside production, never cache: a reseed should show up on the next request.
  ...(process.env.NODE_ENV === "production" ? {} : { cacheControl: "no-store" }),
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close().then(close);
  });
}

await app.listen({
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
});
