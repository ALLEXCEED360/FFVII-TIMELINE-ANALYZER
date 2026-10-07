import type { Reference, TitleCode } from "../../api/client";
import { titleShort } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";

/** Small diamonds, one per title, e.g. for which titles establish a relationship. */
export function TitleDots({
  titles,
  reference,
  describe,
}: {
  titles: readonly TitleCode[];
  reference: Reference | undefined;
  /** Extra text for a title's tooltip, e.g. its citations. */
  describe?: (title: TitleCode) => string;
}) {
  return (
    <span className="flex gap-1">
      {titles.map((title) => {
        const name = titleShort(reference, title);
        const detail = describe?.(title);
        return (
          <span
            key={title}
            role="img"
            aria-label={name}
            title={detail ? `${name}: ${detail}` : name}
            className="size-2 rotate-45"
            style={{ background: TITLE_COLOR[title] }}
          />
        );
      })}
    </span>
  );
}
