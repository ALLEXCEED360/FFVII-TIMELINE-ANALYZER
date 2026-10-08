import { type CSSProperties, type ReactNode, useState } from "react";
import type { DivergenceView, Reference } from "../../api/client";
import { CHANGE_WORDS, type Marking, SPLIT_SENTENCES, SPLIT_WORDS } from "../../lib/plain";
import { titleShort, worldName } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";

// Where the games part ways around one moment: the story so far, the turning point, each game after.

type Row = DivergenceView["trunk"][number];
type Branch = DivergenceView["branches"][number];
type Station = Row["stations"][number];

/** Earlier moments shown before the rest are asked for. */
const SHOWN_BEFORE = 6;

export function branchName(reference: Reference | undefined, branch: Branch): string {
  const game = titleShort(reference, branch.title);
  return branch.world === "world_main" ? game : `${game} · ${worldName(reference, branch.world)}`;
}

function when(start: number): string | null {
  if (start === 0) return null;
  const n = Math.abs(start).toLocaleString("en-US");
  const about = Math.abs(start) >= 100 ? "About " : "";
  return `${about}${n} years ${start < 0 ? "before" : "after"} the story`;
}

/** The kinds of change at a station, in plain words, and whether any is a big one. */
function changes(station: Station): { words: string[]; big: boolean } {
  const differences = station?.differences ?? [];
  return {
    words: [...new Set(differences.map((d) => CHANGE_WORDS[d.category]))],
    big: differences.some((d) => d.magnitude === "major"),
  };
}

const lane = (branch: Branch) => ({ "--c": TITLE_COLOR[branch.title] }) as CSSProperties;

/** One moment, as a button card (phrasing content only, as a button needs). */
function Moment({
  row,
  selected,
  onSelect,
  marking,
  markingText,
  big,
  kinds,
  extra,
}: {
  row: Row;
  selected: string | null;
  onSelect: (id: string) => void;
  marking: Marking | "none";
  markingText: string;
  big: boolean;
  kinds: readonly string[];
  extra?: ReactNode;
}) {
  const on = row.event.id === selected;
  const time = when(row.event.start);
  return (
    <li className="dv-stop">
      <button
        type="button"
        aria-pressed={on}
        onClick={() => {
          onSelect(row.event.id);
        }}
        className="dv-moment"
      >
        <span className="dv-moment-body">
          <span className="m-heading dv-name">{row.event.name}</span>
          <span className="dv-meta">
            {time && <span className="dv-when">{time}</span>}
            <span className="dv-mark" data-marking={marking}>
              {markingText}
            </span>
            {big && <span className="dv-tag">Big change</span>}
          </span>
          {kinds.length > 0 && <span className="dv-kinds">What changes: {kinds.join(", ")}</span>}
          {extra}
        </span>
        <span aria-hidden="true" className="dv-details">
          {on ? "Open" : "Details"} <span className="dv-details-arrow">›</span>
        </span>
      </button>
    </li>
  );
}

