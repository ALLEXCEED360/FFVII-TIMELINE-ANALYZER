import { type RefObject, useLayoutEffect, useState } from "react";

/** The element's current width in pixels, kept up to date as it resizes. */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback = 800): number {
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth || fallback);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width || fallback);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref, fallback]);
  return width;
}
