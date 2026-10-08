import { type CSSProperties, useId, useMemo, useState } from "react";
import { Link } from "react-router";
import type {
  Appearance,
  ComparedRelationship,
  ComparisonColumn,
  Difference,
  DisplayStatus,
  EntityList,
  Reference,
  TitleCode,
} from "../../api/client";
import type { ArtEntry } from "../../art/manifest";
import { Artwork } from "../../components/Artwork";
import { Citation, Citations } from "../../components/Citation";
import { ENTITY_KINDS, type EntityKind, KIND_LABELS, entityPath } from "../../lib/paths";
import { CHANGE_WORDS, STATUS_SENTENCES, STATUS_WORDS, tellingOf } from "../../lib/plain";
import { TITLE_ORDER, titleShort, worldName } from "../../lib/reference";
import { TELLING, TELLINGS, type Telling as TellingKey } from "../../lib/tellings";
import { TITLE_COLOR } from "../../lib/titles";

// The compare section's pieces, shared with the entity pages.

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
export function Telling({
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

/** The order a telling's status is chosen in: what its games do with it, most telling first. */
const STATUS_RANK: readonly DisplayStatus[] = [
  "depicted",
  "referenced",
  "omitted",
  "not_yet_reached",
  "undocumented",
  "absent",
];

/** A telling's status: the strongest among its games. */
export function tellingStatus(columns: readonly ComparisonColumn[]): DisplayStatus {
  return STATUS_RANK.find((status) => columns.some((c) => c.status === status)) ?? "absent";
}

/**
 * One telling's panel: what it does with the subject, and each game's own account — within the
 * Remake Trilogy, every game that tells it, named.
 */
export function TellingColumn({
  telling,
  columns,
  reference,
  event,
  figure,
  labelled = true,
}: {
  telling: TellingKey;
  /** This telling's games' columns. */
  columns: readonly ComparisonColumn[];
  reference: Reference | undefined;
  event: boolean;
  /** A character's look in this telling, where there's artwork of it. */
  figure?: ArtEntry;
  /** False inside a tab, which already names the telling. */
  labelled?: boolean;
}) {
  const status = tellingStatus(columns);
  const told = columns.filter((c) => c.appearance);
  const named = telling === "trilogy";
  return (
    <section
      aria-labelledby={labelled ? `col-${telling}` : undefined}
      className="m-panel cmp-col"
      style={{ "--c": TELLING[telling].color } as CSSProperties}
    >
      <header className="cmp-col-head">
        {labelled && (
          <h2 id={`col-${telling}`} className="m-heading cmp-col-name">
            {TELLING[telling].name}
          </h2>
        )}
        <p className="cmp-status" data-status={status}>
          {STATUS_WORDS[status]}
        </p>
        {columns.some((c) => c.changed) && (
          <span className="cmp-tag cmp-big">Told differently</span>
        )}
      </header>
      {figure && (
        <div aria-hidden="true" className="cmp-figure">
          <Artwork entry={figure} decorative />
        </div>
      )}
      {told.length === 0 && <p className="cmp-empty">{STATUS_SENTENCES[status]}</p>}
      {told.map((column) => (
        <div key={column.title} className={named ? "cmp-game-telling" : undefined}>
          {named && (
            <p className="cmp-game-telling-name">
              <Game code={column.title} reference={reference} />
            </p>
          )}
          {column.appearance && (
            <Telling appearance={column.appearance} reference={reference} event={event} />
          )}
          {column.otherWorlds.map((other) => (
            <div key={other.world} className="cmp-other">
              <p className="m-label">In another world: {worldName(reference, other.world)}</p>
              <Telling appearance={other} reference={reference} event={event} />
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

/**
 * What the subject is connected to, in each telling: a mark where it shows the connection, a dash
 * where it shows both but not the connection (a real difference), and a dot where it doesn't show
 * both, so says nothing about it.
 */
export function Connections({ relationships }: { relationships: readonly ComparedRelationship[] }) {
  const evidenceIn = (r: ComparedRelationship, telling: TellingKey) =>
    r.titles.filter((t) => TELLING[telling].titles.includes(t.title));
  const applicableIn = (r: ComparedRelationship, telling: TellingKey) =>
    r.applicable.some((t) => TELLING[telling].titles.includes(t));
  const sharedByBoth = (r: ComparedRelationship) =>
    TELLINGS.every((t) => !applicableIn(r, t) || evidenceIn(r, t).length > 0);
  const ordered = [...relationships].sort(
    (a, b) => Number(sharedByBoth(b)) - Number(sharedByBoth(a)),
  );
  return (
    <div className="m-panel cmp-links">
      <ul aria-label="What the marks mean" className="cmp-key">
        <li>
          <span aria-hidden="true" className="cmp-yes">
            ✓
          </span>
          It shows this connection
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
          <caption className="sr-only">Which telling shows each connection</caption>
          <thead>
            <tr>
              <th scope="col">Connected to</th>
              {TELLINGS.map((telling) => (
                <th key={telling} scope="col">
                  <span
                    className="cmp-game"
                    style={{ "--c": TELLING[telling].color } as CSSProperties}
                  >
                    <span aria-hidden="true" className="cmp-game-mark" />
                    {TELLING[telling].short}
                  </span>
                </th>
              ))}
              <th scope="col">
                <span className="sr-only">In both?</span>
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
                {TELLINGS.map((telling) => {
                  const evidence = evidenceIn(r, telling);
                  const stated = evidence.some((e) => e.certainty === "stated");
                  return (
                    <td key={telling}>
                      {evidence.length > 0 ? (
                        <span className={stated ? "cmp-yes" : "cmp-maybe"}>
                          {stated ? "✓" : "?"}
                          <span className="sr-only">
                            {stated ? "Shows it" : "Shows it, but leaves it open"}
                          </span>
                        </span>
                      ) : applicableIn(r, telling) ? (
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
                  {sharedByBoth(r) ? (
                    <span className="cmp-tag">In both</span>
                  ) : (
                    <span className="cmp-tag cmp-big">Differs</span>
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

/** Anything told by both tellings, found by name or kind, opening where `pathFor` says. */
export function ThingPicker({
  entities,
  reference,
  pathFor,
  title = "Compare anything side by side",
  kinds = ENTITY_KINDS,
}: {
  entities: readonly EntityList["items"][number][];
  reference: Reference | undefined;
  pathFor: (id: string) => string;
  title?: string;
  /** The kinds offered; with one, there are no kind choices. */
  kinds?: readonly EntityKind[];
}) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<EntityKind>(kinds[0] ?? "event");
  const query = text.trim().toLowerCase();
  const shown = useMemo(
    () =>
      entities
        .filter(
          (e) =>
            TELLINGS.every((t) => TELLING[t].titles.some((code) => e.titles.includes(code))) &&
            (kinds as readonly string[]).includes(e.kind),
        )
        // A search looks across every kind offered; otherwise the chosen kind.
        .filter((e) => (query ? e.name.toLowerCase().includes(query) : e.kind === kind))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [entities, query, kind, kinds],
  );
  return (
    <section aria-labelledby="cmp-pick" className="m-panel cmp-pick">
      <h2 id="cmp-pick" className="m-label">
        {title}
      </h2>
      <input
        type="search"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        aria-label="Find something to compare"
        placeholder={
          kinds.length === 1 ? "Find a moment by name…" : "Find a character, event or place…"
        }
        className="cmp-search"
      />
      {!query && kinds.length > 1 && (
        <div role="group" aria-label="Kinds" className="m-choices">
          {kinds.map((k) => (
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
        <p className="cmp-empty">Nothing by that name is told by both.</p>
      ) : (
        <ul aria-label="Things to compare" className="cmp-pick-list">
          {shown.map((entity) => (
            <li key={entity.id}>
              <Link to={pathFor(entity.id)} className="cmp-pick-item">
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
