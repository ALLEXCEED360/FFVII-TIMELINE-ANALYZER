# 0002 — Pin TypeScript to 6.0.x

- **Status:** Accepted
- **Date:** 2026-09-27

## Context

`typescript@latest` is 7.0, the native (Go) compiler. Two tools the project depends on don't work with it yet:

- **typescript-eslint** (typed linting) requires `typescript >=4.8.4 <6.1.0` — checked 2026-09-27 against typescript-eslint 8.70.1.
- **VS Code's `typescript.tsdk` setting** needs `lib/tsserver.js`, which the 7.0 package doesn't contain.

TypeScript 6.0 is the last JavaScript-based release and matches 7.0's language behaviour, so code written now won't need changes to move to 7.

## Decision

Pin `typescript` to `~6.0.3` (6.0.x patches only) at the workspace root.

## Consequences

- ✅ Typed lint rules and the VS Code workspace TypeScript version both work.
- ❌ No 7.0 type-checking speed-up — irrelevant at this size.
- 🔁 **Revisit** when typescript-eslint's peer range includes 7.x: `pnpm view typescript-eslint peerDependencies`.
