# 0019 — The timeline, for someone meeting the story for the first time

- **Status:** Accepted; its look (the blue windows outside the home menu, the glove, the bar) is replaced by [0020](0020-modern-look.md)
- **Date:** 2026-10-03
- **Builds on:** [0007](0007-web-app.md), replacing its timeline chart; [0017](0017-home-menu.md), whose windows it uses; [0015](0015-game-menu-design.md), replacing its header.

## Context

The owner set the audience for the whole archive: **beginners**. Every page should be as easy to use as possible, in the Final Fantasy look, with nothing unnecessary. They started with the timeline page and the navigation bar above it, which "has unnecessary contents and structure is done poorly".

The timeline was a zoomable chart: one lane per game, events as slanted labels along the top, six kinds of marker (depicted, referenced, omitted, false or disputed account, other world only, placed at a different time) explained by a legend, and a side panel of filters (titles, order, chart or list, arc, pivotal events). It answered every question an expert might ask and few that a newcomer would. The bar numbered its sections, repeated the series' name in small print, showed a keyboard shortcut and a settings icon, and on phones its sections scrolled sideways on a row of their own.

## Decision

**The bar** across every page is one of the original game's windows ([0017](0017-home-menu.md)), shared with the home menu (`components/SiteBar.tsx`, `components/ff7.css`):

- the name with its materia (back to the home menu), the sections as commands in the PlayStation font with the white glove on the one you're in (it follows the pointer and the keyboard to another), and Search;
- nothing else: no numbers, no shortcut hints, no settings icon (Settings is the home menu's Config, and in the footer);
- too narrow for the sections in a row (under 72 rem), they fold into a **Menu** window under the bar, which closes when you go somewhere or press Escape.

**The timeline** (`pages/TimelinePage.tsx`, `features/timeline/`) is the story told top to bottom, in the game's windows:

- **One sentence** says what the page is and what to do: choose any event to see how each game tells it.
- **Three choices** in one window: the order (_As it happened_, or _As you play it_ for one chosen game), which games, and _Key moments only_. Choices live in the URL as before (`?titles=`, `?view=play&game=`, `?key=1`, `?event=`); the old `?major=1` still works.
- **Chapters:** what comes before the story by era (_The Distant Past_, _Shinra's Rise_, _Five Years Before_), then the story by arc (_Midgar_ … _The Final Battle_). On wide screens a Chapters window beside the story jumps between them.
- **Each event** gives its name (a star for key moments), when it happens in plain words ("15 years before the story"), its summary, and a mark per game: _shows it_, _only mentions it_, or _not in this game_, with a three-item key above. The glove points at the chosen one.
- **Choosing an event** opens its window: the event's art, what happens, **how each of the four games tells it** in plain words ("Shown, but as a false memory", "Only mentioned, in another world", "Not in this game") with that game's own account and where in the game it is, what changes between the games, who is there and where, and three ways on: compare the games side by side, see where the stories split, everything about the event. On wide screens it sits beside the story and follows it down the page; on narrower ones it opens inside the event's own row. Arriving from a link with an event chosen scrolls straight to it.
- **As you play it** numbers one game's events in the order you meet them, each saying how the game tells it, with a sentence on why the order jumps around in time.
- **Gone:** the chart, zoom and pan, the chart/list switch, the arc filter (the chapters replace it), the six-marker legend, and the hover previews. A title's different placement of an event in time is no longer drawn; it is always recorded as a chronology difference, which the event's window lists. The D3 packages that drew the chart are removed.

## Consequences

- ✅ A newcomer can read the page from top to bottom and understand the story, then choose any event to see how the games differ, with no legend to learn.
- ✅ One layout serves every screen: the phone no longer gets a different "list" view.
- ✅ Smaller: the timeline's code fell from 21.4 kB to 4.6 kB (gzipped), and the site's CSS from 14.4 to 13.8 kB.
- ❌ The chart's at-a-glance picture of all four games across the whole chronology is gone; the comparison and divergence views still give the expert's picture.
- ❌ The site's pages now mix two looks (the game's windows and the earlier Atlus-style panels) until the rest are redone.
