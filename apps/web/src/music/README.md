# Background music

Put audio files here and the guide plays them in the background, like a sports game's menus: a
random track starts as you begin (the title screen's "press any button", or your first click), then
another when it ends. Config lists them all to pick from, skip, pause or turn off.

- **Formats:** `.mp3`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.wav`, `.flac` or `.webm`.
- **Folders:** each folder is shown as its own group in Config (one per game, say).
- **Order:** a number before a folder or file name — `1 - Final Fantasy VII (1997)`, `01 - Prelude.mp3`
  — sets the order for _In order_ playback and isn't shown.
- **Names:** `Artist - Title.mp3` shows as _Title_ by _Artist_; any other name is shown as the title.
- **Album art and credits (optional):** a `cover.webp` (or `.jpg`/`.png`) in a folder is its album
  art, on the now-playing card and in Config. An `album.json` names the album (`title`, `subtitle`,
  `year`) and credits each file under `tracks` by its file name: `composer`, `arranger`, `vocals`,
  `lyrics`, and `length` in seconds.
- **Rights:** only add music you're allowed to share on a public site — your own, or tracks whose
  licence permits it (and credit the artist in the file name if the licence asks). The Final Fantasy
  soundtracks belong to Square Enix and can't be used here without a licence.

Nothing else to register: the build finds every file in this folder and its folders.
