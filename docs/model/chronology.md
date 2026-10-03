# Chronology

- **Status:** Accepted
- **Date:** 2026-09-27

How the project stores **time**. There are three separate orders, and the timeline can show any of them:

| Order                | Question                                       | Stored on                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------------------- |
| **In-universe time** | When does it happen in the world of the story? | The event (`when`), overridable per appearance |
| **Play order**       | Where in the game does the player see it?      | The appearance's depictions                    |
| **Release order**    | Which game came out first?                     | The title (`order`)                            |

Flashbacks are where these disagree most: the Nibelheim incident happens years before the story begins, but the player sees it in Kalm.

## 1. The year axis

_Final Fantasy VII_ gives almost no calendar dates. Its time references are **relative** — "five years ago", "thirty years ago", "2,000 years ago". So the project does not invent a calendar:

- **Year 0 is the year the main story begins** (the bombing of Mako Reactor 1).
- Earlier years are negative: something stated as "five years ago" is `{ year: -5 }`.
- Relative statements are converted to this axis once, when the fact is entered, and the conversion goes in the notes if it isn't obvious.

## 2. Dates

A date is one of two forms:

```yaml
{ year: -5 }                               # that year
{ year: -2000, approx: true }              # stated as a round or approximate figure
{ between: [{ year: -30 }, { year: -25 }] } # known only to lie within a range
```

- `approx: true` marks a figure the title itself gives loosely ("about 2,000 years ago"). It sorts as the stated year and displays as "~2,000 years before".
- `between` is for ranges the data derives (usually `inferred`, with notes showing the derivation).
- **No months or days.** The games never give them, so the model doesn't have them.
- Every date resolves to an inclusive range `[earliest, latest]` of years; all sorting and filtering use it.

## 3. Ordering within the same year

Most of the main story — from the first reactor bombing to the end — happens within a short time, so almost every main-story event is in year 0. Dates alone can't order them.

- Events carry an integer **`seq`** that orders them within the same resolved range.
- Space values by 10 (`10`, `20`, `30`…) so new events can be inserted without renumbering.
- Full sort order: **(earliest, seq, id)**.
- The validator **warns** when two events with the same resolved range both lack a `seq`.

`before`/`after` relationships are **not** stored — order comes from dates plus `seq`. (`caused` is a different thing; see `model/relationships.md`.)

## 4. Spans

```yaml
when: { start: { year: -5 }, end: { year: -1 } }
```

`when` is either a single date (a moment) or `{ start, end }` (a span). `end` must not resolve earlier than `start`.

## 5. When titles disagree about time

In-universe time lives on the **entity**, because usually all titles agree. When a title places an event at a different time:

- its appearance carries its own `when`, which overrides the entity's for that title; **and**
- the entity records a difference with `category: chronology` (`model/appearances.md` §5).

The validator rejects an override without a `chronology` difference for that title, so the timeline and the comparison view can't disagree. (A `chronology` difference can also exist without an override — for example when titles only reveal the event in a different order.)

## 6. Eras and the time scale

The story spans thousands of years, but nearly everything happens in year 0. A linear axis would squash the main story into a sliver, so the in-universe timeline uses **eras**:

- Eras are project-defined and live in `data/reference/eras.yaml` (Phase 1).
- Each era has an ID (`era_<slug>`), a name, a start year, an end year, and a **display weight** — its share of the timeline's width.
- Eras are contiguous, don't overlap, and together cover every date in the dataset. The validator enforces this.
- Within an era, time is linear; across eras, width follows weight, not duration.
- Within year 0, events are spaced by `seq`, not by time.

Provisional list — **boundaries to be verified in Phase 1**:

| Era               | Covers                                     | Weight |
| ----------------- | ------------------------------------------ | ------ |
| The distant past  | The Cetra and the arrival of Jenova        | small  |
| Shinra's rise     | The Jenova Project, the Wutai War, SOLDIER | medium |
| Five years before | The Nibelheim incident and its aftermath   | medium |
| The main story    | Year 0                                     | large  |
| After the story   | Epilogues                                  | small  |

## 7. Play order

Where the player sees something is its appearance's **play position** (`model/appearances.md` §4): a locator plus an optional `seq`. Play order within a title sorts by:

1. disc and segment order (`og`) or chapter (Remake series);
2. `seq`;
3. ID.

Segment order for `og` comes from the segment list in `data/reference/`.

## 8. Timeline views

The timeline is written for someone new to the story ([ADR 0019](../decisions/0019-timeline-for-beginners.md)).

- **As it happened** (default) — the story top to bottom in chapters: before the story by era (§4), the story itself (year 0) by arc, anything after by era. Each event shows, for each chosen title, whether it shows the event, only mentions it, or leaves it out. A title's `when` override (§5) always comes with a chronology difference, and those are listed with the event's other changes when it's opened.
- **As you play it** — one chosen title's events, numbered in its play order (§7). Shows where the title chooses to reveal things: flashbacks jump back in time.
- Both views keep the same selection, so switching views keeps the context.

## 9. Summary for the Phase 1 schema

```ts
type Year = { year: number; approx?: boolean };
type InUniverseDate = Year | { between: [Year, Year] };
type When = InUniverseDate | { start: InUniverseDate; end: InUniverseDate };

// Event entity:  when: When (required); seq?: number
// Appearance:    when?: When   (override; requires a chronology difference)
// Depiction:     at: Locator; seq?: number; primary?: boolean
```
