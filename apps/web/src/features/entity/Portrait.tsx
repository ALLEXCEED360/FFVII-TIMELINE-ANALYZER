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
 * A person's figure (decision 0025): the Remake/Rebirth look standing in a ring of Mako light,
 * and — for characters the original drew — its artwork on a card beside it. Then and now.
 */
export function Portrait({ main, original }: { main: ArtEntry; original?: ArtEntry }) {
  const look = lookOf(main);
  return (
    <figure className="ent-portrait">
      <div className="ent-portrait-stage">
        <span aria-hidden="true" className="ent-portrait-ring" />
        <Artwork entry={main} eager className="ent-portrait-figure" />
        {look && <span className="ent-portrait-look">As seen in {look}</span>}
        {original && (
          <div className="ent-portrait-then">
            <div className="ent-portrait-then-art">
              <Artwork entry={original} />
            </div>
            <p className="ent-portrait-then-label">The original, 1997</p>
          </div>
        )}
      </div>
      <figcaption className="ent-credits">
        <ArtCredit entry={main} />
        {original && original.artist !== main.artist && <ArtCredit entry={original} />}
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
