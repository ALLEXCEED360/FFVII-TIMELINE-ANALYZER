import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import type { DifferenceCategory } from "../api/client";
import { useDifferences, useEntities, useReference } from "../api/queries";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { type ChangeGroup, ChangeList, ChangeWindow } from "../features/compare/ChangeList";
import { ThingPicker } from "../features/compare/pieces";
import { comparePath } from "../lib/paths";
import { CHANGE_WORDS } from "../lib/plain";
import { TITLE_ORDER } from "../lib/reference";
import { useMediaQuery } from "../lib/useMediaQuery";
import "../features/compare/compare.css";

const KINDS = Object.keys(CHANGE_WORDS) as DifferenceCategory[];

function isKind(value: string | null): value is DifferenceCategory {
  return (KINDS as (string | null)[]).includes(value);
}

/** What changes from the original to the Remake Trilogy, or anything side by side. /compare?open=… */
export function ComparePage() {
  useBackdrop(SECTION_ART.compare, { strength: 0.55, side: "full" });
  const [search, setSearch] = useSearchParams();
  const kindParam = search.get("category");
  const kind = isKind(kindParam) ? kindParam : undefined;
  const big = search.get("magnitude") === "major";
  const wide = useMediaQuery("(min-width: 64rem)");

  const reference = useReference();
  const entities = useEntities();
  // Every kind of change is fetched, so each filter can say how many it holds.
  const differences = useDifferences({ titles: TITLE_ORDER, magnitude: big ? "major" : undefined });

  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setSearch(next, { replace: true });
  };

  const all = useMemo(() => differences.data?.items ?? [], [differences.data]);
  const counts = useMemo(() => {
    const byKind = new Map<DifferenceCategory, number>();
    for (const item of all) byKind.set(item.category, (byKind.get(item.category) ?? 0) + 1);
    return byKind;
  }, [all]);

  // Changes grouped by the moment, person or place they belong to, in the API's order.
  const groups = useMemo(() => {
    const byEntity = new Map<string, ChangeGroup>();
    for (const item of all) {
      if (kind && item.category !== kind) continue;
      const group = byEntity.get(item.entity.id) ?? { entity: item.entity, items: [] };
      group.items.push(item);
      byEntity.set(item.entity.id, group);
    }
    return [...byEntity.values()];
  }, [all, kind]);

  const open = search.get("open");
  const chosen = groups.find((g) => g.entity.id === open);
  const select = (id: string) => {
    set({ open: open === id ? null : id });
  };
  const detail = chosen ? (
    <ChangeWindow
      key={chosen.entity.id}
      group={chosen}
      reference={reference.data}
      onClose={() => {
        set({ open: null });
      }}
    />
  ) : null;

  // Arriving with something chosen (a shared link), go straight to it.
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current || !differences.isSuccess) return;
    arrived.current = true;
    if (open) {
      document
        .getElementById(`change-${open}`)
        ?.scrollIntoView({ block: wide ? "center" : "start" });
    }
  }, [differences.isSuccess, open, wide]);

  return (
    <div className="cmp">
      <header>
        <h1 className="m-heading m-title">Compare</h1>
        <p className="m-intro">
          The Remake Trilogy retells the original, and not always the same way. Choose anything
          below to see what changes, or open anything side by side.
        </p>
      </header>

      <div className="m-panel cmp-controls">
        <div className="cmp-control">
          <p className="m-label" id="cmp-kinds">
            What changes
          </p>
          <div role="group" aria-labelledby="cmp-kinds" className="m-choices">
            <button
              type="button"
              aria-pressed={kind === undefined}
              onClick={() => {
                set({ category: null });
              }}
              className="m-choice"
            >
              Everything <span className="cmp-count">{all.length}</span>
            </button>
            {KINDS.filter((k) => counts.has(k) || k === kind).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => {
                  set({ category: kind === k ? null : k });
                }}
                className="m-choice"
              >
                {CHANGE_WORDS[k]} <span className="cmp-count">{counts.get(k) ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="cmp-control">
          <p className="m-label" id="cmp-show">
            Show
          </p>
          <div role="group" aria-labelledby="cmp-show" className="m-choices">
            <button
              type="button"
              aria-pressed={big}
              onClick={() => {
                set({ magnitude: big ? null : "major" });
              }}
              className="m-choice"
            >
              Big changes only
            </button>
          </div>
        </div>
      </div>

      <div className="cmp-body">
        <section aria-label="Changes" className="cmp-main">
          <p className="cmp-summary">
            {differences.isSuccess &&
              `${String(groups.reduce((n, g) => n + g.items.length, 0))} changes from the original to the Remake Trilogy`}
          </p>
          {differences.isPending ? (
            <Loading variant="panel" label="Loading the changes…" />
          ) : differences.isError ? (
            <div className="m-panel cmp-group">
              <ErrorMessage error={differences.error} onRetry={() => void differences.refetch()} />
            </div>
          ) : groups.length === 0 ? (
            <div className="m-panel cmp-group">
              <Empty>No changes recorded for these choices.</Empty>
            </div>
          ) : (
            <ChangeList
              groups={groups}
              selected={chosen ? chosen.entity.id : null}
              onSelect={select}
              detail={wide ? null : detail}
            />
          )}
        </section>

        {wide && (
          <div className="cmp-side">
            {detail ?? (
              <div className="ff7-window cmp-window cmp-window-empty">
                <span aria-hidden="true" className="cmp-empty-glove">
                  ☞
                </span>
                <p className="m-heading">Choose anything</p>
                <p className="cmp-window-text">
                  Tap a moment, a person or a place on the left. What the Remake Trilogy changes
                  opens here.
                </p>
              </div>
            )}
          </div>
        )}

        <ThingPicker entities={entities.data?.items ?? []} pathFor={comparePath} />
      </div>
    </div>
  );
}
