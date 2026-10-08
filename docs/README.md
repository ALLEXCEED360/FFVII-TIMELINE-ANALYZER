# Docs

The rules the data and code follow. When one disagrees with the code, fix one of them.

## The model

Read in this order:

| Doc                                                        | What it covers                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| [`canon-and-sources.md`](canon-and-sources.md)             | Each game as its own canon; how facts are checked and cited   |
| [`model/titles-and-worlds.md`](model/titles-and-worlds.md) | Titles (which game) and worlds (branches in the story)        |
| [`model/appearances.md`](model/appearances.md)             | How each game presents a thing; statuses, depictions, changes |
| [`model/chronology.md`](model/chronology.md)               | In-story time, play order and eras                            |
| [`model/relationships.md`](model/relationships.md)         | The kinds of link and which games establish them              |
| [`conventions/ids.md`](conventions/ids.md)                 | How IDs are formed                                            |
| [`model/spoilers.md`](model/spoilers.md)                   | The spoiler policy: one notice, then everything               |
| [`features/divergence.md`](features/divergence.md)         | Where the games part ways, and what each marking means        |
| [`design.md`](design.md)                                   | How the web app looks and behaves                             |

The research log — every source used and every open question — is data, in [`data/research/`](../data/research/).

## Decisions

| #    | Decision                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 0001 | [Internal packages export TypeScript source](decisions/0001-internal-packages-as-typescript-source.md) |
| 0002 | [Pin TypeScript to 6.0.x](decisions/0002-pin-typescript-6.md)                                          |
| 0003 | [Run TypeScript directly on Node](decisions/0003-run-typescript-natively-on-node.md)                   |
| 0004 | [Data files are the source of truth](decisions/0004-data-files-are-the-source-of-truth.md)             |
| 0005 | [Database schema](decisions/0005-database-schema.md)                                                   |
| 0006 | [API design and deployment](decisions/0006-api-design.md)                                              |
| 0007 | [Web app architecture](decisions/0007-web-app.md)                                                      |
| 0008 | [Explorer and search](decisions/0008-explorer-and-search.md)                                           |
| 0009 | [The comparison view](decisions/0009-comparison-view.md)                                               |
| 0010 | [The relationship network](decisions/0010-network.md)                                                  |
| 0011 | [The divergence view](decisions/0011-divergence.md)                                                    |
| 0012 | [The archive and sources](decisions/0012-archive-and-sources.md)                                       |
| 0013 | [Hardening: end-to-end tests, accessibility and performance](decisions/0013-hardening.md)              |
