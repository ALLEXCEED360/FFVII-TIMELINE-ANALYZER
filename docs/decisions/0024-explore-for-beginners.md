# 0024 — Explore, as who's who and what's what

- **Status:** Accepted
- **Date:** 2026-10-06
- **Builds on:** [0008](0008-explorer-and-search.md), keeping its URL parameters; [0020](0020-modern-look.md) and [0023](0023-network-for-beginners.md), whose look, plain words and materia colours it shares.

## Context

The owner asked to move on to the explore page after the network overhaul. It still had the earlier design: an "Archive / Explore" title in Bodoni, slanted kind and title buttons ("Characters 20", "Locations 11"), a "Filter" box, and one alphabetical grid mixing every kind, each card marked with diamonds a newcomer can't read.

## Decision

- **Who's who, and what's what**, and one sentence: everyone you'll meet, every big moment, and every place and group in the story; tap any card to read about it.
- **Search**, **Show** (_Everything_, _People_, _Moments_, _Places_, _Groups_, each with its materia orb and count) and **In which game** (_Any game_ or one game) in one panel. The URL keeps `kind`, `title` and `q` as before.
- **Grouped by kind**, each under its name, count and a few words (_Everyone you'll meet_, _The story's big moments, in the order they happen_, _Where it all happens_, _Who belongs to what_).
- **Picture cards**, wholly links, edged in their kind's materia colour: people as portrait cards, moments, places and groups as painting cards (an orb where there's no picture). Each has its name, summary, the games that tell it _by name_, and a **Read more ›** pill.
- **Moments in story order**, each saying when it happens (_5 years before the story_, _During the story_), from the timeline.
- Nothing matching says so, with **Show everything**.
- The kinds' words and materia moved to `lib/kinds.ts`, the orb to `components/Orb.tsx`, and an entity's card picture to `pictureFor` in the art manifest, shared with the network section.

## Consequences

- ✅ A newcomer browses the cast by face and the story's moments in order, and reads which games tell each without a legend.
- ❌ The page also loads the timeline, for moments' order and dates; it is cached and shared with the timeline section.
