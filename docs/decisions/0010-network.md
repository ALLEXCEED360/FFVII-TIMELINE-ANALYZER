# 0010 — The relationship network

- **Status:** Accepted
- **Date:** 2026-09-29
- **Builds on:** [0005](0005-database-schema.md), [0006](0006-api-design.md)

## Context

Blueprint §27–28 asks for a relationship graph (Cytoscape: zoom, pan, select, focus, expand, collapse, filter, relationship visibility; a selected entity highlights its immediate network) and graph algorithms — BFS, shortest path, connected components and degree centrality — presented as dataset metrics, not character rankings. It also warns against rendering the whole universe at once.

## Decision

### Algorithms: `packages/graph-core`

Pure TypeScript with type-only imports, so the API and the browser could both use it:

- `filterGraph` — narrows by titles, relationship categories and entities to avoid. With titles, it keeps only edges a chosen title establishes (with only those titles' evidence) **and only entities a chosen title shows**. Without the second rule, the metrics for INTERmission counted events it never shows as disconnected "groups".
- `neighborhood` (BFS), `networkSlice` (a neighbourhood plus the edges among it).
- `shortestPath` — **weighted** Dijkstra using the relationship weights in `model/relationships.md` §6, so "how are A and B connected?" prefers strong links (family, killings, causes) over weak ones (membership). Ties go to fewer steps, then alphabetical IDs, so answers are stable.
- `connectedComponents`, `degreeCentrality` (distinct neighbours, normalised by n − 1).

### API

The API loads the whole graph from Postgres once, on first use, and keeps it; the data changes only on redeploy, which restarts the server. A database test checks that this in-memory graph walks exactly the same neighbourhoods as the SQL query, for every entity, several title sets and depths 1–3.

| Endpoint                                            | Purpose                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /network/:id?depth&titles&categories`          | A neighbourhood; an entity the chosen titles don't show stands alone |
| `GET /network/path?from&to&titles&categories&avoid` | The strongest path, or `found: false`                                |
| `GET /network/metrics?titles&categories`            | Entity and relationship counts, connected groups, degree centrality  |

### Web

- **`/network/<kind>/<slug>`** — the graph around one entity, never the whole dataset by default. Depth 1–3, title and relationship-category filters, and a path target all live in the URL, along with expanded entities and the selection.
  - Click selects: the selection's immediate network lights up and everything else fades, without moving anything. Double-click recentres. **Expand** adds a node's own neighbourhood (dashed outline); **Collapse** removes it.
  - **Strongest path**: pick a target (or "Path from …" on a selection); the path is highlighted and listed step by step, and its entities are added to the view if they were outside it.
  - Shapes and colours by kind (so colour is never the only cue); edge colour by category; a dashed edge means only one of the chosen titles establishes it.
  - **The list below the graph** carries the same information as text, and is what screen readers use; the canvas is labelled as an image pointing to it.
- Cytoscape and fcose load only on network pages (about 170 KB gzipped). One Cytoscape instance per view; changes are applied as a diff, and the layout reruns only when the set of entities changes, so selecting never reshuffles the graph.
- **`/network`** — the overview: counts, disconnected groups for the chosen titles, the most directly connected entities (with a note that these measure the data, not the story), and entry points into the graph and path finder.

## Consequences

- ✅ Paths and metrics respect the same title honesty as the rest of the app.
- ✅ The graph logic is tested without a browser; the page is tested around a stand-in graph, since jsdom can't draw on a canvas.
- ❌ The fcose layout isn't deterministic, so the same view can look different on reload. Acceptable for exploration; positions stay stable while you interact.
- ❌ The in-memory graph assumes a small dataset and one API instance. Both hold for v1.
