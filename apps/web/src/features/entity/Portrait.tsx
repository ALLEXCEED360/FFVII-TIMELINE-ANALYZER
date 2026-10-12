import { detailsFor } from "../../art/details";
import type { ArtEntry } from "../../art/manifest";
import { ArtCredit, Artwork } from "../../components/Artwork";

/** Which look a modern image shows, from its credited title. */
function lookOf(entry: ArtEntry): string | undefined {
  if (entry.era !== "modern") return undefined;
  const { title } = detailsFor(entry);
  if (title.includes("Rebirth")) return "Rebirth";
  if (title.includes("INTERmission")) return "INTERmission";
  // The trilogy's third game isn't out yet; its promo art shows the trilogy's look.
  if (title.includes("Revelation")) return "the Remake Trilogy";
  return "Remake";
}

/** A person's modern look in a ring of light, with the original's art beside it. */
export function Portrait({ main, original }: { main: ArtEntry; original?: ArtEntry }) {
  const look = lookOf(main);
  return (
    <figure className="ent-portrait">
      {/* A figure wider than tall (Red XIII) is centred in the ring rather than standing on it. */}
      <div className="ent-portrait-stage" data-wide={main.width > main.height || undefined}>
        <span aria-hidden="true" className="ent-portrait-ring" />
        <Artwork entry={main} eager className="ent-portrait-figure" />
        {look && <span className="ent-portrait-look">As seen in {look}</span>}
        {original && (
          <div
            className="ent-portrait-then"
            data-wide={original.width > original.height || undefined}
          >
            <div className="ent-portrait-then-art">
              <Artwork entry={original} />
            </div>
            <p className="ent-portrait-then-label">The original, 1997</p>
          </div>
        )}
      </div>
      <figcaption className="ent-credits">
        <ArtCredit entry={main} />
        {original && detailsFor(original).artist !== detailsFor(main).artist && (
          <ArtCredit entry={original} />
        )}
      </figcaption>
    </figure>
  );
}

/** A moment's, place's or group's picture, framed, whole. */
export function Picture({ entry }: { entry: ArtEntry }) {
  return (
    <figure className="ent-picture">
      <div className="m-panel ent-picture-frame" data-kind={entry.kind}>
        <Artwork entry={entry} eager />
      </div>
      <figcaption className="ent-credits">
        <ArtCredit entry={entry} />
      </figcaption>
    </figure>
  );
}
