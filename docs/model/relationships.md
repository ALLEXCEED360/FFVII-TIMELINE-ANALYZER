# Relationships

- **Status:** Accepted
- **Date:** 2026-09-27

The complete vocabulary of relationships (graph edges). A type that isn't in this document doesn't exist; adding one means adding a row here first.

## 1. Principles

1. **Store facts, derive the rest.** Anything computable from other data is not stored, so facts can't contradict each other.
2. **Only relationships a title establishes.** Every edge meets the certainty rules in `canon-and-sources.md` §6.
3. **No interpretive types.** `friend`, `enemy`, `ally`, `rival`, `loves` are readings of the story, and they shift. They are not in v1. (The blueprint's `ally`, `enemy` and `associated_with` are dropped for this reason; `follows` is derived from chronology; `references` is covered by depictions.)
4. **Avoid hubs.** A relationship that would connect almost everything to one node becomes an attribute instead.

## 2. Anatomy of an edge

| Field        | Required | Meaning                                                                  |
| ------------ | -------- | ------------------------------------------------------------------------ |
| `source`     | ✅       | Entity ID                                                                |
| `type`       | ✅       | One of the types in §4                                                   |
| `target`     | ✅       | Entity ID                                                                |
| `titles`     | ✅       | Which titles establish it — see §3                                       |
| `from`       | —        | In-universe start: a date or `{ event: <id> }` (time-bounded types only) |
| `until`      | —        | In-universe end: a date or `{ event: <id> }`                             |
| _attributes_ | —        | Type-specific fields listed in §4                                        |

An edge's identity is **(source, type, target, from)**.

## 3. Title scope

Every title is its own canon, so an edge lists **each title that establishes it**, each with its own evidence:

```yaml
# illustrative
- source: character_barret_wallace
  type: parent_of
  target: character_marlene_wallace
  kind: adoptive
  titles:
    og: { sources: […], certainty: stated }
    remake: { sources: […], certainty: stated }
```

- Each entry has `sources` and `certainty`, and may have `world` (default `world_main`) and `notes`.
- **An edge missing from a title is not a claim that it's false there** — only that that title doesn't establish it.
- The comparison view **derives** relationship differences; they are never stored (`model/appearances.md` §5). A title can only reveal a missing relationship if it **depicts both ends in the same world** — the relationship version of "not covered" vs. "left out". For each compared title an edge is:
  - **established** — the title establishes it;
  - **not established** — the title depicts both ends in one world but doesn't establish it: a real difference, shown as _version-specific_;
  - **not applicable** — the title doesn't depict both ends (one is absent, only mentioned, or only in another world), so it says nothing about the relationship.

  An edge is _shared_ when every applicable title establishes it. (Decided in Phase 6, decision 0009: the first version counted every title that showed the entity, which marked, for example, Tifa's part in Cloud's recovered memories as missing from _Rebirth_, a title that hasn't reached that event.)

- If two titles give a relationship **different attributes** (e.g. a different role), they are two edges with different `titles`, and a `relationship` difference on the source entity explains it.
- The graph shows an edge when **any selected title** establishes it, and marks edges not shared by all selected titles.

## 4. Edge types

**Kinds:** C = character, E = event, L = location, O = organization.
**Weight** is the cost used by shortest-path search (§6); lower means a stronger, more specific link.

### Structural — who is related to whom, who belongs where

| Type         | Source → Target | Dir.      | Time-bounded | Attributes                     | Inverse label | Weight |
| ------------ | --------------- | --------- | ------------ | ------------------------------ | ------------- | ------ |
| `parent_of`  | C → C           | directed  | no           | `kind: biological \| adoptive` | child of      | 1      |
| `sibling_of` | C — C           | symmetric | no           | —                              | —             | 1      |
| `spouse_of`  | C — C           | symmetric | yes          | —                              | —             | 1      |
| `member_of`  | C → O           | directed  | yes          | `role?: string`                | has member    | 3      |
| `leads`      | C → O           | directed  | yes          | `title?: string`               | led by        | 2      |
| `part_of`    | O → O, L → L    | directed  | yes          | —                              | includes      | 3      |
| `hometown`   | C → L           | directed  | no           | —                              | hometown of   | 2      |
| `lives_in`   | C → L           | directed  | yes          | —                              | home of       | 3      |
| `based_at`   | O → L           | directed  | yes          | —                              | base of       | 3      |
| `controls`   | O → L           | directed  | yes          | —                              | controlled by | 3      |

### Event — what happened, where, and to whom

| Type              | Source → Target | Dir.     | Time-bounded | Attributes      | Inverse label | Weight |
| ----------------- | --------------- | -------- | ------------ | --------------- | ------------- | ------ |
| `participated_in` | C → E, O → E    | directed | no           | `role?: string` | participant   | 2      |
| `occurred_at`     | E → L           | directed | no           | —               | site of       | 2      |
| `sub_event_of`    | E → E           | directed | no           | —               | includes      | 1      |
| `killed`          | C → C           | directed | no           | `in?: event ID` | killed by     | 1      |

### Causal and experimental

| Type              | Source → Target | Dir.     | Time-bounded | Attributes | Inverse label       | Weight |
| ----------------- | --------------- | -------- | ------------ | ---------- | ------------------- | ------ |
| `caused`          | E → E           | directed | no           | —          | caused by           | 1      |
| `experimented_on` | C → C, O → C    | directed | yes          | —          | subject of          | 1      |
| `acted_through`   | C → C           | directed | yes          | —          | used as a vessel by | 1      |

- **`caused`** means the title establishes that the source event led directly to the target. It's the only type that claims _why_, so it holds the highest bar: if the link has to be argued rather than shown, it's `inferred` with reasoning in the notes. Loose "contributed to" links aren't recorded.
- **`experimented_on`** records the human experimentation at the centre of the story (a scientist or an organization as source).
- **`acted_through`** records a character acting through another's body or form, where a title establishes it. It exists so that one character using another's shape stays two entities, linked (`conventions/ids.md` §3).

## 5. Direction

- **Directed** types read `source → target`. The UI shows the **inverse label** when viewing from the target's side.
- **Symmetric** types are stored **once**; the validator rejects an edge whose reverse already exists.

## 6. Shortest path

Weights make "how is A connected to B?" give meaningful answers:

- Family, killings, causality and experimentation weigh **1**.
- Participation and hometowns weigh **2**; membership, residence and hierarchy weigh **3**, because organizations and places have many members.
- The UI lets users exclude categories and individual entities (e.g. "not via Shinra"), since large organizations still attract paths.
- Paths are computed on the graph **for the selected titles**.

## 7. Derived, never stored

| Not stored                                   | Derived from                          |
| -------------------------------------------- | ------------------------------------- |
| `before` / `after` / `follows`               | Chronology (`model/chronology.md` §3) |
| Grandparents, half-siblings, etc.            | Chains of `parent_of`                 |
| Co-participants in an event                  | Shared `participated_in` targets      |
| Arc of an event                              | The event's `arc` field               |
| "Only in OG" / "new in Remake" relationships | Title scopes (§3) plus coverage       |

## 8. Categories in the UI

Each type belongs to one category, which controls colour and filtering:

| Category       | Types                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Structural** | `parent_of`, `sibling_of`, `spouse_of`, `member_of`, `leads`, `part_of`, `hometown`, `lives_in`, `based_at`, `controls` |
| **Event**      | `participated_in`, `occurred_at`, `sub_event_of`, `killed`                                                              |
| **Causal**     | `caused`, `experimented_on`, `acted_through`                                                                            |

## 9. Validator rules (Phase 1)

- `type` is one of §4; source and target kinds match that type's row.
- Symmetric edges exist in one direction only.
- `from`/`until` appear only on time-bounded types.
- `titles` has at least one entry; every citation in an entry belongs to that entry's title.
- Both endpoints have an appearance in every title the edge lists.
- `certainty: inferred`/`ambiguous` entries have `notes`.
- No two edges share (source, type, target, from).
- No `parent_of`, `sub_event_of`, `part_of` or `caused` cycles.
