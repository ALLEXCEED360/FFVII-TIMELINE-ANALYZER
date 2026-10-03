# 0017 — The home menu, as the original's pause menu

- **Status:** Accepted
- **Date:** 2026-10-01
- **Builds on:** [0015](0015-game-menu-design.md), replacing its home menu.

## Context

0015's home page was a main menu in _Metaphor: ReFantazio_'s form: six fat-face words along an arc, a giant number and a brief panel. The owner found it a copy of their own Metaphor portfolio and asked for a menu of the archive's own that fits Final Fantasy. Three directions were built on the real page and compared as screenshots:

1. **Classic:** the original's pause menu.
2. **Materia:** the sections as materia orbs in linked weapon slots.
3. **Modern:** the Remake and Rebirth menus, with a command column and the section's art.

The owner chose Classic.

## Decision

The home page is Final Fantasy VII's pause menu, filled with the archive:

- **The party is the four games.** Each has a key-art portrait, its release year as **LV**, where its story runs (its first part and its last, joined by a line across the row: the original from Mako Reactor 1 to The Final Battle, Remake and Rebirth over the stretch of the original they retell, INTERmission over its own two episodes; on phones it wraps), its parts (segments or chapters) as **HP**, and as **MP** how many of those parts the archive cites so far, each with its bar. A member opens that game's archive page.
- **The sections are the commands:** Timeline, Compare, Divergence, Network, Explore, Archive, and Config (Settings). Config is a command like the rest, not a link after them. They are chosen with the white glove, which moves with the arrow keys, Home and End, the pointer, and focus. Enter opens the highlighted command through the section transition ([0018](0018-window-transition.md)).
- **The help window** along the top says what the highlighted command does, or which game is pointed at and what it retells.
- **Side windows** hold the play time since the menu opened, the archive's size by kind (in the place of the original's Gil), and the location.
- **Look:** the original's blue gradient windows in pale bevelled frames, unfolding from their middle one after another, and the PlayStation text font (_Reactor7_).
- **Size:** every measure is taken from one base size that grows with the screen (1.4 vw, at most 2.35 vh), so the menu fills most of a large display and still fits a short one. It takes the height the top bar (and the spoiler notice, while it shows) leave, so the page doesn't scroll on a desktop.
- **Each command has its own wide scene** (in `menu.ts`), since the sections' page backdrops include tall portraits that crop and blur across a whole screen: Timeline, Midgar at night; Compare, the Remake party on the highway; Divergence, Aerith under the open sky; Network, the party at sunrise; Explore, the Sector 7 slums; Archive, Tifa on the water tower; Config, Barret and Marlene in the church. All are loaded when the menu opens, and the backdrop crossfades from one to the next (the previous scene stays underneath while the new one fades in).
- **The highlighted command's scene fills the screen behind the menu** under a light veil (the backdrop's `full` mode), and the windows are a little translucent, as the PC original's Config allowed, so it shows through them and changes as the glove moves.
- **The home page has its own top bar** (`components/SiteBar.tsx`, shared with every page since [0019](0019-timeline-for-beginners.md)) in place of the site header: one of the menu's windows, at its width and scale, holding the name with a materia orb, Search (with its shortcut) and Credits, each taking the glove on hover and focus. The menu's commands are the sections and Config, so it doesn't repeat them. Nor is there a footer: Credits and Settings are already in the bar and the commands, and the disclaimer is on the title screen and the Credits page. Every other page has the modern bar with the sections ([0020](0020-modern-look.md)); no page has a footer.
- **On phones** the help comes first, then the commands and side windows, then the party.
- The sections below the old menu (the titles and the archive in numbers) are gone: the party and the side window carry both. The research log is reached from the Archive.
- Code: `features/home/` (`ClassicMenu.tsx`, the section list and keyboard handling in `menu.ts`, styles in `home.css`).

## Consequences

- ✅ A menu of the archive's own, in the original game's voice, and every number on it is real data.
- ✅ Reactor7, kept from the title-screen explorations, is now used.
- ❌ The pixel font is set at multiples of 16 px, so the menu's text sizes step rather than scale smoothly.
