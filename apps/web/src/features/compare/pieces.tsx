import { type CSSProperties, useId, useMemo, useState } from "react";
import { Link } from "react-router";
import type {
  Appearance,
  ComparedRelationship,
  ComparisonColumn,
  Difference,
  EntityList,
  Reference,
  TitleCode,
} from "../../api/client";
import type { ArtEntry } from "../../art/manifest";
import { Artwork } from "../../components/Artwork";
import { Citation, Citations } from "../../components/Citation";
import {
  ENTITY_KINDS,
  type EntityKind,
  KIND_LABELS,
  comparePath,
  entityPath,
} from "../../lib/paths";
import { CHANGE_WORDS, STATUS_SENTENCES, STATUS_WORDS, tellingOf } from "../../lib/plain";
import { TITLE_ORDER, describeLocator, titleShort, worldName } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import { PRESETS, sameTitles, toggleTitle } from "./titles";

// The compare section's pieces, for someone new to the story (decision 0021): plain words, the
// modern panels (components/modern.css), and nothing an expert alone would need.

const gameStyle = (code: TitleCode) => ({ "--c": TITLE_COLOR[code] }) as CSSProperties;

/** A game's name with its coloured diamond. */
export function Game({ code, reference }: { code: TitleCode; reference: Reference | undefined }) {
  return (
    <span className="cmp-game" style={gameStyle(code)}>
      <span aria-hidden="true" className="cmp-game-mark" />
      {titleShort(reference, code)}
    </span>
  );
}

