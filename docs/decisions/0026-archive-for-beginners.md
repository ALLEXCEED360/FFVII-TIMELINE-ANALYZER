# 0026 — The archive, as the games chapter by chapter

- **Status:** Accepted
- **Date:** 2026-10-06
- **Builds on:** [0012](0012-archive-and-sources.md), keeping its data, API and URLs and replacing its pages; [0020](0020-modern-look.md), [0023](0023-network-for-beginners.md) and [0025](0025-entity-pages-for-beginners.md), whose look, materia orbs and faces it shares.

## Context

The owner asked to move on to the archive. Its four pages still had the earlier design and spoke a researcher's language: "The titles as sources", "story segments", citation counts and bars, "The dataset" with entity counts, "Facts by certainty" (_Stated_, _Inferred_, _Left open_), "Shown here" with the data's status and framing labels, "Relationships shown here" as `Sephiroth killed Aerith` without a sentence, "Neighbouring units", and a research log of "Evidence", "Used only to locate", "Open questions" and "Inferred and left open".

## Decision

**The landing page** (`/archive`): **The games, chapter by chapter** — everything in this guide comes from the games themselves; pick a game to go through it chapter by chapter. A card per game (its key art, year, how it's divided, what it retells, a strip lit for each part with something recorded, _Go through it ›_), the whole card a link. Beside it, **How the facts were checked** in a paragraph with how sure the facts are, and **Still to come**. The dataset counts are gone.

**A game** (`/archive/:title`): its parts as a chapter select — a numbered row per chapter (the original's by disc), its part of the story, the games that retell it, and how much it shows (_Shows 8 people and things_), each row a link, all on one dark panel.

**A chapter** (`/archive/:title/:unit`): **Who and what it shows**, grouped by kind with faces and orbs, each saying how it's shown in plain words (_Appears_, _Only mentioned_, _Shown in a flashback_) and what happens in the scene; **What changes here** (the games, the kind of change, _Big change_); **Links it shows** as sentences (_Sephiroth killed Aerith Gainsborough._); **Other worlds glimpsed here**; **Still being checked here**; and **Before this** / **After this**.

**How the facts were checked** (`/archive/research`): what counts as proof, best first; how sure each fact is (_Shown or said outright_, _Worked out from what's shown_, _Left open by the game_) as a bar and key; **Checked against** and **Used only to find things**; **Still being checked**, by kind; and **What the games don't say outright**.

## Consequences

- ✅ A newcomer can walk a game chapter by chapter and see who's in each, and reads how the guide knows what it says without the researcher's terms.
- ❌ Citation counts are no longer shown; a chapter's count is now of the people and things it shows.
