# 0028 — The home menu: arrow keys and W A S D anywhere, and the chosen game's cover forward

- **Status:** Accepted
- **Date:** 2026-10-07
- **Builds on:** [0017](0017-home-menu.md).

## Context

The owner asked for two things on the home menu: to move through it with the arrow keys and with W A S D, and for the four games' covers on the left to stand out when pointed at or chosen. The arrow keys only worked once a command already had focus, only up and down, and only among the commands; a pointed-at cover only brightened its border.

## Decision

- **Keys anywhere on the screen**, with or without focus: up and down (↑ ↓ or W S) move the glove within its column, down from the last wrapping to the first; left (← or A) crosses to the games, on the one last chosen; right (→ or D) crosses back to the command the glove left; Home and End go to the first and last; Enter opens the choice.
- **Up to the bar:** up from the top of either column reaches **Search** and **Credits** in the bar above, on the one last chosen there; left and right move between them; down goes back to the column the glove came from. (Added after the owner asked for the bar too.)
- **One glove.** The keys and the mouse move the same glove: pointing at a command, a game or a bar item moves the glove (and the keyboard focus) there, and the keys carry on from wherever it is. There is never a second marker — no glove left behind on the commands, no hover glove beside a keyboard one, no outline in the bar. (Fixed after the owner saw one glove for the mouse and another for the keyboard.) Where the glove is lives in a ref updated as it moves, so keys pressed quickly or held each count.
- The keys are left alone while typing in a field, with Ctrl, ⌘ or Alt held, and while a window is open (the title screen, search). The key that dismisses the title screen doesn't also move the glove.
- **The chosen game** — pointed at or reached with the keys — comes forward: its cover grows by 40% and glows in its game's colour, the glove points at it, its row is lit in that colour and its name tinted, and the other covers and rows dim. While the glove is among the games or in the bar, the commands' glove rests.
- **The scene behind the menu follows the glove, smoothly** (added after the owner asked for smoother changes). A command shows its scene; a chosen game shows its own cover art. No command shares a game's picture any more: _Compare_ now shows Junon and _Network_ the Shinra lobby (they had shown the Remake and INTERmission key art). The scene waits 90 ms for the glove to settle, so holding a key goes straight to where it stops instead of flickering through every picture.
- **A smoother crossfade everywhere** (`Backdrop.tsx`): a layer per picture, faded with CSS transitions rather than restarted animations, so a picture interrupted mid-fade carries on from where it was instead of jumping. The new one fades in over 1.2 s, settling from slightly larger; the old ones fade out a moment later, so the screen never dips to dark between them; each goes once faded. Under reduced motion the change is immediate.

## Consequences

- ✅ The menu plays like the game's: one hand on the keys moves through all of it.
- ❌ W A S D and the arrows can't scroll the home page; it fits the screen, so there's nothing to scroll.
