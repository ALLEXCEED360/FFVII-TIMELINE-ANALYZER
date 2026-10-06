# 0018 — Moving between sections, through one of the original's windows

- **Status:** Accepted
- **Date:** 2026-10-03
- **Builds on:** [0015](0015-game-menu-design.md), replacing its section wipe.

## Context

0015's transition between sections tore three slanted slabs (paper, Shinra red, ink) across the screen and slammed the section's name in, stretched. The owner found it a copy of the transitions in their own Metaphor portfolio and OmniPlay, and asked for one that suits Final Fantasy. Two rounds of directions were built on the real site and tried between sections:

1. Field (a fade through black with the area's name in a window), Swirl (the battle transition: the page twisting into a white flash) and Lifestream (green light flooding up the screen). The owner chose the Lifestream, then on seeing it finished asked for something different.
2. Crystal shatter (shards locking into a wall, then bursting apart), Menu window (the original's window filling the screen) and Mosaic (the 16-bit pixel dissolve).

The owner chose the **menu window**. It also echoes the home menu ([0017](0017-home-menu.md)) and the blue window and ATB gauge the owner liked in the first title-screen explorations.

## Decision

- **On the way in,** the screen dims and the original's blue window draws across it as a line, then unfolds from its middle in the game's few steps (0.65 s) until it fills most of the screen. Only then does the route change.
- **In the window,** the white glove points at the section's name in the PlayStation font (_Reactor7_, at 32, 64 or 96 px by screen width, as a pixel font wants) — like the home menu, the window keeps the original game's lettering while the pages use the series' logo lettering ([0020](0020-modern-look.md)), and under it a yellow **ATB gauge** marked "Loading" fills. It is full by the time the window may close; if the page is still loading it flashes, as a full gauge does. The font is loaded when the app starts, so the first change never shows a stand-in.
- **On the way out,** once the new page has arrived and the window has been up long enough to read (at least 0.5 s), it folds back to a line and is gone (0.52 s), and the dimming lifts from the new page.
- Unchanged from 0015: only moving between sections plays it (the navigation and the home menu's commands); links inside a page, back and forward just arrive; under reduced motion there is none; a safety catch lifts it if a navigation never arrives. It doesn't move the page itself, so the graph and charts measure their boxes as usual.
- Code: `components/Wipe.tsx` (timing and markup) and `components/Wipe.css`. The old wipe's styles and the stretched hero lettering only it used are gone from `styles.css`.

## Consequences

- ✅ A transition in the original game's own voice, and one with the home menu: the archive feels like one game's menus.
- ✅ The gauge says something true: it is waiting for the page.
- ❌ A section change takes longer than before (about 1.7 s in all rather than 1 s): the owner asked for it slower, so the window reads as a window opening rather than a flicker.
