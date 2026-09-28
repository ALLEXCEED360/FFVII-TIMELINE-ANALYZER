import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// UI state that is neither server data nor part of the URL. Remembered per browser.

interface UiState {
  /** The one-time spoiler notice has been dismissed (docs/model/spoilers.md). */
  noticeDismissed: boolean;
  dismissNotice: () => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      noticeDismissed: false,
      dismissNotice: () => {
        set({ noticeDismissed: true });
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
      version: 1,
    },
  ),
);
