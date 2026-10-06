# 0021 — The compare section, for someone meeting the story for the first time

- **Status:** Accepted
- **Date:** 2026-10-05
- **Builds on:** [0009](0009-comparison-view.md), keeping its data and URLs and replacing its pages; [0019](0019-timeline-for-beginners.md) and [0020](0020-modern-look.md), whose plain words and modern look it follows.

## Context

The owner moved on from the timeline to the compare section, asking for the same overhaul: beginner-first, in the modern look. The landing page listed every documented difference under jargon ("Version analysis", "entity", categories such as _Presentation_ and _Context_), offered a long drop-down of entities and two rows of preset buttons, and cited every difference in monospaced locators. The comparison page labelled each title _Depicted_, _Changed_ or _Not yet reached_, and ended in a matrix of ✓, — and · with no key.

## Decision

**Plain words, shared** (`lib/plain.ts`): what a game does with something (_Shows it_, _Only mentions it_, _Leaves it out_, _Not in this game_, _Hasn't reached this part yet_), a sentence for each where there's room, how an event is told (_Shown in a flashback_, _Shown, but as a false memory_ — moved here from the timeline), and the kinds of change (_How it's shown_, _Who's there_, _Where it happens_, _When it happens_, _How it ends_, _Someone's part in it_, _Relationships_, _What surrounds it_, _Gameplay_). The data and the API keep their own terms.

**The compare page** (`/compare`, same query parameters):

- One sentence: the Remake series retells the original, not always the same way; pick the games to see what changes, or open anything side by side.
- **Which games:** the usual pairs as large buttons, each with its games' colours, and each game on its own beneath (two at least).
- **What changes:** the kinds of change as choices, each with how many it holds, offering only those that occur; and _Big changes only_. Every kind is fetched at once, so the counts are real.
- **The changes**, grouped by the moment, person or place they belong to, each a panel: its two games (_OG → Rebirth_), the change in plain words, _Big change_ and _The game leaves this open_ where they apply, and where to see it in small type beneath. Each panel opens its side-by-side view.
- **Compare anything side by side:** a search box across everything told by two games or more, or a list by kind (events, characters, places, groups) with the games that tell each — in place of the drop-down.
- On a wide screen: choices, changes, and the search in three columns; narrower, the choices and the search share the left.

**One thing side by side** (`/compare/:kind/:slug`):

- Its name and summary, and links to see it on the timeline and to everything about it. Its scene is the page's backdrop, so the header is words alone.
- The same game choices, in a row.
- **A panel per game**, edged in its colour: what the game does with it, _Told differently_ where it changes, the original's and the new look of a character where there's artwork of both, and the game's own account — for an event, how it's told; a role where there is one; _The game leaves this open_; where in the game, linked to the archive; and any other world's version. On a phone, one game at a time in tabs.
- **What changes**, by kind, in plain words; beside it on a wide screen, **Connections**: what it's linked to and in which games, with a key — ✓ the game shows this connection, — it shows both but not connected, · it doesn't show both — and _In every game_ or _Differs between games_.

Shared pieces move to `components/modern.css`: the page heading and guide (`.m-title`, `.m-intro`), the pill choices (`.m-choice`, now also lit for a selected tab), the small outlined links (`.m-pill-link`) and the arrowed rows (`.m-row-link`). The earlier title selector stays in `features/compare/parts.tsx` for the divergence pages until they are redone.

## Consequences

- ✅ A newcomer can see what changed between two games without learning the archive's vocabulary, and find anything to compare by typing its name.
- ✅ Every claim still shows where to see it in the games, just quietly.
- ❌ The categories' plain names differ from the data's (and the API's) names; `lib/plain.ts` is the one place that maps them.
