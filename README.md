# Final Fantasy VII: Timeline Analyzer

An interactive narrative-analysis app for exploring and comparing the chronology, characters, locations, relationships and story changes across versions of _Final Fantasy VII_ — the 1997 original, _Remake_ (with _Episode INTERmission_) and _Rebirth_.

The core question: **how does this piece of FFVII's story appear, change, connect or diverge across versions?**

## Status

**Phase 11 — design pass (complete).** The archive now looks and plays like an Atlus game menu set in FFVII: a title screen over Midgar at night that wakes the server, a Metaphor-style main menu of the sections, fat-face titles, slanted slabs, a paper-red-ink wipe carrying each section's name, a Mako cursor, and Settings for motion, the title screen and the cursor. 71 pieces of official Square Enix artwork (key art, character renders, Nomura's original illustrations, concept art) sit behind every screen, stand in the character roster, and pair each character's original and modern looks. Next: Phase 12, the release. The design lives in [`docs/`](docs/README.md); how to write data is in [`data/`](data/README.md).

| Package                                    | What it does                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| [`@ffvii/shared`](packages/shared)         | Zod schemas and types for all data; titles, locators, chronology, derived statuses |
| [`@ffvii/data`](packages/data)             | Loads and validates `data/`; generates editor schemas                              |
| [`@ffvii/graph-core`](packages/graph-core) | Graph algorithms: neighbourhoods, weighted shortest path, groups, centrality       |
| [`@ffvii/db`](packages/db)                 | PostgreSQL schema, migrations, seeding and queries                                 |
| [`@ffvii/api`](apps/api)                   | Read-only REST API (Fastify); OpenAPI docs at `/docs`                              |
| [`@ffvii/web`](apps/web)                   | The web app (React, Vite, Tailwind, D3)                                            |
| [`@ffvii/e2e`](apps/e2e)                   | End-to-end journeys and accessibility audits (Playwright, axe)                     |

## Roadmap

| Phase | What                                              |
| ----- | ------------------------------------------------- |
| 0     | Foundations — tooling, CI, design docs            |
| 1     | Data model, validator and prototype dataset       |
| 2     | Database — schema, migrations, seed, core queries |
| 3     | REST API, deployed early                          |
| 4     | Web app shell and the first timeline              |
| 5     | Entity explorer and search                        |
| 6     | Comparison view                                   |
| 7     | Relationship network and graph algorithms         |
| 8     | Divergence view                                   |
| 9     | Archive and sources                               |
| 10    | Testing, performance and accessibility hardening  |
| 11    | Design pass                                       |
| 12    | Release                                           |

Dataset research ran alongside Phases 4–9 and reached the MVP scope before Phase 10: 25 events, 20 characters, 11 locations and 5 organizations, with 148 relationships, each checked against the games' script transcripts (see the research log at `/archive/research`).

## Stack

TypeScript throughout, in a pnpm monorepo.

- **Web:** React, Vite, React Router, Tailwind CSS, TanStack Query, Zustand, D3 (timeline), Cytoscape.js (network)
- **API:** Fastify, Zod
- **Data:** YAML files in `data/` (the source of truth), PostgreSQL via Drizzle ORM
- **Testing:** Vitest, Playwright, axe-core
- **Hosting:** Vercel (web), Render (API), Neon (database)

## Development

Requires Node 24, pnpm and Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up && pnpm db:migrate && pnpm db:seed
pnpm check
pnpm test:db
pnpm --filter @ffvii/e2e exec playwright install chromium   # once
pnpm e2e
pnpm api:dev    # http://localhost:3000/docs
pnpm web:dev    # http://localhost:5173
```

| Command            | What it does                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| `pnpm check`       | Everything CI runs without a database: types, lint, format, tests, data      |
| `pnpm validate`    | Check `data/` against every rule in the design docs                          |
| `pnpm db:up`       | Start the local Postgres (Docker, port 5433)                                 |
| `pnpm db:seed`     | Rebuild the database from `data/`                                            |
| `pnpm db:reset`    | Wipe the database, then migrate and seed from scratch                        |
| `pnpm test:db`     | Database and API tests (needs `pnpm db:up`)                                  |
| `pnpm e2e`         | Build the web app and run the Playwright journeys (needs the API's database) |
| `pnpm web:size`    | Check the built web app against its size budgets                             |
| `pnpm api:dev`     | Run the API with auto-reload (restart it after `pnpm db:seed`)               |
| `pnpm web:dev`     | Run the web app (uses `VITE_API_URL`, default `http://localhost:3000`)       |
| `pnpm api:types`   | Regenerate the web app's API types after changing the API                    |
| `pnpm db:generate` | Create a migration after changing `packages/db/src/schema.ts`                |
| `pnpm schemas`     | Regenerate the editor's YAML schemas after changing a Zod schema             |

## License

- **Code** — [MIT](LICENSE).
- **Data and documentation** (`data/`, `docs/`) — [CC BY-NC 4.0](LICENSE-DATA): reuse with attribution, non-commercial only.
- The title screen's pixel font, [Reactor7](https://caveras.net/) by Caveras, is CC BY-NC-SA and ships with its own licence in `apps/web/public/fonts/reactor7/`.
- _Final Fantasy VII_ and all related names, characters and artwork belong to Square Enix. These licences cover only the original work in this repository. Official artwork shown in the web app is **not** licensed by this project; it's credited on the site's Credits page.

## Disclaimer

Non-commercial fan project. Not affiliated with or endorsed by Square Enix. Official artwork is shown for non-commercial fan purposes with credit; the rights holder can ask for any of it to be removed, and it will be.
