import { useEffect } from "react";
import { useUi } from "../stores/ui";
import { useMediaQuery } from "./useMediaQuery";

// Reduced motion (blueprint §33): the visitor's Motion setting wins; "system" follows the
// operating system's preference. CSS reads the setting from <html data-motion>.

/** Whether animations should be skipped, for code that animates outside CSS (the graph). */
export function useReducedMotion(): boolean {
  const motion = useUi((s) => s.motion);
  const systemPrefers = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  return motion === "reduced" || (motion === "system" && systemPrefers);
}

/** Mirrors the Motion setting onto <html data-motion>, for the CSS rules in styles.css. */
export function useMotionAttribute(): void {
  const motion = useUi((s) => s.motion);
  useEffect(() => {
    document.documentElement.dataset.motion = motion;
  }, [motion]);
}
