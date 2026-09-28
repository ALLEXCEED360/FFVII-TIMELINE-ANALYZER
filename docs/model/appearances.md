# Entities, appearances and differences

- **Status:** Accepted
- **Date:** 2026-09-27

The core of the data model, and the answer to the project's central question: **how do we store the same narrative entity across several versions of the story?**

```
entity (abstract)          event_nibelheim_incident
  └─ appearance            … in og       (world_main)
  └─ appearance            … in remake   (world_main)
  └─ appearance            … in rebirth  (world_main)
  └─ differences           og → rebirth: "…"
```

## 1. Entity

The abstract thing, independent of any title. It holds only what is true in **every** title where it appears (`canon-and-sources.md` §1):

| Field         | Required | Meaning                                                                             |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `name`        | ✅       | Display name (`canon-and-sources.md` §9)                                            |
| `aliases`     | —        | Other names and spellings, for search                                               |
| `summary`     | ✅       | One or two title-neutral sentences: what this is                                    |
| _kind fields_ | —        | Events: `when` (in-universe time, `model/chronology.md`), `importance` (1–3), `arc` |

One table per kind is **not** used. All kinds share one `entities` table (with a `kind` column), one `appearances` table and one `relationships` table. This keeps every foreign key real: a difference or relationship can point at any entity without "polymorphic" IDs that the database can't check.

## 2. Appearance

How one title presents the entity, in one world. Identified by **(entity, title, world)**.

| Field        | Required | Meaning                                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| `title`      | ✅       | Title code                                                                              |
| `world`      | —        | Defaults to `world_main`                                                                |
| `status`     | ✅       | `depicted`, `referenced` or `omitted` (§3)                                              |
| `summary`    | ✅       | How this title presents it, in our own words                                            |
| `depictions` | ✅ \*    | Where and how it is shown (§4). \*Not for `omitted`.                                    |
| `sources`    | ✅       | Citations (`canon-and-sources.md` §5)                                                   |
| `certainty`  | ✅       | `stated`, `inferred` or `ambiguous`                                                     |
| `when`       | —        | Only if this title places it at a different in-universe time (`model/chronology.md` §5) |
| `role`       | —        | Characters: their role in this title, in a short phrase                                 |
| `notes`      | —        | Reasoning, recorded contradictions, clarifications                                      |

In YAML, an entity's appearances are written in its own file:

```yaml
# data/events/event_nibelheim_incident.yaml   (illustrative — not verified data)
name: Nibelheim Incident
summary: …
when: { year: -5 }
appearances:
  - title: og
    status: depicted
    summary: …
    depictions:
      - { at: { title: og, disc: 1, segment: og_kalm }, framing: false_account }
      - { at: { title: og, disc: 2, segment: og_mideel }, framing: flashback }
    sources: [ … ]
    certainty: stated
  - title: rebirth
    …
differences:
  - key: framing
    …
```

## 3. Status

Only three statuses are **stored**, because only these are facts about a title:

| Stored status | Meaning                                                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `depicted`    | The title shows it on screen (as it happens, or as a full flashback).                                                                                                                                       |
| `referenced`  | The title only mentions it, or shows brief glimpses, without portraying it.                                                                                                                                 |
| `omitted`     | The title covers this part of the story and it does not appear. Must cite the chapters that cover it, and say why the absence was judged real (e.g. "the scene where it happens in `og` is replaced by …"). |

The UI also shows **derived** statuses, computed from coverage and the other appearances — never stored, so they can't go stale:

| Derived status    | Rule                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `new`             | The entity has a Remake-series appearance but no `og` appearance.                                                                    |
| `not_yet_reached` | No appearance in any Remake-series title, and the entity's `og` segment lies beyond the latest title's coverage.                     |
| `undocumented`    | No appearance in a title whose coverage includes the entity's `og` segment. (A data gap — the validator warns for `importance` ≥ 2.) |
| `changed`         | At least one difference (§5) targets this title's appearance.                                                                        |

"Expanded" and "altered" from the blueprint are not statuses: they are **differences** with a category, so they can say _what_ was expanded or altered.

## 4. Depictions

A depiction is one place in a title where the entity is shown or mentioned.

| Field     | Required | Meaning                                                  |
| --------- | -------- | -------------------------------------------------------- |
| `at`      | ✅       | A locator (`canon-and-sources.md` §5)                    |
| `framing` | ✅       | How it's presented — see below                           |
| `seq`     | —        | Orders several depictions in the same chapter or segment |
| `note`    | —        | One short line, e.g. "told by Cloud at the inn"          |

| Framing         | Meaning                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `direct`        | Shown as it happens, in the present of the story                                                           |
| `flashback`     | Shown as a memory or retelling that the title presents as accurate                                         |
| `false_account` | Shown as a memory or retelling that the title reveals to be false or distorted (`canon-and-sources.md` §7) |
| `vision`        | A vision, hallucination or other scene the title presents as not literally real                            |
| `mention`       | Told in dialogue or text only                                                                              |
| `glimpse`       | A brief flash of imagery, without a full scene                                                             |

An appearance's **play position** — where it sits in the title's play order — is its first depiction, unless another is marked `primary: true`.

## 5. Differences

A difference records **one specific way two titles present the same entity differently**. It is the unit the comparison view is built from.

| Field       | Required | Meaning                                                                           |
| ----------- | -------- | --------------------------------------------------------------------------------- |
| `key`       | ✅       | Short slug, unique within the entity (ID = `<entity>:<key>`)                      |
| `from`      | ✅       | Title (and optionally world) of the earlier presentation                          |
| `to`        | ✅       | Title (and optionally world) of the later presentation                            |
| `category`  | ✅       | One of the categories below                                                       |
| `magnitude` | ✅       | `minor` (detail, presentation) or `major` (changes what happens or what it means) |
| `summary`   | ✅       | One neutral sentence: "In X …; in Y …" (`canon-and-sources.md` §11)               |
| `sources`   | ✅       | Citations on **both** sides                                                       |
| `certainty` | ✅       | As for any fact                                                                   |
| `related`   | —        | Other entity IDs the difference involves (e.g. a character added to a scene)      |
| `notes`     | —        |                                                                                   |

Both `from` and `to` must have an appearance of the entity (with `status: omitted` allowed on `to`).

| Category       | Use for                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `presentation` | Staging, framing, length, level of detail — same content, shown differently |
| `participants` | Who is present or involved                                                  |
| `setting`      | Where it happens                                                            |
| `chronology`   | When it happens, or the order it's revealed in                              |
| `outcome`      | What happens as a result                                                    |
| `role`         | A character's function or characterization in the story                     |
| `relationship` | How two entities relate                                                     |
| `context`      | New or changed surrounding story, motives or meaning                        |
| `gameplay`     | How the player engages with it (playable section, minigame, boss fight)     |

**What is not stored as a difference:**

- An entity existing in one title and not another → derived from appearances (`new`, `omitted`).
- A relationship existing in one title and not another → derived from relationship title scopes (`model/relationships.md` §3).

Differences are for what can't be derived: _how_ the same thing is presented differently.

## 6. Validator rules (Phase 1)

- Every appearance's title is known; every citation's title matches its appearance's title (or, for differences, its `from`/`to`).
- `omitted` appearances have no depictions and cite at least one covering chapter.
- `omitted` is only allowed in a title whose coverage includes the entity's `og` segment.
- `world` other than `world_main` only in Remake-series titles.
- A difference's `from` and `to` are different titles (or the same title with different worlds), and both appearances exist.
- `certainty: inferred` and `certainty: ambiguous` have `notes`.
