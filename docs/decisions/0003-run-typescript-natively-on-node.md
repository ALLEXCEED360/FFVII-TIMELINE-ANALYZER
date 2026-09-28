# 0003 — Run TypeScript directly on Node

- **Status:** Accepted
- **Date:** 2026-09-27
- **Refines:** [0001](0001-internal-packages-as-typescript-source.md)

## Context

Command-line tools (data validation, seeding) and the API are TypeScript. Node 24 runs `.ts` files directly by stripping their types, with no build step or extra runner. It only supports erasable syntax — no `enum`, no `namespace` — which the base config already enforces (`erasableSyntaxOnly`). Node doesn't guess file extensions, so relative imports must name the `.ts` file.

## Decision

- Scripts and the API run with plain `node path/to/file.ts`.
- **Relative imports always include the `.ts` extension**, enabled by `allowImportingTsExtensions`. Vite and Vitest accept this too.
- The base config sets `"types": []`, so no package sees Node's globals by accident; Node-only packages opt in with `"types": ["node"]`. Packages the browser also uses stay platform-neutral.

## Consequences

- ✅ No build step or extra dependency; what's in `src/` is what runs.
- ❌ Every relative import carries `.ts`. `tsc` and ESLint flag mistakes immediately.
