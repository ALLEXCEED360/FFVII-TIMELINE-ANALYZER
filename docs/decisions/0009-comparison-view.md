# 0009 — The comparison view

- **Status:** Accepted
- **Date:** 2026-09-28
- **Builds on:** [0006](0006-api-design.md), [0008](0008-explorer-and-search.md)

## Context

Comparison is the project's reason to exist (blueprint §24, §48): for any entity, show how the chosen titles present it side by side — shared information, version-specific information, documented differences and sources — with presets for OG vs Remake, Remake vs Rebirth, OG vs Rebirth and all three, and tabs instead of columns on small screens.

## Decision

### Pages

- **`/compare/<kind>/<slug>?titles=…`** — the side-by-side view of one entity. Titles default to OG, Remake and Rebirth and are kept in the URL (at least two; INTERmission can be added). It shows:
  - **one column per title** with its status — stored (`depicted`, `referenced`, `omitted`) or derived (`not_yet_reached`, `undocumented`, `absent`), each with its explanation — a "Changed" badge when a difference targets that title, the main-world appearance, and any other-world appearances;
  - **documented differences** between the chosen titles, grouped by category, each with its magnitude, certainty and citations on both sides;
  - **a relationship matrix** — connections × titles — marking each as shared or version-specific.
- **On narrow screens** the columns become an accessible tab list (arrow keys switch titles).
- **`/compare`** — the COMPARE section: every documented difference between the chosen titles, filterable by category and magnitude, grouped by entity (events in story order first), with an entity picker and a link from each group to its side-by-side view.
- Entity pages ("Compare titles") and the timeline inspector ("Compare") link into the view.

### When a relationship counts as a difference

Building the matrix exposed a flaw: an edge was called version-specific whenever a compared title showed the entity but didn't establish the edge. On the prototype data that claimed, for example, that _Rebirth_ leaves out Tifa's part in Cloud's recovered memories — an event _Rebirth_ hasn't reached — and that _Remake_ leaves out Cloud's hometown, which it only mentions.

**Rule:** a title can only reveal a missing relationship if it **depicts both ends in the same world**. The API now returns, for each compared relationship, its `applicable` titles; `shared` means every applicable title establishes it. The matrix shows ✓ (established), ? (established but inferred or ambiguous), — (applicable but not established: a real difference) and · (not applicable). The rule is recorded in `model/relationships.md` §3 and tested on the real data.

## Consequences

- ✅ The view never claims a title "left something out" just because it doesn't cover that part of the story — the same honesty the status model applies to entities, now applied to relationships.
- ✅ Every claim on the page traces to citations on both sides.
- ❌ The stricter rule hides a relationship gap when a title only mentions one end. That's deliberate: a mention isn't enough evidence of omission.
