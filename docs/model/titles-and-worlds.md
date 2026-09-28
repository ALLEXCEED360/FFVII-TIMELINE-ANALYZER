# Titles and worlds

- **Status:** Accepted
- **Date:** 2026-09-27

The blueprint used one word — "version" — for two different things. This project keeps them apart:

| Concept   | Question it answers                              | Examples                                  |
| --------- | ------------------------------------------------ | ----------------------------------------- |
| **Title** | _Which game shows this?_ (real world)            | `og`, `remake`, `rebirth`                 |
| **World** | _Which branch of reality is this in?_ (in-story) | `world_main`, a world where Zack survives |

Every appearance of an entity has exactly one title and one world.

## 1. Why the distinction matters

- The **title** axis is what the comparison view compares: how the 1997 original and the Remake series present the same thing.
- The **world** axis only exists _inside_ the Remake series, which shows more than one branch of reality. It is part of that story, not a difference between releases.

The Divergence view (`features/divergence.md`) uses both: titles parting ways is one kind of divergence, worlds branching is another.

## 2. Titles

A title is a released game. Titles are reference data with fixed codes.

| Code           | Title                                            | First release | Series   | Structure   | Covers (in original-story terms)               |
| -------------- | ------------------------------------------------ | ------------- | -------- | ----------- | ---------------------------------------------- |
| `og`           | _Final Fantasy VII_                              | 1997-01-31    | original | 3 discs     | The whole story                                |
| `remake`       | _Final Fantasy VII Remake_ (incl. _Intergrade_)  | 2020-04-10    | remake   | 18 chapters | Midgar                                         |
| `intermission` | _FFVII Remake Intergrade — Episode INTERmission_ | 2021-06-10    | remake   | 2 chapters  | A side story set in Midgar, alongside `remake` |
| `rebirth`      | _Final Fantasy VII Rebirth_                      | 2024-02-29    | remake   | 14 chapters | Kalm to the Forgotten Capital                  |

Planned after v1: `crisis_core`, `dirge`, and `revelation` (the final part of the Remake series, announced for 2027).

Each title records:

- `code`, `name`, `shortName` (for UI labels: OG, Remake, INTERmission, Rebirth), `released`;
- `series` — `original` or `remake`;
- `order` — its position in release order;
- `units` — how it's divided (discs + segments, or numbered chapters), used to validate citations;
- **`coverage`** — for Remake-series titles, the range of original-story segments it retells (§4).

## 3. Worlds

A world is an in-story branch of reality.

- **`world_main`** is the default. Every appearance is in `world_main` unless it says otherwise. The original (`og`) only ever uses `world_main`.
- The Remake series shows at least one other world — beginning with the ending of `remake`, where Zack survives the fight on the outskirts of Midgar, and continuing in `intermission`'s post-credits scene and `rebirth`. The list lives in `data/reference/worlds.yaml`; so far it holds `world_zack_survives`. Nothing is added until it's verified.
- Each world records: `id`, `name`, `firstShown` (a citation), `branchesFrom` (the event where it diverges, if the title makes that clear), `certainty`, and `notes`.
- Where a title leaves it unclear which world a scene belongs to, the appearance uses the best-supported world and is marked `certainty: ambiguous` with a note (`canon-and-sources.md` §6).

## 4. Coverage and "not yet reached"

The Remake series retells the original in parts, and the final part isn't out. So an original event missing from the Remake series can mean two very different things:

| Situation                                               | Status            | Stored or derived?                                       |
| ------------------------------------------------------- | ----------------- | -------------------------------------------------------- |
| The Remake series hasn't reached that part of the story | `not_yet_reached` | Derived from coverage                                    |
| The Remake series covered that part and left it out     | `omitted`         | **Stored**, with citations of the chapters that cover it |
| The part is covered but nobody has entered the data yet | `undocumented`    | Derived                                                  |

Coverage is stored once per title in `data/reference/coverage.yaml`, as a range of original segments with optional `except` exclusions. Status derivation is defined in `model/appearances.md` §3.

**INTERmission has no coverage.** It is a side story, not a retelling of original events, so an original event missing from it is never `omitted`, `undocumented` or `not_yet_reached` — just absent.

## 5. Titles in the UI

- **Timeline lanes:** one lane per title, in release order. Shared events are connected across lanes.
- **Comparison columns:** `OG | Remake | Rebirth` by default. INTERmission appearances show inside the Remake column, labelled "INTERmission", because the episode is part of the _Intergrade_ release. Users can pick any two or more titles to compare.
- **Filters:** every view can be filtered to any set of titles.
- Title colours and labels are defined once in the shared package (Phase 1) and used everywhere.
