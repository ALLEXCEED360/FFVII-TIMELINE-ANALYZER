# Design

How the web app looks and behaves. It's written for someone meeting the story for the first time: plain words over the data's terms (`lib/plain.ts`), one clear thing to tap, nothing an expert alone would need.

## Two tellings

The story is told twice: **the original** (1997) and **the Remake Trilogy** — Remake, INTERmission and Rebirth, one retelling in parts that cover different stretches of the story. Every choice of games on the site is between these two (`lib/tellings.ts`): Compare and Divergence always set the original against the trilogy, and the Timeline, Network and Explore offer one choice, _Both / The original / The Remake Trilogy_ (`?in=original|trilogy`; older `?titles=` links still work). Within the trilogy, a moment still says which of its games tells it ("in Rebirth").

## Look

- **Two styles.** The home menu is the original game's blue windows (`components/ff7.css`); every other page uses modern glass panels in the spirit of Remake and Rebirth (`components/modern.css`). No footer.
- **Lettering.** The series' logo lettering for the top bar; Optimus Princeps for names, headings and labels; Reactor7, the original's pixel font, for the home menu and the window between sections; Inter for reading; JetBrains Mono for where-in-the-game references.
- **Colour.** Each game has its colour (OG amber, Remake cyan, INTERmission pink, Rebirth periwinkle). Each kind of thing has its materia: green people, yellow moments, blue places, purple groups (`lib/kinds.ts`).
- **Artwork.** Official Square Enix art only, never AI-made, each listed in `art/manifest.ts` and credited from `art/credits.ts` on the Credits page. Every page sits over a picture; a change of picture is a slow crossfade, a layer per picture, so moving on mid-fade never makes one jump (`Backdrop.tsx`).
- **Moving around.** Changing section opens one of the original's windows with an ATB "Loading" gauge (`Wipe.tsx`). The page bar carries the sections, search, and — smaller and quieter — Config and Credits. Every page but the home menu has a Back button that follows you down the page. Cloud's Buster Sword is the cursor (Settings can turn it off). Reduced motion, from Settings or the system, makes every change immediate.

## Title screen

Midgar at night with Meteor in the sky; "FINAL FANTASY VII" in the logo lettering over "TIMELINE ANALYZER" in outlined capitals with a Mako tide rising inside; "PRESS ANY BUTTON". It wakes the API while it plays, once a session by default.

## Home menu

The original's pause menu. The four games are the party: cover, year as LV, where its story runs, its parts as HP and how many are recorded as MP. The sections are the commands, chosen with the glove; a help window says what the highlighted one is.

- **Keys anywhere:** ↑ ↓ / W S within a column, ← A to the games, → D back to the commands, up from the top to Search and Credits, Enter to open. Mouse and keys move **one** glove.
- **A chosen game** comes forward: its cover grows and glows in its colour, the others dim, and its key art fills the screen.

## Sections

- **Timeline.** The story in chapters, top to bottom; each moment says when it happens and whether each telling shows it, only mentions it, or leaves it out. The game's white glove (the main menu's, in its own gutter so it never covers the text) points at the moment under the pointer and rests on the chosen one, framed like a chosen command; its details open in one of the original's blue windows. Each moment shows a filled diamond for each telling that has it. "As it happened", or "As you play it" — the original, or the trilogy game by game.
- **Compare.** Everything the Remake Trilogy changes, one row per moment, person or place: the main menu's glove points at a row, choosing it lights it and opens its changes in one of the original's blue windows (`?open=`). Side by side, each telling is its own blue window, the trilogy's games named in words; connections are listed as in both, or only in one telling. No game diamonds on these pages.
- **Divergence.** Pick a turning point: the story so far on one line of Mako light, the moment itself at a glowing materia, then where each telling goes — every moment marked in words (_Told the same_, _Told differently_, _Only this telling shows it_…). The turning point is one of the original's blue windows. After it, the tellings share one set of rows (CSS subgrid), so a moment both have sits side by side and a gap ("Not in the original") holds the place where one doesn't; on a phone they stack. The main menu's glove takes a moment's place on the line when pointed at; the chosen one is framed in blue.
- **Network.** Start from a portrait. The web is materia orbs, each wearing its own picture (people their portraits; moments, places and groups their scenes, as small squares from `scripts/make_thumbs.py`), the shape saying the kind, in a field framed like one of the original's windows, laid out as rings like a clock face: the centre in the middle, what's directly linked on the first ring grouped by kind (people, groups, places, moments) with names facing out, and two or three steps away as small dots on wider rings, named when pointed at; a pale ring locks on to the chosen thing, pulsing, while its links light up. Beside it, "What the web shows" is the original's Config screen: how far to look, which story, which kinds of thing (switches) and kinds of link, each option saying what it does, the glove on the chosen one, and a way back to the usual view; on a phone it folds above the web. The chosen thing opens in a blue window, its links read as phrases ("Took part in", "Who took part"). "How are they linked?" finds the chain between any two.
- **Explore.** Who's who and what's what: picture cards by kind, moments in story order.
- **A character, moment, place or group.** What it is, the games it's in, how each tells it, what changes, and what it's linked to.
- **Archive.** The games chapter by chapter: who and what each chapter shows, and how each fact was checked.
- **Settings.** The original's Config screen in blue windows: Music, then motion, the title screen, the pointer and the spoiler warning as rows, each choice saying what it does.
- **Music.** Background music as in a sports game's menus: the audio files in `apps/web/src/music` (found at build time, folders included: each folder is a group in Config, a leading `01 - ` only orders, and `Artist - Title.mp3` is credited to its artist). A random track starts at the first press — the title screen's "press any button", or a first click or key without it, since browsers only play sound after one — another follows when it ends, and it plays on from page to page. As in a sports game, each new track slides a card in at the bottom right for a few seconds — album art, title, composer, game (`NowPlayingCard.tsx`). C, X and P skip on, go back, and pause from anywhere — not while typing, nor with Ctrl, Alt or ⌘ held (`keys.ts`). Everything else is in Config. The whole page is the original's Config screen: a Music window — a library player — the playing track's cover, title and credits with a progress bar, previous / play / next, shuffle and volume; a shelf of albums (covers and credits from each folder's `cover.webp` and `album.json`) beside the chosen album's track list; then a Config window whose rows (motion, title screen, pointer, spoiler warning) name the setting and its purpose on the left and offer its choices on the right, the glove on the chosen one. `BackgroundMusic.tsx` and the card load at that first press. Only music the project may share goes in the folder; the games' soundtracks belong to Square Enix.
- **Credits.** A staff roll, every picture with its source, each typeface in its own letters, and the licences.

## Quality

Keyboard-first, with axe checks in the unit and end-to-end tests; the graph always has a text alternative; nothing scrolls sideways on a phone. The first load stays under 135 kB of JavaScript and 15 kB of CSS (`pnpm web:size`).
