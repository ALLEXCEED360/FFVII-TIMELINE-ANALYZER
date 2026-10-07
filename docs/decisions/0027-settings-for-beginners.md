# 0027 — Settings, as a Config screen in plain words

- **Status:** Accepted
- **Date:** 2026-10-06
- **Builds on:** [0015](0015-game-menu-design.md), which added the page, and [0020](0020-modern-look.md), whose look it takes.

## Context

The owner asked to move on to the settings page. It still had the earlier design: slanted buttons in uppercase italic, the motion choices named _System_, _Reduced_ and _Full_, and the title screen's replay as a separate button below. Once the spoiler notice was closed, nothing brought it back.

## Decision

- **Settings**, under _Config_ as in the game's menu: how the guide moves, opens and points, saved in this browser.
- A panel per setting — **Motion**, **Title screen**, **Pointer**, **Spoiler warning** — each saying what it's for. Its choices are large options, each with a materia orb that lights green when chosen, and under them a line saying what the chosen one does (_Pages change without sliding or fading, and the title screen holds still._).
- Plain names: _Follow my device_, _Less movement_, _Full movement_; _Every visit_, _Once a session_, _Never_; _Buster Sword_, _My own pointer_.
- **Play the title screen now** sits in the title screen's panel.
- **Show the warning again** brings back the spoiler notice (`showNotice` in the UI store).
- The choices stay radio buttons in a fieldset, so they are read and moved through as one group.

## Consequences

- ✅ Each choice says what it does before and after it's chosen, and a closed spoiler warning can come back.
- ❌ None of note.
