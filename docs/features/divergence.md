# Divergence view

- **Status:** Draft — refined when the feature is built (Phase 8)
- **Date:** 2026-09-27

The signature feature. Written now so the data model is known to support it before any data is entered.

## 1. The question it answers

> From this point, what stays the same, what changes, what's new and what's gone — and where does each branch lead?

## 2. Two kinds of divergence

| Kind      | Branches are…                                  | Comes from                                                              |
| --------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| **Title** | How the original and the Remake series tell it | Appearances, their statuses and differences (`model/appearances.md`)    |
| **World** | Branches of reality inside the Remake series   | Worlds and their `branchesFrom` event (`model/titles-and-worlds.md` §3) |

The user can view either, or both together (world branches drawn inside the Remake series' branch).

## 3. What the user does

1. Selects an event (from the timeline, search, the graph or a URL: `/divergence/<event id>`).
2. Sees a **shared trunk** — the events leading to it that all selected titles share.
3. Sees **branches** from that point, one per title (or world), each continuing along its own events.
4. Each event on a branch is marked by its relation to the other branches:
   - **shared** — also on the other branch, unchanged;
   - **changed** — on both, with differences (badge shows categories and magnitude);
   - **new** — only on this branch;
   - **omitted** — present on the other branch, stored as omitted here;
   - **not yet reached** — beyond this title's coverage (drawn faded, not as a gap in the story).
5. Clicking an event updates the inspector, timeline and graph selection (the synchronized-selection rule in the blueprint), and can re-root the view there.

## 4. How it's computed (no extra data needed)

- **Trunk and branches** come from the events connected to the selected event by `caused` and `sub_event_of`, plus chronological neighbours (by `when` + `seq`), each restricted to the titles or worlds being compared.
- **Markings** come from appearance statuses (stored and derived) and differences.
- **World branch points** come from each world's `branchesFrom`.

All of this is computed in the shared graph package so the API and the browser agree. If building the view reveals that something must be stored, add it to the model docs first.

## 5. Accessibility

The view has a **list form**: trunk, then each branch as a list of events with their markings — so it's never the only way to reach the information.
