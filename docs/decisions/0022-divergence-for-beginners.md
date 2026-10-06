# 0022 — The divergence section, for someone meeting the story for the first time

- **Status:** Accepted
- **Date:** 2026-10-05
- **Builds on:** [0011](0011-divergence.md), keeping its data, rules and URLs and replacing its pages; [0019](0019-timeline-for-beginners.md), [0020](0020-modern-look.md) and [0021](0021-compare-for-beginners.md), whose plain words, look and pieces it shares.

## Context

The owner asked for a great overhaul of the divergence section: beginner-friendly, with "the perfect FF7 vibe", finding it very confusing and its filters hard to understand. The landing page listed "divergence points" with chips such as "2 differences · 1 major" beside a drop-down of every event. The view drew a horizontal map that scrolled sideways: a trunk forking into a line per title, unlabeled except for slanted event names, with seven station shapes explained by a legend, then repeated "as a list"; its controls were the earlier title presets, a "Show other worlds" toggle with no explanation, and "Re-root here" in an inspector.

## Decision

**The landing page** (`/divergence`, same query parameters):

- One paragraph: the Remake series doesn't only retell the original; at some moments its games tell things differently, show things the original never did, or hint at another world. Pick a moment to follow the story up to it and see where each game goes.
- **Which games:** the compare section's pair buttons and game choices.
- **The big turning points:** the moments with a big change, as cards with their artwork, when they happen in plain words, and how much changes ("2 changes, 2 big").
- **Every moment where they differ**, in story order, on a line of Mako light.
- **Start from any moment:** the compare section's search, offering moments only.

**One turning point** (`/divergence/event/:slug`), read top to bottom:

- Its name and summary, a sentence on how to read the page, and links to compare the games side by side and to see it on the timeline.
- **Which games**, and **Other worlds** as a switch that says what it does: the Remake series also shows another world, where Zack survived; turn this on to follow it as a line of its own.
- **The story so far:** the trunk as one glowing line of Mako green — the Lifestream — with each earlier moment saying whether it's told the same in each game or differently, which kinds of change, whether any is big, and which games tell it. The latest six show at first, with a button for the rest.
- **The turning point:** a panel where the line runs into a glowing materia, and what each game does with the moment in a word and a sentence (_Told differently_ — "This game tells it, but differently from the others.").
- **Where each game goes:** the line splits — a bar of light, and a drop into each game's own line in its colour — and each game's later moments follow, each marked in words: _Told the same_, _Told differently_, _Only this game shows it_, _Only this game has told it so far_, _Left out_, _Not reached yet_, _Not recorded yet_ (`lib/plain.ts`). With nothing to decode there is no legend, and no second "list" form: the view is the list.
- **Choosing a moment** opens the timeline's event panel, in plain words, beside the view (on a phone, above it), where **Make this the turning point** takes the place of "See where the stories split".
- The event panel now tells a game that simply hasn't reached a part of the story yet (_Not reached yet_) from one that doesn't tell it (_Not in this game_), by the same coverage rule as the API — on the timeline too.
- Gone: the SVG map and its layout code, the legend, the list form, the inspector (the event panel replaces it everywhere), and the earlier title selector.

### Revised after the owner's first look

The owner found it still hard to read and couldn't tell where to tap for details. So:

- **Every moment is a card that is wholly a button**, bordered, lighting on hover, with a **Details ›** button on it (_Open ›_ once chosen); on the landing page every moment and turning-point card carries **Open ›** or **See where they part ways ›** the same way. The turning point has its own **See the details of this moment** button.
- **The three stages are numbered** — _Step 1 · Before_, _Step 2 · The turning point_, _Step 3 · After_ — the guide says to read them in that order, and each stage says to tap any moment.
- **Until a moment is chosen**, the panel beside the view says so, with an arrow towards the moments: _Tap any moment_.
- **Larger and brighter text:** a 17 px base, moment names at 22 px, the turning point's at 36 px, the change written out (_What changes: How it's shown_), and the secondary text a brighter grey.
- Two changes for the whole site came with it ([0020](0020-modern-look.md)): a **Back** button on every page but the home menu, and a **slower, true crossfade** between backgrounds.

## Consequences

- ✅ A newcomer reads the divergence as a story — before, the turning point, after — in plain words, and the Lifestream line splitting at a materia gives the section its own Final Fantasy VII image.
- ✅ Nothing scrolls sideways, on any screen.
- ❌ The map's at-a-glance picture of every game's line across the whole chronology is gone; the vertical view takes more scrolling for a long story so far, which is why it shows the latest six first.
