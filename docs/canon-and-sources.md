# Canon and sources

- **Status:** Accepted
- **Date:** 2026-09-27

The rules every fact in the Timeline Analyzer must follow. When a question comes up that these rules don't answer, decide it once, add it here, and apply it everywhere.

## 1. Every title is its own canon

Unlike a single-canon project, this project **never decides which version of the story is "true"**. The 1997 original and the Remake series tell the story differently, and those differences are what the app exists to show.

- A fact always belongs to the **title(s)** that establish it (see `model/titles-and-worlds.md`).
- Two titles disagreeing is **not a contradiction** — it is a **difference**, and it is recorded as one (see `model/appearances.md` §5).
- Only facts that hold in _every_ title where the entity appears go on the entity itself (its name, its kind). Everything else lives on the entity's per-title **appearance**.

## 2. Scope

| Source                                                                | In v1?           |
| --------------------------------------------------------------------- | ---------------- |
| _Final Fantasy VII_ (1997)                                            | ✅ Yes           |
| _Final Fantasy VII Remake_ (2020), including the _Intergrade_ release | ✅ Yes           |
| _FFVII Remake Intergrade — Episode INTERmission_ (2021)               | ✅ Yes           |
| _Final Fantasy VII Rebirth_ (2024)                                    | ✅ Yes           |
| _Crisis Core_ (and _Reunion_), _Dirge of Cerberus_                    | ⏳ After v1      |
| _Final Fantasy VII Revelation_ (announced for 2027)                   | ⏳ After release |
| _Advent Children_, _Before Crisis_, mobile games, novels              | ❌ No            |
| Official guidebooks (_Ultimania_ etc.) and developer interviews       | ❌ No            |
| Fan wikis, fan theories, fan chronologies                             | ❌ No            |

Guidebooks and interviews are excluded to keep the rule simple: **if a title doesn't show or say it, it isn't in the dataset.** A title added later brings its own facts and never rewrites another title's.

## 3. Language and edition

- Facts are verified against each title's **official English release**.
- The original's 1997 localization and later re-releases share one script for our purposes. Where a later re-release changed a line or name, the re-release wins and the change goes in the fact's notes.
- Where an English line is ambiguous and the ambiguity matters, the Japanese text may settle it; say so in the notes.

## 4. Verification

A fact goes into `data/` only after it has been **checked against the game itself**. Acceptable evidence, best first:

1. **Playing the scene** in the game.
2. **Recorded footage** of the scene (full playthroughs, cutscene compilations).
3. **Script transcripts** of in-game text — acceptable for _what is said_, but check anything visual against footage.

Wikis and fan resources may be used **only to locate** a fact (which chapter, which scene). They are never the evidence.

**Status of the v0.1 dataset (2026-09-27):** every fact was checked against full script transcripts (level 3) — see the research log in `data/research/sources.yaml`. Where a fact depends on what is _shown_ rather than said, it came from the transcripts' stage directions and is listed in `data/research/open-questions.yaml` for checking against footage before v1.0.

**The research log** (`data/research/`, decision [0012](decisions/0012-archive-and-sources.md)) records every source used, whether it is evidence or only used to locate, and every open question. It is validated with the dataset and shown at `/archive/research`.

## 5. Citations

Every fact cites **at least one locator** in the title that establishes it. A locator is the smallest official unit of that title:

| Title          | Locator                                     | Example                                    |
| -------------- | ------------------------------------------- | ------------------------------------------ |
| `og`           | Disc + story segment (project-defined, §10) | `{ title: og, disc: 1, segment: og_kalm }` |
| `remake`       | Chapter (1–18)                              | `{ title: remake, chapter: 8 }`            |
| `intermission` | Chapter (1–2)                               | `{ title: intermission, chapter: 2 }`      |
| `rebirth`      | Chapter (1–14), or the unnumbered interlude | `{ title: rebirth, chapter: 12 }`          |

