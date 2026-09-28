// Usage: node packages/db/src/cli/migrate.ts — applies pending migrations.
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { connect } from "../client.ts";

const { db, close } = connect();
try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../../migrations", import.meta.url)),
  });
  console.log("migrations applied");
} finally {
  await close();
}
