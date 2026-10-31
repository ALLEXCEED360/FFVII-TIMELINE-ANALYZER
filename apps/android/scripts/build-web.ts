// Builds the site for the app: the same build as the website's, pointed at the live API.
import { spawnSync } from "node:child_process";

const API_URL = process.env.VITE_API_URL ?? "https://ffvii-timeline-api.onrender.com";

const result = spawnSync("pnpm", ["--filter", "@ffvii/web", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, VITE_API_URL: API_URL },
});
process.exit(result.status ?? 1);
