import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { detailsFor } from "../art/details";
import { type ArtEntry, artSrc, artwork } from "../art/manifest";

// Fades are masks on the image itself, so it dissolves into whatever is behind it.
const FADES = {
  none: undefined,
  bottom: "linear-gradient(to top, transparent, #000 38%)",
  left: "linear-gradient(to right, transparent, #000 40%)",
} as const;

/** Shifts a lopsided figure so its body sits mid-box, measured from the width it actually draws. */
function useCentring(centre: number | undefined) {
  const ref = useRef<HTMLImageElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const img = ref.current;
    if (centre === undefined || !img || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const { clientWidth: boxW, clientHeight: boxH, naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h || !boxW || !boxH) return;
      // A contained image draws at the smaller of the two scales; a natural-size one at either.
      const drawn = w * Math.min(boxW / w, boxH / h);
      setShift(Math.round((0.5 - centre) * drawn));
    };
    measure();
    img.addEventListener("load", measure);
    const watch = new ResizeObserver(measure);
    watch.observe(img);
    return () => {
      img.removeEventListener("load", measure);
      watch.disconnect();
    };
  }, [centre]);
  return { ref, shift };
}

/** An image from the manifest, sized up front so it never shifts the layout; nothing if absent. */
export function Artwork({
  id,
  entry: given,
  className = "",
  eager = false,
  decorative = false,
  fade = "none",
}: {
  id?: string;
  entry?: ArtEntry;
  className?: string;
  eager?: boolean;
  /** Empty alt text, for images that repeat what the page already says. */
  decorative?: boolean;
  fade?: keyof typeof FADES;
}) {
  const entry = given ?? (id === undefined ? undefined : artwork(id));
  const { ref, shift } = useCentring(entry?.centre);
  if (!entry) return null;
  return (
    <img
      ref={ref}
      src={artSrc(entry)}
      width={entry.width}
      height={entry.height}
      alt={decorative ? "" : detailsFor(entry).alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={`${entry.kind === "lineart" ? "lineart" : ""} ${className}`}
      style={{
        objectPosition: entry.focus,
        maskImage: FADES[fade],
        translate: shift ? `${String(shift)}px 0` : undefined,
      }}
    />
  );
}

/** A small credit line under an artwork, linking to the Credits page. */
export function ArtCredit({ entry, className = "" }: { entry: ArtEntry; className?: string }) {
  return (
    <Link
      to="/credits"
      className={`inline-block min-h-6 py-0.5 font-mono text-[0.6875rem] tracking-wider text-steel-400 hover:text-steel-100 ${className}`}
    >
      Art: {detailsFor(entry).artist} · © Square Enix
    </Link>
  );
}
