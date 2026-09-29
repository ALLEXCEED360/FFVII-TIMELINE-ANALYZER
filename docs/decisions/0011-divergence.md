# 0011 — The divergence view

- **Status:** Accepted
- **Date:** 2026-09-28
- **Builds on:** [0006](0006-api-design.md), [0009](0009-comparison-view.md), [0010](0010-network.md)

## Context

Blueprint §29 describes the signature view: from an event, show the history the titles share and where each goes its own way. The draft in [`features/divergence.md`](../features/divergence.md) left three questions open: what the trunk contains, what exactly each marking means, and where the computation lives.

## Decision

### The trunk is chronology, not causality

The trunk is every event before the pivot in in-universe order that a chosen branch shows; branches carry the pivot and everything after it. The draft proposed following `caused` and `sub_event_of`, but with a small dataset that leaves most events off the map and depends on how thoroughly causes are recorded. Chronology is complete and predictable. Causal thinning stays a later option.

### Markings are relative to counterparts

Each branch is compared with its counterparts — the other chosen titles' main worlds, or for another world, its own title's main world. The draft's "new" split into two cases:

- **Only here** — a counterpart covers this part of the story and doesn't show the event.
- **Not yet retold elsewhere** — counterparts just haven't reached it yet. Calling the original's later events "new" or "only in OG" when Part 3 hasn't been released would be misleading, the same honesty rule as the comparison view's _not yet reached_.

"Changed" counts only differences between this branch and a counterpart that shows the event, so a difference with a title outside the view doesn't mark it. The full definitions are in `features/divergence.md` §4.

### Computed in `@ffvii/shared`

`computeDivergence` and `divergencePoints` are pure functions next to `displayStatus`, which they rely on — not in `graph-core` as drafted, since they use statuses and coverage rather than the relationship graph. The database supplies events with appearances and differences in one query.

| Endpoint                            | Purpose                                                               |
| ----------------------------------- | --------------------------------------------------------------------- |
| `GET /divergence?titles`            | Divergence points: events with differences between the chosen titles  |
| `GET /divergence/:id?titles&worlds` | Pivot, branches, trunk and branch stations; at least two titles (400) |

### Web

- **`/divergence`** lists divergence points for the chosen titles, and offers any event as a starting point.
- **`/divergence/<kind>/<slug>`** draws a subway-style SVG map: one trunk line forking at the pivot into a line per title (title colours), and dashed lines for other worlds. Stations have one shape per marking. Titles, worlds and the selected event live in the URL.
- Selecting opens the existing event inspector; its extra action becomes **Re-root here**. Elsewhere the inspector and event pages link to the event's divergence view.
- The list form below the map carries the same information. No new dependencies: the map is plain SVG from a pure, tested layout function.

## Consequences

- ✅ The view follows the same status rules as the comparison view, so the two never disagree.
- ✅ No new stored data; worlds and markings come from what the model already has.
- ❌ With many events the trunk grows wide. It scrolls sideways; causal thinning or collapsing is left for when the dataset needs it.
- ❌ World lines fork at the pivot, not at their true branch point, until `branchesFrom` is recorded.
