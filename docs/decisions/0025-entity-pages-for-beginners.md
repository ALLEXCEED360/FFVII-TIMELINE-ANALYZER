# 0025 — Character, moment, place and group pages, for someone meeting the story for the first time

- **Status:** Accepted
- **Date:** 2026-10-06
- **Builds on:** [0008](0008-explorer-and-search.md), keeping its URLs and data; [0021](0021-compare-for-beginners.md), [0023](0023-network-for-beginners.md) and [0024](0024-explore-for-beginners.md), whose pieces, plain words and materia colours it shares.

## Context

The owner asked to fix the individual pages for characters, moments, groups and so on. They still had the earlier design: a Bodoni title, a breadcrumb, "Appears in" chips struck through for absent titles, buttons named "Compare titles", "Network" and "Divergence", the figure on a slanted halftone plate beside a paper card, and sections "In each title" (one card per title and world, with the data's own words: _Depicted_, _Referenced_, _Inferred_), "Differences between titles", "Connections" (rows of "took part in" with diamonds per title) and "Open research questions".

## Decision

**The top:**

- The kind with its materia orb (_Person_, _Moment_, _Place_, _Group_), and **★ Key moment** for the story's key moments.
- The name, what it's also called, and for a moment when it happens and in which part of the story (_5 years before the story · The Journey Begins_).
- Its summary, then each game in words: _OG — Appears_, _Remake — Only mentioned_, _INTERmission — Not in this game_.
- **Where next:** _Compare the games side by side_, _See the web of links_, _See where the stories split_, _Show on the timeline_ (each only where it applies).
- Beside it, a person's figure standing in a ring of their materia's light, with the original's artwork on a card (_The original, 1997_) and which game the look is from; for anything else, its picture, framed and whole. The backdrop is fainter where the same picture is shown at the top, and the explore section's art where there's none.

**Below:**

- For a moment, **Just before** and **Just after**, in story order.
- **How each game tells it** (for a moment) or **In each game**: one panel per game, in the compare section's words — how it's shown, its part, its account, and where in the game — with another world's telling inside its game's panel. A game without it says so.
- **What changes between the games:** the compare section's changes, by kind.
- **Connections:** grouped by what's at the other end (People, Moments, Places, Groups), each link read from this end as in the web of links (_Took part in_, _Comes from_, _Member of_), each a chip with the person's face or the kind's orb. A link only one game shows says _only in Rebirth_; one a game leaves open says _Left open_.
- **Still being checked:** the open research questions, with where to look.

The old `AppearanceCard` and `DifferenceList` go; the compare section's `Telling` is shared.

## Consequences

- ✅ A newcomer reads who or what it is, in which games, and how it's linked, without a legend or the data's terms.
- ✅ The page matches the compare, network and explore sections it links to.
- ❌ Each telling shows one place in the game, not every scene it's cited for; the full trail is in the archive.
