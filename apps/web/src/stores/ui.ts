import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// UI state that is neither server data nor part of the URL.

/** Motion: follow the system setting, or the visitor's own choice (blueprint §33). */
export type MotionSetting = "system" | "reduced" | "full";
/** The title screen: on every visit, once per browser session, or never. */
export type BootSetting = "always" | "session" | "off";
/** The pointer: the game's Mako arrowhead, or the system's own. */
export type CursorSetting = "game" | "system";

interface UiState {
  /** The one-time spoiler notice has been dismissed (docs/model/spoilers.md). Remembered. */
  noticeDismissed: boolean;
  dismissNotice: () => void;
  /** How much the interface animates. Remembered. */
  motion: MotionSetting;
  setMotion: (motion: MotionSetting) => void;
  /** When the title screen plays. Remembered. */
  boot: BootSetting;
  setBoot: (boot: BootSetting) => void;
  /** Which pointer to show on devices that have one. Remembered. */
  cursor: CursorSetting;
  setCursor: (cursor: CursorSetting) => void;
  /** The title screen has finished this visit (the home menu waits for it). Not remembered. */
  booted: boolean;
  setBooted: () => void;
  /** Bumped to play the title screen again, from Settings. Not remembered. */
  bootReplay: number;
  replayBoot: () => void;
  /** The search palette is open. Not remembered. */
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      noticeDismissed: false,
      dismissNotice: () => {
        set({ noticeDismissed: true });
      },
      motion: "system",
      setMotion: (motion) => {
        set({ motion });
      },
      boot: "session",
      setBoot: (boot) => {
        set({ boot });
      },
      cursor: "game",
      setCursor: (cursor) => {
        set({ cursor });
      },
      booted: false,
      setBooted: () => {
        set({ booted: true });
      },
      bootReplay: 0,
      replayBoot: () => {
        set((state) => ({ bootReplay: state.bootReplay + 1 }));
      },
      paletteOpen: false,
      setPaletteOpen: (open) => {
        set({ paletteOpen: open });
      },
    }),
    {
      name: "ffvii-ui",
      // Storage can be unavailable (private windows, blocked site data): fall back to memory.
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return sessionStorage;
        }
      }),
      partialize: (state) => ({
        noticeDismissed: state.noticeDismissed,
        motion: state.motion,
        boot: state.boot,
        cursor: state.cursor,
      }),
      // Version 1 had no boot or cursor setting; the defaults fill them in.
      version: 2,
      migrate: (persisted) => persisted as Partial<UiState>,
    },
  ),
);