/** Which games to compare: the usual pairs as large buttons, and each game on its own. */
export function GamePicker({
  titles,
  reference,
  onChange,
}: {
  titles: readonly TitleCode[];
  reference: Reference | undefined;
  onChange: (titles: TitleCode[]) => void;
}) {
  return (
    <div className="cmp-picker">
      <div role="group" aria-label="Pairs" className="cmp-pairs">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            aria-pressed={sameTitles(titles, preset.titles)}
            onClick={() => {
              onChange([...preset.titles]);
            }}
            className="cmp-pair"
          >
            <span aria-hidden="true" className="cmp-pair-marks">
              {preset.titles.map((code) => (
                <span key={code} className="cmp-game-mark" style={gameStyle(code)} />
              ))}
            </span>
            {preset.label}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Games to compare" className="m-choices">
        {TITLE_ORDER.map((code) => {
          const on = titles.includes(code);
          return (
            <button
              key={code}
              type="button"
              aria-pressed={on}
              // Two games at least: there's nothing to compare with one.
              disabled={on && titles.length <= 2}
              onClick={() => {
                onChange(toggleTitle(titles, code));
              }}
              className="m-choice"
              style={gameStyle(code)}
            >
              <span aria-hidden="true" className="m-choice-box" />
              {titleShort(reference, code)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One change between two tellings, in plain words, with where to see it tucked underneath. */
export function Change({
  difference,
  reference,
}: {
  difference: Difference;
  reference: Reference | undefined;
}) {
  return (
    <li className="cmp-change">
      <p className="cmp-change-head">
        <Game code={difference.from.title} reference={reference} />
        <span aria-hidden="true" className="cmp-arrow">
          →
        </span>
        <span className="sr-only">compared with</span>
        <Game code={difference.to.title} reference={reference} />
        {difference.magnitude === "major" && <span className="cmp-tag cmp-big">Big change</span>}
        {difference.certainty === "ambiguous" && (
          <span className="cmp-tag">The game leaves this open</span>
        )}
      </p>
      <p className="cmp-text">{difference.summary}</p>
      {difference.notes && <p className="cmp-note">{difference.notes}</p>}
      <p className="cmp-sources">
        Where to see it: <Citations sources={difference.sources} reference={reference} />
      </p>
    </li>
  );
}

/** Changes grouped by what kind of change they are. */
export function ChangesByKind({
  differences,
  reference,
}: {
  differences: readonly Difference[];
  reference: Reference | undefined;
}) {
  const kinds = [...new Set(differences.map((d) => d.category))];
  const id = useId();
  return (
    <div className="cmp-kinds">
      {kinds.map((kind) => (
        <section key={kind} aria-labelledby={`${id}-${kind}`}>
          <h3 id={`${id}-${kind}`} className="m-label cmp-kind">
            {CHANGE_WORDS[kind]}
          </h3>
          <ul className="cmp-changes">
            {differences
              .filter((d) => d.category === kind)
              .map((d) => (
                <Change key={d.id} difference={d} reference={reference} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** How one game tells it: how (for an event), its own account, where in the game. */
function Telling({
  appearance,
  reference,
  event,
}: {
  appearance: Appearance;
  reference: Reference | undefined;
  /** "Shown in a flashback" describes an event; a person or a place isn't "shown as it happens". */
  event: boolean;
}) {
  const depiction = appearance.depictions.find((d) => d.isPrimary) ?? appearance.depictions[0];
  const where = depiction?.locator ?? appearance.sources[0];
  return (
    <div className="cmp-telling">
      {event && (
        <p className="cmp-how">
          {tellingOf({
            status: appearance.status,
            framing: depiction?.framing ?? (appearance.status === "referenced" ? "mention" : null),
            world: "world_main",
          })}
        </p>
      )}
      {appearance.role && <p className="cmp-role">{appearance.role}</p>}
      <p className="cmp-text">{appearance.summary}</p>
      {appearance.certainty === "ambiguous" && (
        <p className="cmp-note">The game leaves this open.</p>
      )}
      {where && (
        <p className="cmp-sources">
          Where: <Citation locator={where} reference={reference} />
        </p>
      )}
    </div>
  );
}

/** One game's panel: what it does with the subject, and its own account. */
export function GameColumn({
  column,
  reference,
  event,
  figure,
  labelled = true,
}: {
  column: ComparisonColumn;
  reference: Reference | undefined;
  event: boolean;
  /** A character's look in this game, where there's artwork of it. */
  figure?: ArtEntry;
  /** False inside a tab, which already names the game. */
  labelled?: boolean;
}) {
  const { appearance, status } = column;
  return (
    <section
      aria-labelledby={labelled ? `col-${column.title}` : undefined}
      className="m-panel cmp-col"
      style={gameStyle(column.title)}
    >
      <header className="cmp-col-head">
        {labelled && (
          <h2 id={`col-${column.title}`} className="m-heading cmp-col-name">
            {titleShort(reference, column.title)}
          </h2>
        )}
        <p className="cmp-status" data-status={status}>
          {STATUS_WORDS[status]}
        </p>
        {column.changed && <span className="cmp-tag cmp-big">Told differently</span>}
      </header>
      {figure && (
        <div aria-hidden="true" className="cmp-figure">
          <Artwork entry={figure} decorative />
        </div>
      )}
      {appearance ? (
        <Telling appearance={appearance} reference={reference} event={event} />
      ) : (
        <p className="cmp-empty">{STATUS_SENTENCES[status]}</p>
      )}
      {column.otherWorlds.map((other) => (
        <div key={other.world} className="cmp-other">
          <p className="m-label">In another world: {worldName(reference, other.world)}</p>
          <Telling appearance={other} reference={reference} event={event} />
        </div>
      ))}
    </section>
  );
}

/**
 * What the subject is connected to, and in which games: a mark where the game shows the
 * connection, a dash where it shows both but not the connection (a real difference), and a dot
 * where it doesn't show both, so says nothing about it.
 */
export function Connections({
  relationships,
  columns,
  reference,
}: {
  relationships: readonly ComparedRelationship[];
  columns: readonly ComparisonColumn[];
  reference: Reference | undefined;
}) {
  const ordered = [...relationships].sort((a, b) => Number(b.shared) - Number(a.shared));
  return (
    <div className="m-panel cmp-links">
      <ul aria-label="What the marks mean" className="cmp-key">
        <li>
          <span aria-hidden="true" className="cmp-yes">
            ✓
          </span>
          The game shows this connection
        </li>
        <li>
          <span aria-hidden="true" className="cmp-no">
            —
          </span>
          It shows both, but not connected
        </li>
        <li>
          <span aria-hidden="true" className="cmp-na">
            ·
          </span>
          It doesn&apos;t show both
        </li>
      </ul>
      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <caption className="sr-only">Which games show each connection</caption>
          <thead>
            <tr>
              <th scope="col">Connected to</th>
              {columns.map((c) => (
                <th key={c.title} scope="col">
                  <Game code={c.title} reference={reference} />
                </th>
              ))}
              <th scope="col">
                <span className="sr-only">In every game?</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => (
              <tr key={`${r.id}-${r.direction}`}>
                <th scope="row">
                  <Link to={entityPath(r.other.id)} className="cmp-link-name">
                    {r.other.name}
                  </Link>
                  <span className="cmp-link-label">{r.label}</span>
                </th>
                {columns.map((c) => {
                  const evidence = r.titles.find((t) => t.title === c.title);
                  return (
                    <td key={c.title}>
                      {evidence ? (
                        <span
                          className={evidence.certainty === "stated" ? "cmp-yes" : "cmp-maybe"}
                          title={evidence.sources
                            .map((s) => describeLocator(reference, s))
                            .join("; ")}
                        >
                          {evidence.certainty === "stated" ? "✓" : "?"}
                          <span className="sr-only">
                            {evidence.certainty === "stated"
                              ? "Shows it"
                              : "Shows it, but leaves it open"}
                          </span>
                        </span>
                      ) : r.applicable.includes(c.title) ? (
                        <span className="cmp-no">
                          —<span className="sr-only">Shows both, but not connected</span>
                        </span>
                      ) : (
                        <span className="cmp-na">
                          ·<span className="sr-only">Doesn&apos;t show both</span>
                        </span>
                      )}
                    </td>
                  );
                })}
                <td>
                  {r.shared ? (
                    <span className="cmp-tag">In every game</span>
                  ) : (
                    <span className="cmp-tag cmp-big">Differs between games</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Anything told by two games or more, found by name or kind, opening its side-by-side view. */
export function ThingPicker({
  entities,
  reference,
  withTitles,
}: {
  entities: readonly EntityList["items"][number][];
  reference: Reference | undefined;
  withTitles: (path: string) => string;
}) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<EntityKind>("event");
  const query = text.trim().toLowerCase();
  const shown = useMemo(
    () =>
      entities
        .filter((e) => e.titles.length >= 2)
        // A search looks across every kind; otherwise the chosen kind.
        .filter((e) => (query ? e.name.toLowerCase().includes(query) : e.kind === kind))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [entities, query, kind],
  );
  return (
    <section aria-labelledby="cmp-pick" className="m-panel cmp-pick">
      <h2 id="cmp-pick" className="m-label">
        Compare anything side by side
      </h2>
      <input
        type="search"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        aria-label="Find something to compare"
        placeholder="Find a character, event or place…"
        className="cmp-search"
      />
      {!query && (
        <div role="group" aria-label="Kinds" className="m-choices">
          {ENTITY_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k);
              }}
              className="m-choice"
            >
              {KIND_LABELS[k].many}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="cmp-empty">Nothing by that name is told by two games.</p>
      ) : (
        <ul aria-label="Things to compare" className="cmp-pick-list">
          {shown.map((entity) => (
            <li key={entity.id}>
              <Link to={withTitles(comparePath(entity.id))} className="cmp-pick-item">
                <span>{entity.name}</span>
                <span aria-hidden="true" className="cmp-pick-games">
                  {TITLE_ORDER.filter((t) => entity.titles.includes(t)).map((t) => (
                    <span
                      key={t}
                      className="cmp-game-mark"
                      style={gameStyle(t)}
                      title={titleShort(reference, t)}
                    />
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
