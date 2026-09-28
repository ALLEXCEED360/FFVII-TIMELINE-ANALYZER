# Source log

Every source used to build or verify the dataset, what it was used for, and how much it can be trusted (`canon-and-sources.md` §4). Update this whenever a new source is used.

## Verification sources

| Source                                                                                                | Covers                   | Used for                                              | Level                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Final Fantasy Wiki — _Final Fantasy VII script_ (full transcript of the original PlayStation release) | `og`                     | Checking dialogue and on-screen text; segment order   | 3 — transcript                                                                         |
| Final Fantasy Wiki — _Final Fantasy VII Remake script_ (includes _Episode INTERmission_)              | `remake`, `intermission` | Checking dialogue and on-screen text; chapter titles  | 3 — transcript                                                                         |
| Final Fantasy Wiki — _Final Fantasy VII Rebirth script_                                               | `rebirth`                | Checking dialogue; stage directions for visual scenes | 3 — transcript (incomplete: chapter 8 is empty and chapter 9 is thin as of 2026-09-27) |

Accessed 2026-09-27 through the wiki's API (page wikitext), and read in full for the scenes cited. Transcripts are evidence for **what is said**. Their stage directions (text in parentheses) are fan descriptions of what is shown, so any fact that depends on them is listed in [`open-questions.md`](open-questions.md) until checked against footage. No wiki text is copied into `data/`.

## Locating sources (never evidence)

| Source                                                   | Used for                                                                                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Yinza.com _Final Fantasy VII Complete Script_ index      | The original's scene order (48 sections), cross-checked with the wiki transcript                                                               |
| Jegged.com _Final Fantasy VII_ walkthrough, disc indexes | Disc boundaries: disc 1 ends with Aerith's death; disc 2 opens with her funeral and ends after the Highwind scenes that follow the Hojo battle |
| gamepressure.com, Game8, Game Rant chapter lists         | Chapter titles for `remake`, `intermission` and `rebirth`, cross-checked against the wiki transcripts' headings                                |
| Square Enix press release (June 2026)                    | _Final Fantasy VII Revelation_ as the final part of the Remake series, due Spring 2027                                                         |

## Release dates

`og` 1997-01-31 (Japan), `remake` 2020-04-10, `intermission` 2021-06-10 (with _Intergrade_), `rebirth` 2024-02-29 — first worldwide/Japanese release of each.
