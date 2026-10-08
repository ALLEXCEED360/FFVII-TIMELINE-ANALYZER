import { Link } from "react-router";
import { type ArtEntry, artSrc, artwork } from "../art/manifest";

// Fades are masks on the image itself, so it dissolves into whatever is behind it.
const FADES = {
  none: undefined,
  bottom: "linear-gradient(to top, transparent, #000 38%)",
  left: "linear-gradient(to right, transparent, #000 40%)",
} as const;

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
  if (!entry) return null;
  return (
    <img
      src={artSrc(entry)}
      width={entry.width}
      height={entry.height}
      alt={decorative ? "" : entry.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={`${entry.kind === "lineart" ? "lineart" : ""} ${className}`}
      style={{ objectPosition: entry.focus, maskImage: FADES[fade] }}
    />
  );
}

/** A small credit line under an artwork, linking to the Credits page. */
export function ArtCredit({ entry, className = "" }: { entry: ArtEntry; className?: string }) {
  return (
    <Link
      to="/credits"
      className={`inline-block min-h-6 py-0.5 font-mono text-[0.625rem] tracking-wider text-steel-400 hover:text-steel-100 ${className}`}
    >
      Art: {entry.artist} · © Square Enix
    </Link>
  );
}
