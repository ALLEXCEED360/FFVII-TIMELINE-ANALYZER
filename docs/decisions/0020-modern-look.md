# 0020 — A modern look everywhere but the home menu, and no footer

- **Status:** Accepted
- **Date:** 2026-10-03
- **Builds on:** [0019](0019-timeline-for-beginners.md), keeping its timeline and changing its look; [0017](0017-home-menu.md), whose home menu stays as it is.

## Context

0019 rebuilt the timeline for beginners and put it, with the bar across every page, in the original game's blue windows. The owner liked the design and the fonts, but wanted the blue menu look kept for the home menu alone: every other page, the bar included, should have a **modern** layout. They also asked for the footer to go entirely; it only repeated the bar.

## Decision

- **The home menu is unchanged:** the original's pause menu in its blue windows, with its own bar as one of them and the glove.
- **Every other page has the modern look** (`components/modern.css`), in the spirit of the Remake and Rebirth menus: dark glass panels (`.m-panel`) with a hairline edge and a thin line of light along the top, small headings in the pixel font in cyan (`.m-label`), and a **band of cyan light** fading to the right, edged on the left, on whatever is chosen (`.m-chosen`). Choices are rounded pills that light when on. There is no glove outside the home menu.
- **Fonts:** the series' own logo lettering (the fan recreation also used on the title screen; capitals only, with Optimus Princeps setting the figures and punctuation it lacks) for names, headings, small labels and the bar; the site's sans for anything read at length. Its letters are narrow and set tight, so it is spaced well beyond the usual (0.12 em between letters in headings, 0.16 em in the bar and the small labels, with wider word spaces) and set no smaller than about 17 px. It is preloaded with the page (4 kB), and the bar's row of sections may trim rather than widen the page, so the wider stand-in font that shows while it loads can never make the page scroll sideways. The PlayStation font (_Reactor7_) belongs to the original game's windows: the home menu and the section transition. _(Revised 2026-10-05 at the owner's request: names and headings were first in Reactor7.)_
- **The bar** on those pages (`components/SiteBar.tsx`) is a slim, full-width strip of dark glass with a line of light beneath: the name with its materia (back to the home menu), the sections with the one you're in lit and underlined in light, and a search box ("Search the archive…"). Under 64 rem the sections fold into a Menu panel, which closes when you go somewhere or press Escape.
- **The page uses nearly the whole screen** (up to 150 rem, with gutters that grow with the screen, `--page-max` and `--page-pad`), rather than a 96 rem column with empty bands either side on a large display. The panels are see-through enough (dark glass, blurred) that the artwork shows through and around them, and the timeline lays its artwork across the whole screen under a light veil. Where there is room, an event reads in two columns: its story, and beside it which games tell it.
- **The bar is substantial** (5 rem tall), and all its words are in the series' own logo lettering (the fan recreation also used for "FINAL FANTASY VII" on the title screen, capitals only), set large: the materia and the archive's name under a small "Final Fantasy VII", the sections with the one you're in lit and a glowing line beneath, and a wide search box. No icons beside the sections: the owner found them ugly, and the words, larger, carry the bar. Under 80 rem the sections fold into a Menu panel, its button reading _Menu_ or _Close_. _(Revised 2026-10-05: the owner asked for "the FF7 Remake font"; no official Remake typeface is publicly available, so the owner chose from three already in the project — the series' logo lettering, engraved Optimus Princeps capitals, and Barlow Condensed — shown on the bar.)_
- **Event pictures keep their proportions** in the event panel (only very tall ones are cropped, around their focus; figures on transparency are shown whole on a soft light), instead of a thin strip that showed only a slice of each.
- **No footer** on any page. The disclaimer that the archive is a non-commercial fan project is on the title screen and the Credits page; Credits is in the home menu's bar, Settings is its Config command.
- The timeline keeps 0019's structure: the same chapters, events, marks, choices and event panel, restyled.
- The other pages are restyled into the modern look as each is overhauled.

## Consequences

- ✅ The home menu stands apart as the game's own menu; the rest of the archive reads as a clean, modern app in the same family.
- ✅ Less on every screen: no footer, and a bar with only what a visitor needs.
- ❌ Until the remaining pages are redone, they use the earlier panels under the new bar.
