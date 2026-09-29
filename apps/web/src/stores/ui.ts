import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// UI state that is neither server data nor part of the URL.

/** Motion: follow the system setting, or the visitor's own choice (blueprint §33). */
export type MotionSetting = "system" | "reduced" | "full";

interface UiState {
  /** The one-time spoiler notice has been dismissed (docs/model/spoilers.md). Remembered. */
  noticeDismissed: boolean;
  dismissNotice: () => void;
  /** How much the interface animates. Remembered. */
  motion: MotionSetting;
  setMotion: (motion: MotionSetting) => void;
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
      partialize: (state) => ({ noticeDismissed: state.noticeDismissed, motion: state.motion }),
      version: 1,
    },
  ),
);
