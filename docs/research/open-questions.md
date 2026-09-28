# Open questions

Things not yet verified well enough to go into `data/`, and facts in `data/` that still need a stronger check. Resolve each by checking the game or footage (`canon-and-sources.md` §4), then delete it from this list.

## Needs checking against footage

Facts in v0.1 that rest on transcript stage directions (what is _shown_), not dialogue:

- **Aerith's death, Rebirth ch. 14** — Cloud appearing to block Sephiroth's blade before the scene resolves into her death; the funeral at the pool; Cloud seeing Aerith afterwards while Tifa does not. (`event_aerith_death`)
- **Aerith's funeral, OG disc 2** — laid to rest in the water in the cinematic that opens disc 2. Located via a walkthrough's screenshot caption only. (`event_aerith_death`)
- **Remake ch. 18 ending** — Zack surviving the fight outside Midgar and carrying Cloud; dialogue supports it, visuals unchecked. (`world_zack_survives`)

## Not yet in the dataset

- **Zack's last stand** (the branch point of `world_zack_survives`). The original shows his death only visually, in an optional flashback that becomes available after "Inside Cloud's Mind"; the transcript has no dialogue that states it.
- **Rebirth chapter ranges per arc.** `reference/arcs.yaml` lists Remake's chapters for the Midgar arc only. Rebirth's chapter-to-arc mapping needs a chapter-by-chapter check; the wiki transcript is incomplete for chapters 8–9.
- **Rebirth's main-world view of the plate fall and Midgar.** Only the Zack-world interlude is recorded so far.

## Structure

- **Disc 2/3 boundary.** Placed after the Highwind scenes (`og_highwind` on disc 2), per a walkthrough; confirm in-game.
- **Chapter title capitalization.** Sources disagree on small words (e.g. "Deeper into Darkness" vs "Deeper Into Darkness"); use the in-game spelling once checked.
- **Eras** in `reference/eras.yaml` are provisional display ranges; revisit as dated events are added.
