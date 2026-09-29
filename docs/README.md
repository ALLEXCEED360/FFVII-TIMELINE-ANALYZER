# Docs

Design documents for the Timeline Analyzer. These are the rules the data and code must follow — when they disagree with the code, fix one of them.

**Suggested reading order:** canon → titles and worlds → appearances → chronology → relationships → IDs → spoilers → divergence.

## Design

| Doc                                                        | Purpose                                                            | Status |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| [`canon-and-sources.md`](canon-and-sources.md)             | Per-title canon, scope, verification, citations, certainty, IP     | Done   |
| [`model/titles-and-worlds.md`](model/titles-and-worlds.md) | Titles (which game) vs. worlds (in-story branches); coverage       | Done   |
| [`model/appearances.md`](model/appearances.md)             | Entities, per-title appearances, statuses, depictions, differences | Done   |
| [`model/chronology.md`](model/chronology.md)               | In-universe time, play order, eras, timeline views                 | Done   |
| [`model/relationships.md`](model/relationships.md)         | Edge vocabulary, title scope, path weights                         | Done   |
| [`conventions/ids.md`](conventions/ids.md)                 | Entity kinds, reference codes, how IDs are formed                  | Done   |
| [`model/spoilers.md`](model/spoilers.md)                   | Lenient spoiler policy                                             | Done   |
| [`features/divergence.md`](features/divergence.md)         | The Divergence view                                                | Draft  |

## Research

Working notes behind the dataset, in [`research/`](research/README.md): the [source log](research/source-log.md) and [open questions](research/open-questions.md).

## Decisions

One short record per architecture decision, numbered in order.

| #    | Decision                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 0001 | [Internal packages export TypeScript source](decisions/0001-internal-packages-as-typescript-source.md) |
| 0002 | [Pin TypeScript to 6.0.x](decisions/0002-pin-typescript-6.md)                                          |
| 0003 | [Run TypeScript directly on Node](decisions/0003-run-typescript-natively-on-node.md)                   |
| 0004 | [Data files are the source of truth](decisions/0004-data-files-are-the-source-of-truth.md)             |
| 0005 | [Database schema](decisions/0005-database-schema.md)                                                   |
| 0006 | [API design and deployment](decisions/0006-api-design.md)                                              |
| 0007 | [Web app architecture and the first timeline](decisions/0007-web-app.md)                               |
| 0008 | [Entity explorer and search](decisions/0008-explorer-and-search.md)                                    |
| 0009 | [The comparison view](decisions/0009-comparison-view.md)                                               |
| 0010 | [The relationship network](decisions/0010-network.md)                                                  |
