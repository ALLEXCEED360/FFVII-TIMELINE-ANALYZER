// The guide's background music: every audio file in src/music, found at build time (see
// src/music/README.md). A folder is an album; its album.json names it and credits each track, and its
// cover.webp is the album art. "01 - " before a folder or file name sets its order and isn't shown.

export interface Credits {
  composer?: string;
  arranger?: string;
  vocals?: string;
  lyrics?: string;
  /** Seconds, for the list before the file has loaded. */
  length?: number;
}

export interface Track extends Credits {
  id: string;
  title: string;
  /** From a file named "Artist - Title". */
  artist?: string;
  album?: string;
  /** The album's art. */
  cover?: string;
  url: string;
}

export interface AlbumInfo {
  title: string;
  subtitle?: string;
  year?: number;
  /** The artwork the cover was cut from (src/art/manifest.ts), for its credit. */
  art?: string;
  tracks?: Record<string, Credits>;
}

const AUDIO = import.meta.glob<string>(
  "../../music/**/*.{mp3,ogg,oga,opus,m4a,aac,wav,flac,webm}",
  { eager: true, query: "?url", import: "default" },
);
const INFO = import.meta.glob<AlbumInfo>("../../music/**/album.json", {
  eager: true,
  import: "default",
});
const COVERS = import.meta.glob<string>("../../music/**/cover.{webp,jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

/** "01 - Prelude" → "Prelude": a leading number only orders. */
const unnumbered = (name: string) => name.replace(/^\d+\s*[-.]\s*/, "").trim();

const folderOf = (path: string) => {
  const parts = decodeURIComponent(path)
    .replace(/^.*?\/music\//, "")
    .split("/");
  parts.pop();
  return parts.join("/");
};

/** A file's place under src/music, as its album, artist and title, with its album's credits. */
export function trackFromFile(path: string, url: string, info?: AlbumInfo, cover?: string): Track {
  const parts = decodeURIComponent(path)
    .replace(/^.*?\/music\//, "")
    .split("/");
  const fileName = parts.pop() ?? path;
  const file = fileName.replace(/\.[^.]+$/, "");
  const album = info?.title ?? (parts.length > 0 ? unnumbered(parts.join(" / ")) : undefined);
  const name = unnumbered(file);
  const split = name.indexOf(" - ");
  const named =
    split > 0
      ? { artist: name.slice(0, split).trim(), title: name.slice(split + 3).trim() }
      : { title: name };
  return {
    id: [...parts, file].join("/"),
    ...(album ? { album } : {}),
    ...(cover ? { cover } : {}),
    ...named,
    ...info?.tracks?.[fileName],
    url,
  };
}

/** In the folders' and files' own order (their numbers), then by name. */
export const TRACKS: readonly Track[] = Object.entries(AUDIO)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, url]) => {
    const folder = folderOf(path);
    const info = Object.entries(INFO).find(([p]) => folderOf(p) === folder)?.[1];
    const cover = Object.entries(COVERS).find(([p]) => folderOf(p) === folder)?.[1];
    return trackFromFile(path, url, info, cover);
  });

export interface Album {
  name: string | undefined;
  subtitle?: string;
  year?: number;
  cover?: string;
  tracks: readonly Track[];
}

/** The albums, in order, each with its tracks; loose files (no folder) come first, unnamed. */
export const ALBUMS: readonly Album[] = [...new Set(TRACKS.map((t) => t.album))].map((name) => {
  const tracks = TRACKS.filter((t) => t.album === name);
  const folder = folderOf(Object.keys(AUDIO).find((p) => tracks[0]?.url === AUDIO[p]) ?? "");
  const info = Object.entries(INFO).find(([p]) => folderOf(p) === folder)?.[1];
  return {
    name,
    ...(info?.subtitle ? { subtitle: info.subtitle } : {}),
    ...(info?.year ? { year: info.year } : {}),
    ...(tracks[0]?.cover ? { cover: tracks[0].cover } : {}),
    tracks,
  };
});

export function trackOf(id: string | null): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

/** Who wrote it, for the card and the list: the composer, else the artist from the file name. */
export function byline(track: Track): string | undefined {
  return track.composer ?? track.artist;
}

/** "4:18" */
export function duration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return "";
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, "0")}`;
}
