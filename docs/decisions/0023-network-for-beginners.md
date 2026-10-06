# 0023 — The web of links, for someone meeting the story for the first time

- **Status:** Accepted
- **Date:** 2026-10-06
- **Builds on:** [0010](0010-network.md), keeping its data, API, URLs and graph library and replacing its pages; [0019](0019-timeline-for-beginners.md), [0020](0020-modern-look.md) and [0022](0022-divergence-for-beginners.md), whose plain words, look and Back button it shares.

## Context

The owner asked for a major overhaul of the network section "with final fantasy vibe", pointing to their Attack on Titan Paths project for inspiration: a graph of portraits, where pointing at someone lights their links and a side panel tells their story. The section's landing page offered drop-downs, a "Shape of the data" panel (entities, relationships, components) and a degree-centrality bar list. The view drew small coloured shapes with a legend, its controls were "Depth 1 / 2 / 3", title buttons and "Structural / Event / Causal", a "Strongest path to…" drop-down, and a "Selection" inspector with "Expand" and "Open page". Its layout ran before the graph's box had its final size, so the web often sat squashed in one corner.

## Decision

**Materia, in plain words.** Every thing in the web is a materia orb in its kind's colour, as the original's materia had theirs: green for **people**, yellow for **moments**, blue for **places**, purple for **groups**. Each kind keeps its own shape too (a circle, a diamond, a rounded square, a hexagon), so colour is never the only cue, and people wear their portraits on their orb. The kinds of link are named for what they are: **Moments and places**, **Family, homes and groups**, **Cause and effect** (`features/network/words.ts`).

**The landing page** (`/network`, same query parameters):

- **Who's linked to whom**, and one sentence: everyone and everything in the story is linked — who took part in what, where it happened, who belongs where, and what led to what.
- **Games**, as everywhere else, with the materia colours shown beside them.
- **Start with someone:** a card for each person (or moment, place or group, by a choice of four), with their portrait or a painting of it and how many links they have, most linked first; a search looks across all four.
- **How are they linked?** Pick any two — _First_ and _Second_ — and **Show how they're linked**.
- Gone: the counts of entities, relationships and components, the separate groups, and the centrality bars — measures of the data, not something a newcomer asks.

**Someone's web** (`/network/:kind/:slug`):

- Their name, summary and a sentence on what the web shows and that anything in it can be tapped.
- **How far** (_Direct links_, _Two steps away_, _Three steps away_), **Games**, **Kinds of link** (each with its line's colour), and **How is … linked to…**.
- **The web** in a faint Mako glow. Pointing at a thing lights it and its links, with their words, and dims the rest; a tap chooses it, a double tap puts it in the centre. A plain scroll scrolls the page; zooming is on **+**, **−** and **Show all**, or Ctrl/⌘ + scroll. The web stays hidden until its first layout settles, then fades in, fitted to its box. A colour key sits under it.
- **Beside it, the chosen thing** (the centre until something is chosen): its picture, its kind, its summary, and its links in this web read from its own end — _Took part in_, _Who took part_, _Where it happened_, _Member of_, _Led to_, _Came about because of_ — each a button that chooses the thing at the other end. Then **Put … in the centre**, **Show their own links too**, **How is this linked to …?**, and **Everything about …** and **Compare the games side by side**.
- **How two things are linked:** each step as a sentence the right way round (_Hojo experimented on Cloud Strife._), then the chain of things to tap, with **Clear**.
- **Every link as a list**, folded away: the same web written out, the graph never the only way to the information (blueprint §33).

## Consequences

- ✅ A newcomer starts from a face they know and reads every link as a phrase; the materia orbs and Mako glow give the section its own Final Fantasy VII image.
- ✅ The web is always fitted to its box, and never shows as a heap while it lays out.
- ❌ The dataset measures (counts, components, centrality) are no longer shown; the API still serves them, and the cards' link counts come from them.
