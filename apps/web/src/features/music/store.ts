import { create } from "zustand";
import { TRACKS } from "./library";

// The background music's state: on or off, how loud, shuffled or in order (remembered), and what's
// playing now (not). BackgroundMusic.tsx plays it; Config (SettingsPage) and the keys change it.

interface MusicState {
  on: boolean;
  /** 0–100. */
  volume: number;
  shuffle: boolean;
  /** The track playing (or paused), by id. */
  current: string | null;
  /** What played before, newest last, for Previous. */
  history: string[];
  /** Paused by the visitor. */
  paused: boolean;
  /** Actually sounding now, as the audio reports it. */
  sounding: boolean;
  /** Where in the track it is, and how long it is, in seconds (from the audio). */
  time: number;
  length: number;
  /** A position asked for (Config's progress bar); the player seeks there and clears it. */
  seekTo: number | null;
  /** Bumped each time a track starts, so the now-playing card shows. */
  started: number;
  setOn: (on: boolean) => void;
  setVolume: (volume: number) => void;
  setShuffle: (shuffle: boolean) => void;
  /** Play this track now. */
  play: (id: string) => void;
  /** The next track: a random other one when shuffled, else the next in the list. */
  next: () => void;
  /** The track before: from the start of this one if it's under way, else the one played before. */
  previous: () => void;
  togglePause: () => void;
  seek: (seconds: number) => void;
  setSounding: (sounding: boolean) => void;
  setTime: (time: number, length: number) => void;
  markStarted: () => void;
}

/** What comes after `current`, from `ids`. */
export function nextTrack(
  ids: readonly string[],
  current: string | null,
  shuffle: boolean,
  random: () => number = Math.random,
): string | null {
  if (ids.length === 0) return null;
  if (!shuffle) {
    const at = current ? ids.indexOf(current) : -1;
    return ids[(at + 1) % ids.length] ?? null;
  }
  const others = ids.length > 1 ? ids.filter((id) => id !== current) : ids;
  return others[Math.floor(random() * others.length)] ?? null;
}

/** What comes before `current`: the last one played, else (in order) the one above it. */
export function previousTrack(
  ids: readonly string[],
  current: string | null,
  history: readonly string[],
  shuffle: boolean,
): string | null {
  if (history.length > 0) return history.at(-1) ?? null;
  if (shuffle || ids.length === 0) return current;
  const at = current ? ids.indexOf(current) : 0;
  return ids[(at - 1 + ids.length) % ids.length] ?? null;
}

const SAVED = "ffvii-music";
type Saved = Pick<MusicState, "on" | "volume" | "shuffle">;

/** The remembered choices; storage can be unavailable (private windows, blocked site data). */
function loadSaved(): Partial<Saved> {
  try {
    return JSON.parse(localStorage.getItem(SAVED) ?? "{}") as Partial<Saved>;
  } catch {
    return {};
  }
}

const saved = loadSaved();
/** Under this many seconds in, Previous goes to the track before rather than to the start. */
const RESTART_AFTER = 3;

export const useMusic = create<MusicState>()((set, get) => ({
  on: saved.on ?? true,
  volume: saved.volume ?? 40,
  shuffle: saved.shuffle ?? true,
  current: null,
  history: [],
  paused: false,
  sounding: false,
  time: 0,
  length: 0,
  seekTo: null,
  started: 0,
  setOn: (on) => {
    set({ on });
  },
  setVolume: (volume) => {
    set({ volume: Math.min(100, Math.max(0, Math.round(volume))) });
  },
  setShuffle: (shuffle) => {
    set({ shuffle });
  },
  play: (id) => {
    const { current, history } = get();
    set({
      current: id,
      history: current && current !== id ? [...history, current].slice(-50) : history,
      paused: false,
      on: true,
      time: 0,
    });
  },
  next: () => {
    const { current, shuffle, history } = get();
    const id = nextTrack(
      TRACKS.map((t) => t.id),
      current,
      shuffle,
    );
    set({
      current: id,
      history: current ? [...history, current].slice(-50) : history,
      paused: false,
      time: 0,
    });
  },
  previous: () => {
    const { current, history, shuffle, time } = get();
    if (current && time > RESTART_AFTER) {
      set({ seekTo: 0, paused: false });
      return;
    }
    const id = previousTrack(
      TRACKS.map((t) => t.id),
      current,
      history,
      shuffle,
    );
    set({
      current: id,
      history: history.length > 0 ? history.slice(0, -1) : history,
      paused: false,
      time: 0,
      ...(id === current ? { seekTo: 0 } : {}),
    });
  },
  togglePause: () => {
    set((s) => ({ paused: !s.paused }));
  },
  seek: (seconds) => {
    set({ seekTo: Math.max(0, seconds), time: Math.max(0, seconds) });
  },
  setSounding: (sounding) => {
    set({ sounding });
  },
  setTime: (time, length) => {
    set({ time, length, ...(get().seekTo !== null ? { seekTo: null } : {}) });
  },
  markStarted: () => {
    set((s) => ({ started: s.started + 1 }));
  },
}));

// Remember the choices whenever they change.
useMusic.subscribe((state, before) => {
  if (
    state.on === before.on &&
    state.volume === before.volume &&
    state.shuffle === before.shuffle
  ) {
    return;
  }
  try {
    localStorage.setItem(
      SAVED,
      JSON.stringify({ on: state.on, volume: state.volume, shuffle: state.shuffle }),
    );
  } catch {
    // Not remembered this time.
  }
});
