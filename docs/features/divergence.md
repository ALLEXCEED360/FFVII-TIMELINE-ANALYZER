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

The pages are written for someone new to the story ([ADR 0022](../decisions/0022-divergence-for-beginners.md)); the terms in brackets are the data's.

1. Picks a moment (the pivot): a big turning point or any moment where the games differ on `/divergence`, any event found by name there, **See where the stories split** in an event's panel on the timeline, or a URL — `/divergence/event/aerith-death?titles=og,rebirth&worlds=1`.
2. Reads **the story so far** (the trunk): every event before it in in-universe order (`when` + `seq`) that a chosen branch shows, each saying whether the games tell it the same way or differently, which kinds of change, and which games tell it.
3. Reads **the turning point**: what each game (each branch) does with the moment, in plain words.
4. Reads **where each game goes**: one line per game (or world) through the later events it shows, each with its marking (§4) in plain words and, where there are differences, their kinds and whether any is a big one.
5. Choosing a moment opens it in the event panel (with the selection in the URL). **Make this the turning point** makes it the pivot, keeping the games and worlds.

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

- The view is text: every marking is written out in words ("Told differently", "Not reached yet"), so colour and shape are never the cue and there is no legend to learn.
- Every moment is a button; the stages, the turning point and each game's line are landmarks named by their headings.
- On narrow screens the games' lines stack; nothing scrolls sideways.

## 7. Later

- World branch points (`branchesFrom`) aren't recorded yet, so world lines fork at the pivot. Once they are, a world could fork at its own branch event.
- Causal structure (`caused`, `sub_event_of`) could thin the trunk to the events that lead to the pivot, rather than everything before it, once the dataset is large enough to need it.