Unnumbered parts of a chaptered title are cited by `part` — so far only _Rebirth_'s opening "Interlude: A World Apart": `{ title: rebirth, part: interlude }`. Parts are listed with their titles in the shared package.

- A locator may add a free-text `scene` ("the Kalm inn flashback") to help a reader find the moment. Video timestamps and links go in notes only — they rot.
- Cite the locator(s) that **show or state** the fact most clearly. A fact may cite several.
- Optional side content (side quests, optional scenes, collectible text) is cited by the chapter or segment in which it becomes available, and marked `optional: true`.

## 6. Certainty

Every fact has one of three certainty levels:

| Level       | Meaning                                                       | Requirements                                                                          |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `stated`    | The title directly shows or says it.                          | Citation(s).                                                                          |
| `inferred`  | Derived from stated facts; the title doesn't say it outright. | Citations for every stated fact it's derived from, plus a note showing the reasoning. |
| `ambiguous` | The title presents it but deliberately leaves it open.        | Citation(s), plus a note describing exactly what is shown and what is left open.      |

`ambiguous` exists because the Remake series leaves some things open on purpose (for example, what different characters perceive at the end of _Rebirth_). The dataset records **what is shown** and marks it ambiguous; it never resolves the ambiguity with a theory. Inferred facts must be derivations, not guesses — if it needs speculation, it doesn't go in.

## 7. Unreliable accounts

Some scenes are deliberately false or distorted _within_ a title — the best-known is Cloud's account of the Nibelheim incident, which the original later reveals to be wrong.

- A title's facts record **what that title ultimately reveals to be true**.
- The false or distorted version is still recorded, as a **depiction** with `framing: false_account` (see `model/appearances.md` §4), so the app can show both and compare them.

## 8. Contradictions within one title

1. Prefer the **most specific** statement.
2. If equally specific, prefer the **later** one in play order.
3. **Always** record the conflict in the notes, citing both. Never pick a side silently.

## 9. Names and identity

**Spelling.** The display name is the **current official English spelling** (the Remake series' spelling): **Aerith Gainsborough**, not _Aeris_. Every other official or widely used spelling is stored as an **alias**, so search finds it.

**Identity.** One individual is one entity, across every title and every in-story world:

- Cloud in the original, in _Remake_ and in _Rebirth_ is one entity with three appearances.
- A character shown in more than one in-story world (see `model/titles-and-worlds.md` §3) is still one entity; the world is a property of the appearance, not a separate entity.

Characters introduced by the Remake series (for example Roche or Chadley) are entities like any other — they simply have no `og` appearance.

## 10. Project-defined structure

Two structures are defined by this project, not by the games, and live in `data/reference/` (Phase 1):

- **Original story segments.** The original has no chapters, so the project divides it into named, non-overlapping segments in play order (Midgar, Kalm, …), each on one disc. They exist only to make citations precise.
- **Arcs.** Named story arcs, each defined by its range of original segments and the Remake-series chapters that cover it. Arc names are fan conventions, not official.

## 11. Writing and IP rules

- **All descriptions are written in our own words.** Never copy text from wikis — Fandom text is CC BY-SA, which is incompatible with this project's CC BY-NC data licence.
- Direct quotes are limited to a short phrase, only when the exact wording matters to a comparison, and always cited.
- **Differences are described neutrally**: "In X … ; in Y …". Never judge which version is better.
- **Artwork.** Official Square Enix artwork (key art, character renders, promotional images) may be used in the web app as decoration, under these rules:
  - Artwork is never a source of facts.
  - Every image is listed in an art manifest in the web app, with its source, and credited on a Credits page.
  - No game files are extracted (models, textures, music, audio). No music is used.
  - Artwork is not covered by this project's licences and is removed on request of the rights holder.
- Unverified facts never go into `data/` as facts. Open questions about them go in `data/research/open-questions.yaml`.
