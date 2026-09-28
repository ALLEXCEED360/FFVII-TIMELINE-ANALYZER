# 0008 — Entity explorer and search

- **Status:** Accepted
- **Date:** 2026-09-28
- **Builds on:** [0007](0007-web-app.md)

## Context

Phase 5 needs a way into the dataset other than the timeline: a page for every entity (blueprint §25), a browsable catalogue (§20 EXPLORE), and global search (§26) — Ctrl/⌘ + K, grouped by Characters, Events, Locations, Organizations and Arcs.

## Decision

### Entity pages

- **Readable URLs** (blueprint §39): `/character/cloud-strife`, `/event/nibelheim-incident`. An ID `<kind>_<slug>` maps to `/<kind>/<slug with hyphens>` and back (`lib/paths.ts`); a path that can't be an ID shows "not found". Retired IDs follow the API's redirect and the page replaces its URL with the canonical one.
- **One page for every kind**, built from `/entities/:id`:
  - identity (name, aliases, summary; for events their year, arc and importance);
  - which titles it appears in;
  - for events, the events just **before and after** in in-universe order, from the cached timeline;
  - **every appearance**, one card per title and world, with role, depictions and citations;
  - **differences** between titles;
  - **connections grouped by what they connect to** (events, characters, locations, organizations), events in story order. Each shows its label from this entity's side, the titles that establish it (hover for citations) and any uncertainty with its note.
- The appearance card, difference list and title dots are **shared** with the timeline inspector, which now links to full pages.

### Explore

`/explore?kind=&title=&q=` lists every entity as a card (kind, titles, summary), filtered client-side by kind, title and text. The dataset is small enough to load once; the filters live in the URL.

### Search

- **The palette** opens from the header button or **Ctrl/⌘ + K** anywhere, and closes with Escape, returning focus to where it was. It's an accessible combobox: arrow keys move through the results, Enter opens one, and the active result is announced.
- Results come from `/search` (debounced), **grouped by kind** with groups ordered by their best result, so the top hit is always first. **Arcs** are matched in the browser against the reference data and open the timeline filtered to that arc.
- Each result says **why it matched** when that isn't obvious: an alias ("Also known as Aeris"), its description, a title's version ("In OG's version"), or a connection ("Connected to Nibelheim").
- **Typo tolerance per word:** the API now scores names with `word_similarity` rather than whole-string `similarity`, so a typo like "nibelhiem" finds "Nibelheim Incident" as well as "Nibelheim" — long names are no longer penalised.

## Consequences

- ✅ Every entity has a shareable, readable URL, and every mention of an entity in the app links to it.
- ✅ Search works from anywhere, by keyboard alone.
- ❌ Explore filters in the browser; if the dataset grows into the thousands, move filtering to `/entities` query parameters (the API already supports `kind` and `title`).
- ❌ Paths use hyphens while IDs use underscores; `idFromPath` is the only place that converts, and it's tested.
