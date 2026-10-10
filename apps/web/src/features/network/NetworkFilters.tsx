import { type ReactNode, useId } from "react";
import type { EntityList } from "../../api/client";
import { Orb } from "../../components/Orb";
import { KIND_WORDS } from "../../lib/kinds";
import { ENTITY_KINDS } from "../../lib/paths";
import { TELLING, type TellingChoice } from "../../lib/tellings";
import { EDGE_CATEGORY_ORDER, type NetworkParams, USUAL_VIEW, isUsualView, toggle } from "./params";
import { CATEGORY_WORDS } from "./words";

const DEPTHS = [
  { value: 1, name: "Direct links", hint: (centre: string) => `Only what's linked to ${centre}` },
  { value: 2, name: "Two steps away", hint: () => "And what those are linked to" },
  { value: 3, name: "Three steps away", hint: () => "One step further again" },
] as const;

const STORIES: readonly { value: TellingChoice; name: string }[] = [
  { value: "both", name: "Both stories" },
  { value: "og", name: TELLING.og.name },
  { value: "trilogy", name: TELLING.trilogy.name },
];

const LINK_HINTS = {
  structural: "Family, where they live, who they work for",
  event: "Who took part in what, and where",
  causal: "What led to what",
} as const;

/** One option in a menu: the glove points at it, and a short line says what it does. */
function Option({
  on,
  onClick,
  icon,
  hint,
  toggles = false,
  children,
}: {
  on: boolean;
  onClick: () => void;
  icon?: ReactNode;
  hint?: string;
  /** A switch (ON/OFF) rather than one choice of several. */
  toggles?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className="nw-opt">
      <span aria-hidden="true" className="ff7-hand nw-opt-glove">
        ☞
      </span>
      <span className="nw-opt-name">
        {icon}
        {children}
      </span>
      {toggles && (
        <span aria-hidden="true" className="nw-opt-state">
          {on ? "ON" : "OFF"}
        </span>
      )}
      {hint && <span className="nw-opt-hint">{hint}</span>}
    </button>
  );
}

function Setting({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="nw-setting">
      <h3 id={id} className="m-label nw-setting-name">
        {title}
      </h3>
      <div role="group" aria-labelledby={id} className="nw-opts">
        {children}
      </div>
    </div>
  );
}

/** What the web shows, as the original's Config screen: one blue window of settings. */
export function NetworkFilters({
  params,
  update,
  centreId,
  centreName,
  entities,
  folded,
}: {
  params: NetworkParams;
  update: (change: Partial<NetworkParams>) => void;
  centreId: string;
  centreName: string;
  entities: readonly EntityList["items"][number][];
  /** On a narrow screen it folds away above the web until opened. */
  folded: boolean;
}) {
  const settings = (
    <div className="nw-settings">
      <Setting title="How far to look">
        {DEPTHS.map((d) => (
          <Option
            key={d.value}
            on={params.depth === d.value}
            hint={d.hint(centreName)}
            onClick={() => {
              update({ depth: d.value });
            }}
          >
            {d.name}
          </Option>
        ))}
      </Setting>

      <Setting title="Which story">
        {STORIES.map((story) => (
          <Option
            key={story.value}
            on={params.tellings === story.value}
            onClick={() => {
              update({ tellings: story.value });
            }}
          >
            {story.name}
          </Option>
        ))}
      </Setting>

      <Setting title="Show these">
        {ENTITY_KINDS.map((kind) => (
          <Option
            key={kind}
            toggles
            on={params.kinds.includes(kind)}
            icon={<Orb kind={kind} size="0.8rem" />}
            onClick={() => {
              update({ kinds: toggle(params.kinds, kind, ENTITY_KINDS) });
            }}
          >
            {KIND_WORDS[kind].many}
          </Option>
        ))}
      </Setting>

      <Setting title="Kinds of link">
        {EDGE_CATEGORY_ORDER.map((category) => (
          <Option
            key={category}
            toggles
            on={params.categories.includes(category)}
            hint={LINK_HINTS[category]}
            icon={
              <span
                aria-hidden="true"
                className="nw-line"
                style={{ background: CATEGORY_WORDS[category].color }}
              />
            }
            onClick={() => {
              update({ categories: toggle(params.categories, category, EDGE_CATEGORY_ORDER) });
            }}
          >
            {CATEGORY_WORDS[category].name}
          </Option>
        ))}
      </Setting>

      <div className="nw-setting nw-find">
        <label htmlFor="nw-find" className="m-label nw-setting-name">
          How is {centreName} linked to…
        </label>
        <select
          id="nw-find"
          value={params.to ?? ""}
          onChange={(e) => {
            update({ to: e.target.value || null });
          }}
          className="nw-select"
        >
          <option value="">Choose someone or something…</option>
          {ENTITY_KINDS.map((k) => (
            <optgroup key={k} label={KIND_WORDS[k].many}>
              {entities
                .filter((e) => e.kind === k && e.id !== centreId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {!isUsualView(params) && (
        <button
          type="button"
          className="nw-reset"
          onClick={() => {
            update(USUAL_VIEW);
          }}
        >
          Back to the usual view
        </button>
      )}
    </div>
  );

  return folded ? (
    <details className="ff7-window nw-filters">
      <summary className="nw-filters-head nw-filters-summary">
        <span className="m-heading nw-filters-title">What the web shows</span>
        <span className="nw-filters-open">Change</span>
      </summary>
      {settings}
    </details>
  ) : (
    <section aria-labelledby="nw-filters" className="ff7-window nw-filters">
      <h2 id="nw-filters" className="m-heading nw-filters-title">
        What the web shows
      </h2>
      {settings}
    </section>
  );
}
