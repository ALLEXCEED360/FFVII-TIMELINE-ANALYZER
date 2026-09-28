# 0004 — Data files are the source of truth

- **Status:** Accepted
- **Date:** 2026-09-27

## Context

The blueprint stores the dataset in PostgreSQL. But the data is researched and written by hand, one fact at a time, and each fact needs sources and review. A database is a poor place to author and review that: changes aren't visible in diffs, there's no history per fact, and a bad edit is hard to spot or undo.

## Decision

- The dataset lives in **`data/` as YAML files**, one file per entity, committed to git.
- A **validator** (`pnpm validate`, Phase 1) checks every file against the Zod schemas and every rule in `docs/`. CI runs it on every push.
- The **database is derived**: a seed script rebuilds it from `data/`. Nobody edits the database directly. The optional admin editor from the blueprint, if ever built, writes YAML, not rows.
- PostgreSQL is still the query engine for the API (joins, full-text search, graph neighbourhood queries).

## Consequences

- ✅ Every fact change is a reviewable diff with history; mistakes are reverted with git.
- ✅ The database can be rebuilt anywhere (CI, local, production) from one command.
- ✅ The same data feeds unit tests without a database.
- ❌ A seed step on every data change. Cheap at this dataset's size.
