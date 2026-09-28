# 0001 — Internal packages export TypeScript source

- **Status:** Accepted
- **Date:** 2026-09-27

## Context

The project is a pnpm monorepo: `apps/web`, `apps/api` and shared packages under `packages/`. Each internal package needs a way to be imported by the others. This is the same setup used in the author's _AoT: Paths_ project, where it worked well.

## Decision

Internal packages point their `exports` directly at TypeScript source (`"./src/index.ts"`). There is no per-package build step and no `dist/` folder; the consuming app's tooling compiles them.

All packages extend one strict `tsconfig.base.json`. `tsc` only type-checks (`noEmit`); `pnpm typecheck` runs it across the workspace.

## Consequences

- ✅ No build step for internal packages; edits are picked up instantly.
- ✅ No stale `dist/` output.
- ❌ The packages can't be published to npm as-is. Acceptable — they're private.
