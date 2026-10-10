import { useEffect } from "react";
import { useMusic } from "./store";

/** The music's keys, said once for Config, the buttons' hints and the tests. */
export const MUSIC_KEYS = [
  { key: "C", code: "KeyC", does: "Next track" },
  { key: "X", code: "KeyX", does: "Previous track" },
  { key: "P", code: "KeyP", does: "Pause or play" },
] as const;

/**
 * C, X and P from anywhere: next, previous, pause. Not while typing in a box, nor with Ctrl, Alt or
 * ⌘ held (so copying and the browser's own keys still work), nor held down.
 */
export function useMusicKeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input:not([type=range]):not([type=radio]), textarea, select, [contenteditable='true']",
        )
      ) {
        return;
      }
      // On the title screen, any key just begins.
      if (document.querySelector(".boot")) return;
      const music = useMusic.getState();
      if (!music.on) return;
      if (event.code === "KeyC") music.next();
      else if (event.code === "KeyX") music.previous();
      else if (event.code === "KeyP") music.togglePause();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);
}
