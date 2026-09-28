# 0007 — Web app architecture and the first timeline

- **Status:** Accepted
- **Date:** 2026-09-28
- **Builds on:** [0006](0006-api-design.md)

## Context

Phase 4 needs the app shell (blueprint §46) and the first meaningful screen, the timeline (§21–22, §47): chronological events, one lane per title, selection with an inspector, filters and a title switch — without the divergence visualization yet. The data model has no calendar (`docs/model/chronology.md`): almost every event is in year 0.

## Decision

`apps/web`: **React 19 + Vite 8 + TypeScript**, styled with **Tailwind CSS 4**. The same stack as the author's _AoT: Paths_.

- **Routing:** React Router 8. Pages other than home are lazy-loaded, so the first screen doesn't wait for the chart code.
- **State lives in the URL** wherever it describes what you're looking at: `/timeline?titles=og,rebirth&view=play&layout=list&arc=…&major=1&event=…`. Any view can be shared or bookmarked; selecting an event replaces the history entry instead of piling up Back steps.
- **Server state:** TanStack Query. The data only changes on deploy, so answers are cached for the visit.
- **UI state:** Zustand, only for what is neither server data nor URL — so far just the dismissed spoiler notice (persisted, with a fallback when storage is blocked).
- **Typed API calls:** the API exports its OpenAPI document to `apps/web/src/api/openapi.json`; `openapi-typescript` generates `schema.d.ts`, and `openapi-fetch` type-checks every request and response. `pnpm api:types` regenerates both; an API test fails if the committed document falls behind.
- **No Zod in the browser:** display helpers live in `@ffvii/shared/labels`, a dependency-free entry point (it only has type imports).

### The timeline

- **In-universe view:** era bands sized by their `weight`, showing only eras that contain events. Inside an era, events are spaced **evenly in story order** (year, then `seq`) — the honest choice when the games give no dates. A title that places an event at a different time moves its own marker and gets a "different time" flag.
- **Play-order view:** each lane in its own play order; threads between lanes cross where titles reveal events in a different order.
- **Markers** encode the appearance: filled = depicted, hollow = referenced, cross = omitted, dashed ring = false or disputed account, dashed outline = only in another world. Threads link one event across lanes.
- **Zoom and pan** with `d3-zoom`: drag to pan (except from a marker, which only selects), Ctrl/⌘ + wheel or buttons to zoom. Plain wheel scrolls the page.
- **The list layout** is the accessible alternative and what narrow screens get: every event with each title's status, as text. The chart is never the only way to reach anything.
- **The inspector** loads the selected entity from `/entities/:id` and shows each title's appearance with its depictions and citations, differences, and who and where it involves.
- **Layout logic is pure** (`features/timeline/layout.ts`) and unit-tested; page behaviour is tested against fixtures captured from the real API, including an axe accessibility check.

**Hosting (later):** Vercel, as a static single-page app (`vercel.json` rewrites every path to `index.html`), with `VITE_API_URL` pointing at the API.

## Consequences

- ✅ An API change that breaks the web app fails `pnpm typecheck`, not production.
- ✅ The timeline stays readable with a handful of events or a few hundred: ordinal spacing never overlaps, labels shorten to fit, and zoom opens up crowded eras.
- ❌ Ordinal spacing inside an era doesn't show how much time passes between events. That's accurate to the source material; a dated axis can be added for eras that gain real dates.
- ❌ Test fixtures (`apps/web/src/test/*.json`) are snapshots of API responses; regenerate them when response shapes change.
