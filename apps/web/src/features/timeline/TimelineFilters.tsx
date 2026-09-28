import type { Arc, TitleCode } from "../../api/client";
import { TITLE_ORDER } from "../../lib/reference";
import { TITLE_COLOR } from "../../lib/titles";
import type { TimelineParams } from "./params";

/** The left panel: which titles, which view, which layout, and what to show (blueprint §18, §22). */
export function TimelineFilters({
  params,
  arcs,
  titleName,
  onToggleTitle,
  onChange,
}: {
  params: TimelineParams;
  arcs: readonly Arc[];
  titleName: (code: TitleCode) => string;
  onToggleTitle: (code: TitleCode) => void;
  onChange: (change: Partial<TimelineParams>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="label mb-2">Titles</legend>
        <div className="flex flex-col gap-1.5">
          {TITLE_ORDER.map((code) => {
            const on = params.titles.includes(code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={on}
                disabled={on && params.titles.length === 1}
                onClick={() => {
                  onToggleTitle(code);
                }}
                className="btn justify-start disabled:cursor-not-allowed"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 rotate-45 border-2"
                  style={{
                    borderColor: TITLE_COLOR[code],
                    background: on ? TITLE_COLOR[code] : "transparent",
                  }}
                />
                {titleName(code)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-2">Order</legend>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className="btn justify-center"
            aria-pressed={params.view === "world"}
            onClick={() => {
              onChange({ view: "world" });
            }}
          >
            In-universe
          </button>
          <button
            type="button"
            className="btn justify-center"
            aria-pressed={params.view === "play"}
            onClick={() => {
              onChange({ view: "play" });
            }}
          >
            Play order
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-2">Layout</legend>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className="btn justify-center"
            aria-pressed={params.layout === "chart"}
            onClick={() => {
              onChange({ layout: "chart" });
            }}
          >
            Chart
          </button>
          <button
            type="button"
            className="btn justify-center"
            aria-pressed={params.layout === "list"}
            onClick={() => {
              onChange({ layout: "list" });
            }}
          >
            List
          </button>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="arc-filter" className="label">
          Arc
        </label>
        <select
          id="arc-filter"
          value={params.arc ?? ""}
          onChange={(e) => {
            onChange({ arc: e.target.value || null });
          }}
          className="rounded border border-night-600 bg-night-900 px-2 py-1.5 text-sm text-steel-100"
        >
          <option value="">All arcs</option>
          {arcs.map((arc) => (
            <option key={arc.id} value={arc.id}>
              {arc.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-steel-300">
        <input
          type="checkbox"
          checked={params.majorOnly}
          onChange={(e) => {
            onChange({ majorOnly: e.target.checked });
          }}
          className="size-4 accent-mako-400"
        />
        Pivotal events only
      </label>
    </div>
  );
}

/** What the marker shapes mean. */
export function TimelineLegend() {
  const item = "flex items-center gap-2";
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-steel-400" aria-label="Legend">
      <li className={item}>
        <svg width="14" height="14" aria-hidden="true">
          <path
            d="M7 1 13 7 7 13 1 7Z"
            className="fill-steel-300 stroke-steel-300"
            strokeWidth="1.5"
          />
        </svg>
        Depicted
      </li>
      <li className={item}>
        <svg width="14" height="14" aria-hidden="true">
          <path
            d="M7 1 13 7 7 13 1 7Z"
            fill="none"
            className="stroke-steel-300"
            strokeWidth="1.5"
          />
        </svg>
        Referenced
      </li>
      <li className={item}>
        <svg width="14" height="14" aria-hidden="true">
          <path d="M3 3 11 11 M11 3 3 11" className="stroke-steel-400" strokeWidth="2" />
        </svg>
        Omitted
      </li>
      <li className={item}>
        <svg width="18" height="18" aria-hidden="true">
          <circle
            cx="9"
            cy="9"
            r="7.5"
            fill="none"
            className="stroke-steel-300"
            strokeDasharray="2 3"
          />
        </svg>
        False or disputed account
      </li>
      <li className={item}>
        <svg width="14" height="14" aria-hidden="true">
          <path
            d="M7 1 13 7 7 13 1 7Z"
            fill="none"
            className="stroke-steel-300"
            strokeDasharray="2 2"
            strokeWidth="1.5"
          />
        </svg>
        Only in another world
      </li>
      <li className={item}>
        <svg width="10" height="10" aria-hidden="true">
          <circle cx="5" cy="5" r="3" className="fill-ember-400" />
        </svg>
        Placed at a different time
      </li>
    </ul>
  );
}
