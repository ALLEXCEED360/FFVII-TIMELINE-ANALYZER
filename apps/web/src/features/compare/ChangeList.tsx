import type { ReactNode } from "react";
import { Link } from "react-router";
import type { DifferenceListItem, Reference } from "../../api/client";
import { pictureFor } from "../../art/manifest";
import { Artwork } from "../../components/Artwork";
import { KIND_LABELS, comparePath, entityPath, isEntityKind } from "../../lib/paths";
import { ChangesByKind } from "./pieces";

/** Everything changed about one moment, person or place. */
export interface ChangeGroup {
  entity: DifferenceListItem["entity"];
  items: DifferenceListItem[];
}

const kindWord = (kind: string) => (isEntityKind(kind) ? KIND_LABELS[kind].one : kind);

const countWords = (items: readonly DifferenceListItem[]) => {
  const big = items.filter((d) => d.magnitude === "major").length;
  return [
    items.length === 1 ? "1 change" : `${String(items.length)} changes`,
    big > 0 ? `${String(big)} big` : null,
  ];
};

/** What changes, one row for each thing: the glove points at it, and choosing it lights it. */
export function ChangeList({
  groups,
  selected,
  onSelect,
  detail,
}: {
  groups: readonly ChangeGroup[];
  selected: string | null;
  onSelect: (id: string) => void;
  /** What opens under the chosen row on a narrow screen. */
  detail: ReactNode;
}) {
  return (
    <ul className="m-panel cmp-list">
      {groups.map(({ entity, items }) => {
        const on = entity.id === selected;
        const [count, big] = countWords(items);
        return (
          <li
            key={entity.id}
            id={`change-${entity.id}`}
            className="cmp-row"
            data-selected={on || undefined}
          >
            <span aria-hidden="true" className="ff7-hand cmp-glove">
              ☞
            </span>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => {
                onSelect(entity.id);
              }}
              className="m-heading cmp-row-button"
            >
              {entity.name}
            </button>
            <p className="m-label cmp-row-meta">
              {kindWord(entity.kind)} · {count}
              {big && <span className="cmp-row-big"> · {big}</span>}
            </p>
            <p className="cmp-row-text">{items[0]?.summary}</p>
            {on && detail}
          </li>
        );
      })}
    </ul>
  );
}

/** The chosen thing's changes, in one of the original's blue windows. */
export function ChangeWindow({
  group: { entity, items },
  reference,
  onClose,
}: {
  group: ChangeGroup;
  reference: Reference | undefined;
  onClose: () => void;
}) {
  const art = pictureFor(entity.id, entity.kind);
  const [count, big] = countWords(items);
  return (
    <aside aria-label="What changes" className="ff7-window cmp-window">
      <button type="button" onClick={onClose} className="cmp-close">
        Close
      </button>
      {art && (
        <div aria-hidden="true" className="cmp-window-art" data-kind={art.kind}>
          <Artwork entry={art} decorative eager />
        </div>
      )}
      <header className="cmp-window-head">
        <p className="m-label">{kindWord(entity.kind)}</p>
        <h2 className="m-heading cmp-window-name">{entity.name}</h2>
        <p className="cmp-window-count">
          {count} from the original to the Remake Trilogy
          {big && <span className="cmp-row-big"> · {big}</span>}
        </p>
      </header>
      <ChangesByKind differences={items} reference={reference} />
      <nav aria-label="Learn more" className="cmp-window-more">
        <Link to={comparePath(entity.id)} className="m-row-link">
          See it side by side
        </Link>
        <Link to={entityPath(entity.id)} className="m-row-link">
          Everything about it
        </Link>
      </nav>
    </aside>
  );
}
