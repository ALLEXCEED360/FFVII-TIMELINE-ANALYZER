# Docs

Design documents for the Timeline Analyzer. These are the rules the data and code must follow — when they disagree with the code, fix one of them.

**Suggested reading order:** canon → titles and worlds → appearances → chronology → relationships → IDs → spoilers → divergence.

## Design

| Doc                                                        | Purpose                                                            | Status   |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | -------- |
| [`canon-and-sources.md`](canon-and-sources.md)             | Per-title canon, scope, verification, citations, certainty, IP     | Done     |
| [`model/titles-and-worlds.md`](model/titles-and-worlds.md) | Titles (which game) vs. worlds (in-story branches); coverage       | Done     |
| [`model/appearances.md`](model/appearances.md)             | Entities, per-title appearances, statuses, depictions, differences | Done     |
| [`model/chronology.md`](model/chronology.md)               | In-universe time, play order, eras, timeline views                 | Done     |
| [`model/relationships.md`](model/relationships.md)         | Edge vocabulary, title scope, path weights                         | Done     |
| [`conventions/ids.md`](conventions/ids.md)                 | Entity kinds, reference codes, how IDs are formed                  | Done     |
| [`model/spoilers.md`](model/spoilers.md)                   | Lenient spoiler policy                                             | Done     |
| [`features/divergence.md`](features/divergence.md)         | The Divergence view                                                | Accepted |

## Research

The research log (sources used and open questions) is data, in [`data/research/`](../data/research/) — see [`research/`](research/README.md) and decision [0012](decisions/0012-archive-and-sources.md).

## Decisions

One short record per architecture decision, numbered in order.

| #    | Decision                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0001 | [Internal packages export TypeScript source](decisions/0001-internal-packages-as-typescript-source.md)                                     |
| 0002 | [Pin TypeScript to 6.0.x](decisions/0002-pin-typescript-6.md)                                                                              |
| 0003 | [Run TypeScript directly on Node](decisions/0003-run-typescript-natively-on-node.md)                                                       |
| 0004 | [Data files are the source of truth](decisions/0004-data-files-are-the-source-of-truth.md)                                                 |
| 0005 | [Database schema](decisions/0005-database-schema.md)                                                                                       |
| 0006 | [API design and deployment](decisions/0006-api-design.md)                                                                                  |
| 0007 | [Web app architecture and the first timeline](decisions/0007-web-app.md)                                                                   |
| 0008 | [Entity explorer and search](decisions/0008-explorer-and-search.md)                                                                        |
| 0009 | [The comparison view](decisions/0009-comparison-view.md)                                                                                   |
| 0010 | [The relationship network](decisions/0010-network.md)                                                                                      |
| 0011 | [The divergence view](decisions/0011-divergence.md)                                                                                        |
| 0012 | [The archive and sources](decisions/0012-archive-and-sources.md)                                                                           |
| 0013 | [Hardening: end-to-end tests, accessibility and performance](decisions/0013-hardening.md)                                                  |
| 0014 | [The design pass](decisions/0014-design-pass.md)                                                                                           |
| 0015 | [A game-menu design, with official artwork](decisions/0015-game-menu-design.md)                                                            |
| 0016 | [The title screen, engraved](decisions/0016-title-screen.md)                                                                               |
| 0017 | [The home menu, as the original's pause menu](decisions/0017-home-menu.md)                                                                 |
| 0018 | [Moving between sections, through one of the original's windows](decisions/0018-window-transition.md)                                      |
| 0019 | [The timeline, for someone meeting the story for the first time](decisions/0019-timeline-for-beginners.md)                                 |
| 0020 | [A modern look everywhere but the home menu, and no footer](decisions/0020-modern-look.md)                                                 |
| 0021 | [The compare section, for someone meeting the story for the first time](decisions/0021-compare-for-beginners.md)                           |
| 0022 | [The divergence section, for someone meeting the story for the first time](decisions/0022-divergence-for-beginners.md)                     |
| 0023 | [The web of links, for someone meeting the story for the first time](decisions/0023-network-for-beginners.md)                              |
| 0024 | [Explore, as who's who and what's what](decisions/0024-explore-for-beginners.md)                                                           |
| 0025 | [Character, moment, place and group pages, for someone meeting the story for the first time](decisions/0025-entity-pages-for-beginners.md) |
| 0026 | [The archive, as the games chapter by chapter](decisions/0026-archive-for-beginners.md)                                                    |
| 0027 | [Settings, as a Config screen in plain words](decisions/0027-settings-for-beginners.md)                                                    |
| 0028 | [The home menu: arrow keys and W A S D anywhere, and the chosen game's cover forward](decisions/0028-home-menu-keys-and-covers.md)         |
