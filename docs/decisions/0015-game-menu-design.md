# 0015 — A game-menu design, with official artwork

- **Status:** Accepted; its title screen superseded by [0016](0016-title-screen.md), its home menu by [0017](0017-home-menu.md)
- **Date:** 2026-09-30
- **Builds on:** [0014](0014-design-pass.md), which it replaces for look and feel; its page structure, hover previews and timeline layout stay.

## Context

The first design pass (0014) finished the "analysis terminal" look: dark glass, quiet Mako light. Everything worked, but it read as a well-made dashboard. The owner wants the design sense of their other projects — a portfolio in _Metaphor: ReFantazio_'s interface language, OmniPlay's Persona-style "Phantom" system and _Attack on Titan: PATHS_ — an Atlus game's menus with Final Fantasy VII's atmosphere, as much official artwork as possible (no AI-generated images), and a boot screen like theirs.

What those projects share: a title screen with a stretched name and a "Press any key" prompt; slanted slabs and cut shapes instead of rounded cards; paper-white cut-outs on near-black ink with one loud accent; fat-face or condensed leaning type; a big wipe carrying the destination's name between sections; a custom cursor; control hints; full-bleed artwork behind every screen, dimmed on the side where text lives; film grain and halftone.

## Decision

### The system (`styles.css`)

- **Colour:** ink blacks, paper white, **Mako green** as the one loud voice, **Shinra red** only as the second stripe of the wipe. Text is warm paper grey and clears 4.5:1 on every panel. The four title colours are unchanged.
- **Type:** _Bodoni Moda_ at 900 for page titles and giant words — the high-contrast serif of the Final Fantasy logo, set like Metaphor's fat-face screen titles, with a Mako offset shadow and a printed-ink texture on the largest words; _Barlow Condensed_ bold italic as the menu voice (`font-display`, buttons, section headings); Inter for reading; JetBrains Mono for figures and labels. Only the Latin subsets are declared (`fonts.css`).
- **Shapes:** buttons are parallelograms (focus drawn inside, since a clip hides an outline); pressed and current buttons fill with Mako and ink lettering; panels are near-opaque ink with surveyor's brackets at two corners — not clipped, so popovers inside them never are; linked panels nudge sideways with a hard Mako shadow; section headings are leaning capitals behind a Mako slash with a rule running out. Radii are a hairline everywhere.
- **Texture:** paper grain over the whole app, halftone under large surfaces, and Midgar's plate — a ring, its eight sectors and a sightline — drawn faintly over every backdrop, like Metaphor's compass lines.
- The materia orb is the brand mark; the home menu's six colours are materia's.

### Screens and motion

- **Title screen** (`BootScreen`): Midgar at night under stars, Lifestream motes rising, Amano's Meteor faint in the sky; "Timeline" and "Analyzer" arrive stretched from either side and settle over a Mako slash, then the four titles and a paper "Press any key" prompt. It wakes the API meanwhile (the free host sleeps) and says how that went. On the home page it waits for a key or tap; opened on any other page (a shared link) it steps aside once the archive answers. It plays **once per session** by default; Settings offers every visit or never, and can play it again.
- **Home** is a main menu in Metaphor's form: the six sections as fat-face words along an arc, the chosen one on a slab of its materia colour, its artwork filling the screen, a giant number and its name on end in the corner, and a brief panel with control hints. Arrow keys, Home and End move along it; Enter opens. On phones it's a plain numbered list. The four title cards (with key art) and the dataset in numbers follow below.
- **Wipe** (`Wipe`): moving between sections from the navigation or the home menu plays three slabs — paper, Shinra red, ink — with the destination's name slammed in. It covers before the route changes, holds while the page's code loads, and lifts once the new page has arrived. Links inside pages, and back and forward, just arrive. No wipe under reduced motion.
- **Cursor:** a Mako arrowhead on devices with a mouse, lit over anything clickable and turning into a reticle when pressed; text fields keep the I-beam. Settings can switch it off.
- **Settings** (`/settings`) collects Motion (moved from the footer), Title screen and Cursor. The footer now carries control hints, Credits and Settings.
- Pages slide in; list items rise with a lean. The page's own arrival has no skew: Cytoscape and the charts measure their box as the page mounts, and a skewed box read as a scaled one. The graph also refits whenever its box changes size.

### Official artwork

71 images, approved by the owner on 2026-09-30 from a list with every file's name, source and size: key art for all four titles, Tetsuya Nomura's and Roberto Ferrari's illustrations, Remake and Rebirth character renders and artwork, the original's character art, and concept art of places. All are official Square Enix artwork, found through the Final Fantasy Wiki; none is a screenshot, extracted from game files, or AI-generated. Fan art was considered and left out: it needs each artist's permission, and can be added with it.

- `scripts/fetch_art.py` reproduces every file from its wiki name: resized to WebP (7.9 MB in all), flat studio backgrounds keyed out so figures stand on the page alike, pencil sketches keyed to light lines on transparency (shown like blueprints on the dark page, and as ink on paper), and printed titles and publisher logos cropped off. It never alters a drawing beyond that.
- `src/art/manifest.ts` records each image's size, alt text, crop focus, artist, wiki source and **subjects** (the entities it depicts). A test checks every file is listed with its real size and every subject exists.
- **Where it appears:** every section and title has a backdrop; entity pages use a scene of their subject as backdrop; character pages show the Remake or Rebirth figure on a plate, with the original's artwork pinned beside it on a paper card ("Original · 1997"); comparisons of a character put the original's art over its column and the new look over the others; the Explore roster shows each character standing in their card; the inspector shows an event's scene; the Archive's title panels and the home's title cards carry key art. `/credits` lists all 71 with artist, © Square Enix, the source, and what was changed.

## Consequences

- ✅ The app has the owner's house style and FFVII's atmosphere, and shows the games' art on almost every screen, while every page keeps the structure its tests rely on.
- ✅ WCAG 2.2 AA holds on all 20 audited pages at desktop and phone sizes. The audit now waits for entrance animations to finish, since a half-faded label fails contrast.
- ✅ Budgets hold: initial JavaScript 131 of 135 kB, CSS 13.5 of 15 kB (after declaring only the Latin font subsets). Images load lazily, except a character's figure and the title screen.
- ❌ Initial JavaScript grew 10 kB (title screen, wipe, cursor, menu and the manifest) and has little headroom left; the next large addition to the shell should move the title screen into its own chunk.
- ❌ The repository carries 7.9 MB of images. Official artwork isn't covered by the project's licences and will be removed at the rights holder's request.
- ❌ Playwright runs with the title screen switched off (`apps/e2e/storage.json`), as a returning visitor would; its own tests turn it back on.
