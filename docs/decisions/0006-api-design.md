# 0006 — API design and deployment

- **Status:** Accepted
- **Date:** 2026-09-28
- **Builds on:** [0005](0005-database-schema.md)

## Context

The web app needs read-only access to the dataset. The data only changes when `data/` changes and is redeployed. The blueprint listed endpoints (`/api/versions`, `/api/timeline?version=og`, `/api/compare/:entityId`, …) written against its original "version" model; this project has titles, worlds, appearances and derived statuses instead (`docs/model/`).

## Decision

**Fastify 5 with Zod schemas** (`fastify-type-provider-zod`), in `apps/api`, running TypeScript directly on Node (ADR 0003). No `/api` prefix: the API is its own service on its own domain.

| Endpoint                   | Purpose                                                                | Blueprint equivalent                             |
| -------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| `GET /reference`           | Titles (chapters, coverage), original segments, arcs, eras, worlds     | `/versions`, `/arcs`                             |
| `GET /entities`            | Catalogue, filterable by kind and title                                | `/characters`, `/locations`, …                   |
| `GET /entities/:id`        | One entity: appearances, depictions, differences, relationships        | `/events/:id`, `/characters/:id`, `/sources/:id` |
| `GET /timeline`            | Events in in-universe order, with each title's appearance              | `/timeline`                                      |
| `GET /play-order/:title`   | What a title shows, in the order the player sees it                    | `/timeline?version=og`                           |
| `GET /compare/:id`         | Side-by-side columns with derived statuses, differences, relationships | `/compare/:entityId`                             |
| `GET /differences`         | Every difference between chosen titles, by category and magnitude      | `/differences`                                   |
| `GET /network/:id`         | Neighbourhood (1–3 steps) and the relationships among it               | `/network/:entityId`                             |
| `GET /search`              | Multi-word search over names, aliases, summaries and connections       | `/search`                                        |
| `GET /health`, `GET /docs` | Health check; interactive OpenAPI docs                                 | —                                                |

- **`titles`** is a comma-separated list on every endpoint where it matters (`?titles=og,rebirth`), defaulting to all titles, always returned in release order.
- **Sources need no endpoint of their own:** citations are locators inside each fact, returned with it.
- **Every response has a strict Zod schema.** Unknown fields are stripped, and a response that doesn't match fails with a 500 instead of being sent. A test requests every per-entity endpoint for every entity in the dataset, so a schema mismatch anywhere fails CI.
- **Retired IDs** (`data/id-redirects.yaml`) get a `308` redirect to the same route with the new ID; removed ones get `404 removed`.
- **Errors** are JSON: `{ error, message }` with `bad_request`, `not_found`, `removed` or `internal`.
- **Caching:** data responses send `Cache-Control: public, max-age=300` in production, `no-store` in development and on `/health`.
- **No spoiler filtering** (`docs/model/spoilers.md`).

**Deployment:** a Docker image (`apps/api/Dockerfile`) bundles the code and `data/`. On start it applies migrations and **reseeds the database from the bundled data**, then serves, so the live database always matches the deployed data. Hosting: Render (free web service, from `render.yaml`) with Neon (free Postgres). CI builds the image on every push.

## Consequences

- ✅ One deploy ships code and data together, with no separate release step.
- ✅ The OpenAPI document at `/docs/json` is the contract the web app's types will be generated from (Phase 4).
- ❌ Reseeding on start assumes a single instance. With several, move the seed to a release step.
- ❌ Render's free tier sleeps when idle, so the first request after a while is slow.
