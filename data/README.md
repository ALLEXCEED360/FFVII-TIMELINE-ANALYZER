# Data

The dataset — the source of truth for the whole app (decision [0004](../docs/decisions/0004-data-files-are-the-source-of-truth.md)). The database is rebuilt from these files; never edit it directly.

**The rules live in [`docs/`](../docs/README.md).** Read `canon-and-sources.md` and `model/appearances.md` before adding anything.

## Layout

```
data/
├── characters/      one file per character      character_<slug>.yaml
├── events/          one file per event          event_<slug>.yaml
├── locations/       one file per location       location_<slug>.yaml
├── organizations/   one file per organization   organization_<slug>.yaml
├── reference/
│   ├── og-segments.yaml   the original's story segments, in play order
│   ├── coverage.yaml      which segments each Remake-series title retells
│   ├── arcs.yaml          project-defined story arcs
│   ├── eras.yaml          the timeline's eras
│   └── worlds.yaml        in-story worlds
├── research/
│   ├── sources.yaml         every source used to find or check facts
│   └── open-questions.yaml  facts awaiting a stronger check, and gaps
└── id-redirects.yaml      retired IDs
```

## An entity file

Everything about an entity lives in its own file: its title-neutral facts, one **appearance** per title (and world), the **differences** between titles, and the **relationships** it is the source of.

```yaml
id: event_example # must match the file name
name: Example
summary: One or two title-neutral sentences.
when: { year: 0 } # events only — see docs/model/chronology.md
seq: 10
importance: 2
arc: arc_midgar

appearances:
  - title: og
    status: depicted # depicted | referenced | omitted
    summary: How this title presents it, in our own words.
    depictions:
      - { at: { title: og, disc: 1, segment: og_reactor_1 }, framing: direct }
    sources:
      - { title: og, disc: 1, segment: og_reactor_1, scene: "optional pointer" }
    certainty: stated # stated | inferred | ambiguous (the last two need `notes`)

differences:
  - key: short_slug
    from: { title: og }
    to: { title: remake }
    category: presentation
    magnitude: minor
    summary: "In OG …; in Remake …"
    sources: […] # cite both titles
    certainty: stated

relationships:
  - type: occurred_at
    target: location_midgar
    titles:
      og: { sources: […], certainty: stated }
```

Citations use the smallest official unit: `{ title: remake, chapter: 8 }`, `{ title: rebirth, part: interlude }`, or `{ title: og, disc: 1, segment: og_kalm }` for the original (segments are listed in `reference/og-segments.yaml`).

## Checking your work

```bash
pnpm validate
```

This checks every file against the schemas and every cross-file rule in the docs: IDs, citations, segments and discs, coverage, worlds, relationship kinds and title scopes, cycles, eras and ordering. It prints warnings for data gaps (important events a covering title has no appearance for).

Run `pnpm schemas` after changing a Zod schema, so VS Code's YAML autocomplete stays current.
