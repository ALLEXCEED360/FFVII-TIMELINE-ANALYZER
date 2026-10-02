import type { ArtEntry } from "../../art/manifest";
import { ArtCredit, Artwork } from "../../components/Artwork";

/** Which look a modern image shows, from its title. */
function lookOf(entry: ArtEntry): string | undefined {
  if (entry.era !== "modern") return undefined;
  if (entry.title.includes("Rebirth")) return "Rebirth";
  if (entry.title.includes("INTERmission")) return "INTERmission";
  return "Remake";
}

/**
 * An entity's figure: the Remake/Rebirth look standing on a slanted plate, and — for characters
 * the original drew — its artwork pinned beside it on a paper card. Then and now, side by side.
 */
export function Portrait({ main, original }: { main: ArtEntry; original?: ArtEntry }) {
  const look = lookOf(main);
  return (
    <figure className="relative mx-auto flex w-full max-w-[28rem] flex-col">
      <div className="relative flex h-[20rem] items-end justify-center sm:h-[26rem] lg:h-[30rem]">
        {/* The plate the figure stands on. */}
        <span
          aria-hidden="true"
          className="halftone absolute inset-x-8 top-8 bottom-4 -skew-x-6 border border-mako-500/30 bg-gradient-to-b from-mako-900/40 to-night-950/80"
        />
        <span
          aria-hidden="true"
          className="absolute right-6 bottom-4 left-12 h-2 -skew-x-[30deg] bg-mako-400/80"
        />
        <Artwork
          entry={main}
          eager
          className="relative z-10 max-h-full w-auto object-contain drop-shadow-[0_24px_28px_rgb(0_0_0/0.85)]"
        />
        {look && (
          <span className="absolute top-10 right-6 z-20 bg-ink/85 px-2 py-0.5 font-display text-xs font-bold tracking-[0.2em] text-mako-300 uppercase italic">
            {look}
          </span>
        )}
        {original && (
          <div className="absolute bottom-0 left-0 z-20 w-28 -rotate-[4deg] drop-shadow-[5px_5px_0_var(--color-mako-600)] sm:w-32">
            <div className="paper p-1.5">
              <div className="flex h-32 items-end justify-center overflow-hidden bg-paper-dim sm:h-40">
                <Artwork entry={original} className="max-h-full w-auto object-contain" />
              </div>
              <p className="pt-1 text-center font-display text-[0.6875rem] font-bold tracking-[0.18em] text-ink uppercase italic">
                Original · 1997
              </p>
            </div>
          </div>
        )}
      </div>
      <figcaption className="flex flex-wrap justify-end gap-x-3 pt-2">
        <ArtCredit entry={main} />
        {original && original.artist !== main.artist && <ArtCredit entry={original} />}
      </figcaption>
    </figure>
  );
}
