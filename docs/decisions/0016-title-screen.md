# 0016 — The title screen, engraved

- **Status:** Accepted
- **Date:** 2026-10-01
- **Builds on:** [0015](0015-game-menu-design.md), whose title-screen scene stands; this replaces its lettering.

## Context

The owner liked the first title screen's scene: Midgar's reactors at night, stars, Amano's Meteor faint in the sky, the Lifestream's green motes rising. They didn't like its lettering, or a "Press any key" so close to OmniPlay's. A day of directions followed, each shown on screen before any was polished:

- a Lifestream sky behind the Remake logo's Meteor emblem;
- key art cut into slanted panels, the games' key art in turn, and the original's whole menu screen;
- the Buster Sword outlined in neon, and the Remake's own title image;
- lettering over the first scene: the series' logo voice, the original game's pixel font with its blue windows, Remake-modern thin capitals, and Persona 5 cut-out letters;
- three title lockups with the Final Fantasy logo lettering: across Amano's Meteor in colour, engraved, and stacked.

The owner chose the **"between hairlines" prompt** and the **engraved** title.

## Decision

- **The scene is the first one,** unchanged except that its motes now rise as intended. Their keyframes live in `components/BootScreen.css`: Tailwind only outputs theme keyframes (and theme variables) that `styles.css` itself uses.
- **FINAL FANTASY VII** is small, in the series' own logo lettering, between hairlines tipped with Mako. The lettering comes from the fan recreation by Juan Pablo Reyes Altamirano (1999, free; capitals only). It's served as `finalf-web.ttf`: the original file with its empty Mac character maps dropped, which modern browsers otherwise refuse, and with the glyphs untouched. It sits in `public/fonts/ff-logo` with the original and its readme.
- **TIMELINE ANALYZER** is set in _Optimus Princeps_ (Manfred Klein, free), large Roman capitals drawn as silver outlines, hollow like glass, with the Lifestream's light inside them: a tide of Mako green that slowly rises and ebbs through the letters, a paler current drifting across, and a glow that swells as the tide comes in. The two movements animate registered custom properties (`--tide`, `--current`), each driving its own background layer; under reduced motion the tide rests at its height. _(Revised 2026-10-03: it was first brushed silver with a passing glint. The owner asked for a new treatment and chose this "Lifestream" one from four shown on screen; the others were the series' logo large with the name as a spaced subtitle, the name over a line of the four games' years, and a high-contrast italic "Timeline".)_
- **PRESS ANY BUTTON** (or "Tap the screen" on touch) is thin, widely spaced capitals between two hairlines on a faint Mako band, pulsing slowly.
- **Layout:** the title is centred and fills the screen: "FINAL FANTASY VII" at up to 3.4 rem, "TIMELINE ANALYZER" at up to 10.5 rem, both sized to the screen's width and height. Amano's Meteor sits upper right, larger than in 0015 and further in from the edge, its sphere just touching the title's upper right. The prompt shows keyboard focus by brightening its hairlines rather than drawing a box (it's focused as the screen opens, so a key works at once).
- **The four games, the server status and the small print** are quiet spaced capitals, each game after a short line in its colour.
- Behaviour is unchanged: it waits for a key or tap on the home page, steps aside by itself on a shared link, and plays as Settings says.
- Everything else from the explorations was removed. _Reactor7_ by Caveras (the PlayStation game's text font, CC BY-NC-SA) stays in `public/fonts/reactor7` with its licence; the home menu now uses it ([0017](0017-home-menu.md)).

## Consequences

- ✅ The series' own voice: the logo lettering, Roman capitals filled with the Lifestream, and the quiet request for a button.
- ❌ The logo-lettering font is a 1999 fan file, free for non-commercial use, and repaired to load.
