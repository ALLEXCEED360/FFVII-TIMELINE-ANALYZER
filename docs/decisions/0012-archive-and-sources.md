# 0012 — The archive and sources

- **Status:** Accepted
- **Date:** 2026-09-28
- **Builds on:** [0004](0004-data-files-are-the-source-of-truth.md), [0005](0005-database-schema.md), [0006](0006-api-design.md)

## Context

Blueprint §16 asks for a source table associated with events, differences and entity records, a research log that distinguishes verified facts, interpretation, unresolved questions and future content, and an ARCHIVE section: "structured catalog and sources" (§20). The outline for this phase: pages for the source catalogue and the research log, linking every fact to its citation.

This project already cites every fact by **locator**, the disc and segment or chapter of the title that shows it (`canon-and-sources.md` §5), and [0006](0006-api-design.md) decided that sources needed no endpoint of their own. The research log existed only as two Markdown files in `docs/research/`.

## Decision

### The titles are the sources

A citation's source is a **unit of a title**: one of the original's story segments, a chapter, or an unnumbered part such as Rebirth's interlude. There is no separate source table of games. Instead, every unit becomes a source page listing everything that cites it. This is the blueprint's source association, read from the source's side.

- The seed script writes a derived **`citations`** table: one row per locator in the dataset (appearance and depiction locators, both sides of each difference, each title's evidence for a relationship, world evidence), keyed by `(title, unit)` with `unitOf(locator)`. Nothing new is stored in `data/`.
- An API test checks the catalogue counts exactly the dataset's locators, and that every unit's page lists facts if and only if the catalogue says it's cited.

### The research log is data

`docs/research/source-log.md` and `open-questions.md` moved into validated data files:

- **`data/research/sources.yaml`**: each source used (`src_<slug>`), with its kind, role (`evidence` or `locating`), the titles it covers, what it was used for, URL and access date. Only play, footage and transcripts may be evidence; the validator rejects a walkthrough marked as evidence.
- **`data/research/open-questions.yaml`**: each open question (`question_<slug>`), with its kind (needs footage, not yet in the dataset, structure), the entities and worlds it concerns, and where to look.

As data, the log is checked (unknown entity IDs, worlds and segments are errors), seeded into Postgres, served by the API and shown on the pages it's about. The Markdown files became pointers. Both files are optional, so a dataset without a research log still loads.

### API

| Endpoint                    | Purpose                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /sources`              | Every unit of every title in play order, with citation and subject counts                                |
| `GET /sources/:title/:unit` | One unit, its neighbours, and every appearance, difference, relationship and world that cites it         |
| `GET /research`             | Research sources, open questions, facts by certainty, and every inferred or ambiguous fact with its note |
| `GET /entities/:id`         | Now also returns `openQuestions` about the entity                                                        |

### Web

- **`/archive`**: each title as a source (structure, what it retells, a strip of its units shaded by how much cites them), the research log in brief, the dataset by kind and certainty, and future content (Revelation after release; Crisis Core and Dirge of Cerberus after v1).
- **`/archive/<title>`**: every unit, the original's grouped by disc, with arc, the Remake-series titles that retell it, and citation counts.
- **`/archive/<title>/<unit>`** (`/archive/og/kalm`, `/archive/remake/chapter-8`, `/archive/rebirth/interlude`): what the unit shows, grouped by kind, with statuses, framings and scenes; differences, relationships and worlds cited there; open questions that point to it; links to the previous and next units.
- **`/archive/research`**: evidence levels, facts by certainty, evidence and locating sources, open questions by kind, and every inferred or ambiguous fact with its explanation.
- **Every citation is a link.** Appearance cards, difference lists and the comparison view render locators as links to their unit (`Citation` component), and entity pages list their open questions.

This covers the blueprint's four categories: verified facts (stated), interpretation (inferred or left open, each with its note), unresolved questions (open questions), and future content (titles still to come, and "not yet reached" throughout).

## Consequences

- ✅ Any fact can be traced to its place in the game, and any place in the game shows everything the dataset says about it.
- ✅ The research log can't drift from the data. A question about a removed entity fails validation.
- ✅ No new stored facts; the citations index is rebuilt with everything else.
- ❌ Verification is recorded per source, not per fact: the log says which sources were used for what, not which source checked each fact. Per-fact verification would multiply the data entry work; revisit if a fact's evidence is ever disputed.
- ❌ Relationship evidence still shows as tooltips on entity pages; its citations are browsable from the unit pages.
