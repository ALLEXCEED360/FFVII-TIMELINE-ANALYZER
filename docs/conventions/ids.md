# ID conventions

- **Status:** Accepted
- **Date:** 2026-09-27

Every entity has one permanent ID. IDs are hand-written in `data/` and appear in relationships, API responses and URLs, so they must be **readable, permanent and collision-free**.

## 1. Format

```
<kind>_<slug>
```

```
character_cloud_strife    organization_shinra    event_nibelheim_incident    location_sector_7
```

- Lowercase ASCII letters `a–z`, digits `0–9`, and single underscores between words.
- The `<kind>` prefix **is** the entity's kind — data files don't repeat it in a separate field. Each file lives in its kind's folder (`data/characters/`, `data/events/`, …) and is named `<id>.yaml`.
- Keep the slug short — at most about five words.

Pattern (enforced by the Phase 1 schema):

```
^(character|event|location|organization|arc)_[a-z0-9]+(_[a-z0-9]+)*$
```

**Why readable slugs, not UUIDs:** the data is written by hand. `character_cloud_strife` can be typed, reviewed in a diff and searched; a UUID cannot.

## 2. Entity kinds

| Kind           | Represents                                                                  |
| -------------- | --------------------------------------------------------------------------- |
| `character`    | An individual being — person, creature or entity that acts as an individual |
| `event`        | Something that happens at a point or over a span of in-universe time        |
| `location`     | A place — region, city, district, building, or non-physical place           |
| `organization` | An organized group — company, department, military unit, movement, family   |
| `arc`          | A project-defined story arc (`canon-and-sources.md` §10)                    |

### Reference codes (not entities)

Some things are fixed lists rather than entities. They are not nodes in the graph and use their own formats:

| Thing                  | Format            | Examples                                  | Defined in                          |
| ---------------------- | ----------------- | ----------------------------------------- | ----------------------------------- |
| Title                  | short code        | `og`, `remake`, `intermission`, `rebirth` | `model/titles-and-worlds.md` §2     |
| In-story world         | `world_<slug>`    | `world_main`                              | `model/titles-and-worlds.md` §3     |
| Original story segment | `og_<slug>`       | `og_midgar`, `og_kalm`                    | `data/reference/` (Phase 1)         |
| Era                    | `era_<slug>`      | `era_main_story`                          | `model/chronology.md` §6            |
| Research source        | `src_<slug>`      | `src_wiki_og_script`                      | `data/research/sources.yaml`        |
| Open question          | `question_<slug>` | `question_zack_last_stand`                | `data/research/open-questions.yaml` |

## 3. Kind boundaries

Rules for things that could fit more than one kind:

- **Land vs. power.** A place is a `location`; the group that runs it is an `organization` — `location_shinra_building` vs. `organization_shinra`.
- **Sub-groups are organizations** linked with `part_of`: `organization_turks` and `organization_soldier` are `part_of` `organization_shinra`.
- **Sub-places are locations** linked with `part_of`: `location_sector_7` is `part_of` `location_midgar`.
- **Non-physical places are `location`s** — e.g. `location_lifestream`.
- **The Planet is not an entity.** Almost everything would link to it, which would make every entity two steps from every other.
- **One being in several forms is one `character`.** Different forms or bodies are described on the appearance, not split into entities. Where a title reveals that one character was acting through another's form, record it with the relationship types in `model/relationships.md`, not by merging entities.
- **Collective beings that act as one** (such as the Whispers of the Remake series) are a single `character`.
- **Monsters, bosses, summons, weapons and materia** are not entities in v1, unless they are also a character in the story.

When a new ambiguous case appears, decide it once and add it to this list.

## 4. Building a slug

1. Start from the entity's **display name** (`canon-and-sources.md` §9).
2. Transliterate to ASCII (drop accents).
3. Lowercase.
4. Remove punctuation — `Cait Sith` → `cait_sith`, `Wall Market` → `wall_market`.
5. Replace spaces and hyphens with `_`; collapse repeats.
6. Drop a leading "the".
7. Numbers stay as digits — `location_sector_7`, `event_mako_reactor_1_bombing`.

**People** use their full name where one is known: `character_barret_wallace`, `character_aerith_gainsborough`. Characters with only one name use it alone: `character_sephiroth`.

**Events** are named after what happened, never after where they appear in a game: `event_nibelheim_incident`, not `event_rebirth_ch1`.

**Clashing names:** when two entities would produce the same or confusingly similar slugs, **both** get a qualifier — neither keeps the bare name.

## 5. No spoiler rule for IDs

The source material is decades old and the app treats spoilers leniently (`model/spoilers.md`), so IDs simply use the best-known name. There is no "name it after its first appearance" rule.

## 6. Permanence

- **Until the first public deployment:** IDs may be renamed freely.
- **After it:** IDs are **permanent** and **never reused**. If an entity is merged, split or removed, its old ID is recorded in `data/id-redirects.yaml` (`old_id: new_id`, or `old_id: null` for removed entities) so existing links still resolve.
- Changing a display name **never** changes an ID.

## 7. Things without hand-written IDs

- **Appearances** are identified by **(entity, title, world)**.
- **Relationships** are identified by **(source, type, target, from)**.
- **Differences** are written inside their entity's file with a short `key` unique within that entity; their ID is `<entity id>:<key>`, e.g. `event_nibelheim_incident:framing`.

The seed script derives database IDs from these, and the validator rejects duplicates.

## 8. Enforcement

The Phase 1 validator (`pnpm validate`) checks that:

- every ID matches the pattern in §1, and its prefix matches its folder;
- no two entities share an ID;
- every reference in `data/` points to an existing ID, reference code or redirect;
- no two appearances share (entity, title, world); no two relationships share (source, type, target, from); no two differences in one entity share a key;
- no redirect points to another redirect or to a missing ID.
