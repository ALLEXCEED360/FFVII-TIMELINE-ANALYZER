import { useEffect, useRef } from "react";

/** How long a chosen row is held where it was tapped while the page settles around it. */
const HOLD_PLACE_MS = 1000;

/**
 * Keeps a chosen row where it was tapped. On a narrow screen, choosing another row closes the
 * window open above it, which would pull the page up under the finger; and the router puts the
 * page back where it was when the address changes. So after `chosen` changes, the row is held at
 * its old place on screen frame by frame for a moment (a slow phone settles late). Scrolling by
 * hand, or pressing anything, lets go at once.
 *
 * Call the returned function with the row's element id just before choosing it.
 */
export function useKeepInPlace(chosen: unknown): (id: string) => void {
  const tapped = useRef<{ id: string; top: number } | null>(null);

  useEffect(() => {
    const was = tapped.current;
    tapped.current = null;
    if (!was) return;
    const until = performance.now() + HOLD_PLACE_MS;
    let frame = 0;
    const keep = () => {
      const row = document.getElementById(was.id);
      const moved = row ? row.getBoundingClientRect().top - was.top : 0;
      if (Math.abs(moved) >= 1) window.scrollBy({ top: moved, behavior: "instant" });
      if (performance.now() < until) frame = requestAnimationFrame(keep);
    };
    const letGo = () => {
      cancelAnimationFrame(frame);
    };
    keep();
    const byHand = ["pointerdown", "touchmove", "wheel", "keydown"] as const;
    for (const type of byHand) window.addEventListener(type, letGo, { passive: true });
    return () => {
      letGo();
      for (const type of byHand) window.removeEventListener(type, letGo);
    };
  }, [chosen]);

  return (id: string) => {
    const row = document.getElementById(id);
    tapped.current = row ? { id, top: row.getBoundingClientRect().top } : null;
  };
}
