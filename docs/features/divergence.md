# Divergence view

- **Status:** Accepted — built in Phase 8 ([ADR 0011](../decisions/0011-divergence.md))
- **Date:** 2026-09-27, updated 2026-09-28

The signature feature: where do the original and the Remake series (and the worlds inside it) part ways around an event?

## 1. The question it answers

> From this point, what stays the same, what changes, what's new and what's gone — and where does each branch lead?

## 2. Two kinds of divergence

| Kind      | Branches are…                                  | Comes from                                                               |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| **Title** | How the original and the Remake series tell it | Appearances, their statuses and differences (`model/appearances.md`)     |
| **World** | Branches of reality inside the Remake series   | Appearances stored under another world (`model/titles-and-worlds.md` §3) |

Title branches are always shown; **Show other worlds** adds a branch for each other world a chosen title shows, forking from that title's line.

## 3. What the user does

1. Picks an event: a divergence point on `/divergence`, any event from the same page, the **Divergence** button on an event's page or in the timeline inspector, or a URL — `/divergence/event/aerith-death?titles=og,rebirth&worlds=1`.
2. Sees the **trunk**: every event before it in in-universe order (`when` + `seq`) that a chosen branch shows. Each trunk station says whether the branches tell it alike or differently.
3. Sees **branches** from that event, one per title (or world), each running through the later events it shows.
4. Each station on a branch has a **marking** (§4) and, where there are differences, their categories and magnitude.
5. Selecting a station opens the event in the inspector (with the selection in the URL). **Re-root here** makes that event the pivot, keeping the titles and worlds.

Choosing titles works as on the comparison view: at least two, with the same presets.

## 4. Markings

For each branch and event, the branch's status comes from `displayStatus` for a title's main world, and from the stored appearance (or nothing) for another world. The branch is compared with its **counterparts**: the other titles' main worlds, or, for another world, its own title's main world.

| Marking                      | Meaning                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Shared**                   | Shown here and by a counterpart, with no documented difference between them.                                 |
| **Changed**                  | Shown here and by a counterpart, with a documented difference between this branch and that counterpart.      |
| **Only here**                | Shown here, and a counterpart that covers this part of the story leaves it out (omitted or not yet entered). |
| **Not yet retold elsewhere** | Shown here; every counterpart that doesn't show it simply hasn't reached this part of the story yet.         |
| **Omitted**                  | This branch covers this part of the story and leaves the event out.                                          |
| **Not yet reached**          | This branch hasn't reached this part of the story yet (drawn faded, not as a gap).                           |
| **Not yet documented**       | Covered by this branch, but not yet entered in the dataset.                                                  |

A branch with no status at all for an event (for example Remake at the Death of Aerith, which Rebirth retells) has no station there. An event no branch in the view shows is left off the map, except the pivot.

**Divergence points** (the landing page) are events with documented differences between two of the chosen titles, counted with how many are major.

## 5. How it's computed

`computeDivergence` and `divergencePoints` in `packages/shared/src/divergence.ts`, pure and unit-tested; the API (`GET /divergence`, `GET /divergence/:id`) feeds them the events from Postgres. No extra data is stored.

## 6. Accessibility

- The map is an SVG in which every station is a focusable button with a full label ("Death of Aerith — OG: Changed").
- Every marking has its own **shape** (circle, diamond, square, open circle with arrow, cross, dashed circle, "?"), so colour is never the only cue; the legend shows them.
- The **list form** below the map carries the same information: the trunk, then each branch's events with markings and differences.
- On narrow screens the map scrolls sideways inside its panel; the page itself doesn't.

## 7. Later

- World branch points (`branchesFrom`) aren't recorded yet, so world lines fork at the pivot. Once they are, a world could fork at its own branch event.
- Causal structure (`caused`, `sub_event_of`) could thin the trunk to the events that lead to the pivot, rather than everything before it, once the dataset is large enough to need it.