export function SplitView({
  view,
  reference,
  selected,
  onSelect,
}: {
  view: DivergenceView;
  reference: Reference | undefined;
  selected: string | null;
  onSelect: (eventId: string) => void;
}) {
  const [everything, setEverything] = useState(false);
  const pivot = view.events.find((r) => r.event.id === view.pivot.id) ?? view.events[0];
  const after = view.events.filter((r) => r !== pivot);
  const hidden = everything ? 0 : Math.max(0, view.trunk.length - SHOWN_BEFORE);
  const before = view.trunk.slice(hidden);

  return (
    <div className="dv-split">
      <section aria-labelledby="dv-before" className="m-panel dv-stage">
        <header className="dv-stage-head">
          <p className="m-label">Step 1 · Before</p>
          <h2 id="dv-before" className="m-heading dv-stage-name">
            The story so far
          </h2>
          <p className="dv-stage-text">
            What happens before this moment. These games share this part of the story, though not
            always told the same way. Tap any moment for its details.
          </p>
        </header>
        {view.trunk.length === 0 ? (
          <p className="dv-empty">Nothing earlier is recorded.</p>
        ) : (
          <>
            {hidden > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEverything(true);
                }}
                className="m-row-link dv-earlier"
              >
                Show the {hidden} earlier moments
              </button>
            )}
            <ol className="dv-rail dv-rail-shared">
              {before.map((row) => {
                const alike = row.stations.every((s) => s === null || s.marking === "shared");
                const told = view.branches.filter((_, b) => row.stations[b] !== null);
                return (
                  <Moment
                    key={row.event.id}
                    row={row}
                    selected={selected}
                    onSelect={onSelect}
                    marking={alike ? "shared" : "changed"}
                    markingText={alike ? "Told the same in each game" : "Told differently"}
                    big={row.stations.some((s) => changes(s).big)}
                    kinds={[...new Set(row.stations.flatMap((s) => changes(s).words))]}
                    extra={
                      <span className="dv-games">
                        <span className="dv-games-label">Told in</span>
                        {told.map((branch) => (
                          <span key={branch.key} className="dv-game" style={lane(branch)}>
                            <span aria-hidden="true" className="dv-game-mark" />
                            {branchName(reference, branch)}
                          </span>
                        ))}
                      </span>
                    }
                  />
                );
              })}
            </ol>
          </>
        )}
      </section>

      {pivot && (
        <section aria-labelledby="dv-turn" className="m-panel dv-turn">
          <span aria-hidden="true" className="materia dv-orb" />
          <p className="m-label">Step 2 · The turning point</p>
          <h2 id="dv-turn" className="m-heading dv-turn-name">
            {pivot.event.name}
          </h2>
          {when(pivot.event.start) && <p className="dv-when">{when(pivot.event.start)}</p>}
          <ul aria-label="How each game tells it" className="dv-turn-games">
            {view.branches.map((branch, b) => {
              const station = pivot.stations[b] ?? null;
              const { words, big } = changes(station);
              return (
                <li key={branch.key} className="dv-turn-game" style={lane(branch)}>
                  <p className="m-heading dv-branch-name">{branchName(reference, branch)}</p>
                  <p className="dv-mark" data-marking={station?.marking ?? "none"}>
                    {station ? SPLIT_WORDS[station.marking] : "Not in this game"}
                  </p>
                  <p className="dv-why">
                    {station
                      ? SPLIT_SENTENCES[station.marking]
                      : "This game doesn't tell this moment."}
                  </p>
                  {words.length > 0 && (
                    <p className="dv-kinds">
                      {big && <span className="dv-tag">Big change</span>} What changes:{" "}
                      {words.join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            aria-pressed={pivot.event.id === selected}
            onClick={() => {
              onSelect(pivot.event.id);
            }}
            className="dv-turn-open"
          >
            See the details of this moment <span aria-hidden="true">›</span>
          </button>
        </section>
      )}

      <section aria-labelledby="dv-after" className="dv-after">
        <header className="dv-stage-head">
          <p className="m-label">Step 3 · After</p>
          <h2 id="dv-after" className="m-heading dv-stage-name">
            Where each game goes
          </h2>
          <p className="dv-stage-text">
            From here each game follows its own line. Tap any moment for its details.
          </p>
        </header>
        <div
          className="dv-branches"
          style={{ "--n": String(view.branches.length) } as CSSProperties}
        >
          {view.branches.map((branch, b) => {
            const rows = after.filter((row) => row.stations[b]);
            return (
              <section
                key={branch.key}
                aria-labelledby={`dv-${branch.key}`}
                className="m-panel dv-branch"
                style={lane(branch)}
              >
                <h3 id={`dv-${branch.key}`} className="m-heading dv-branch-name">
                  {branchName(reference, branch)}
                </h3>
                {rows.length === 0 ? (
                  <p className="dv-empty">Nothing after this moment in this game yet.</p>
                ) : (
                  <ol className="dv-rail">
                    {rows.map((row) => {
                      const station = row.stations[b] ?? null;
                      if (!station) return null;
                      const { words, big } = changes(station);
                      return (
                        <Moment
                          key={row.event.id}
                          row={row}
                          selected={selected}
                          onSelect={onSelect}
                          marking={station.marking}
                          markingText={SPLIT_WORDS[station.marking]}
                          big={big}
                          kinds={words}
                        />
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
