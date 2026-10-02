import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import type { TitleCode } from "../api/client";
import { useEntities, useReference } from "../api/queries";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { TitleDots } from "../features/entity/parts";
import { ENTITY_KINDS, KIND_LABELS, entityPath, isEntityKind } from "../lib/paths";
import { TITLE_ORDER, isTitleCode, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { useBackdrop } from "../components/Backdrop";
import { SECTION_ART, artFor, sceneFor } from "../art/manifest";
import { Artwork } from "../components/Artwork";

/** Browse everything in the archive (blueprint §20 EXPLORE): /explore?kind=character&title=rebirth&q=… */
export function ExplorePage() {
  useBackdrop(SECTION_ART.explore, { strength: 0.42 });
  const [search, setSearch] = useSearchParams();
  const kindParam = search.get("kind") ?? undefined;
  const kind = isEntityKind(kindParam) ? kindParam : undefined;
  const titleParam = search.get("title") ?? "";
  const title = isTitleCode(titleParam) ? titleParam : undefined;
  const text = search.get("q") ?? "";

  const entities = useEntities();
  const reference = useReference();

  const set = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearch(next, { replace: key === "q" });
  };

  const all = useMemo(() => entities.data?.items ?? [], [entities.data]);
  const filtered = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return all.filter(
      (e) =>
        (kind === undefined || e.kind === kind) &&
        (title === undefined || e.titles.includes(title)) &&
        (needle === "" ||
          e.name.toLowerCase().includes(needle) ||
          e.summary.toLowerCase().includes(needle)),
    );
  }, [all, kind, title, text]);
  const counts = (k: string) => all.filter((e) => e.kind === k).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Archive</p>
        <h1 className="page-title">Explore</h1>
        <p className="max-w-3xl text-sm text-steel-300">
          Every character, event, location and organization in the dataset, with the titles each
          appears in.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Kind" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="btn"
            aria-pressed={kind === undefined}
            onClick={() => {
              set("kind", undefined);
            }}
          >
            All <span className="text-steel-400">{all.length}</span>
          </button>
          {ENTITY_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="btn"
              aria-pressed={kind === k}
              onClick={() => {
                set("kind", k);
              }}
            >
              {KIND_LABELS[k].many} <span className="text-steel-400">{counts(k)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Title" className="flex flex-wrap gap-1.5">
            {TITLE_ORDER.map((code: TitleCode) => (
              <button
                key={code}
                type="button"
                className="btn"
                aria-pressed={title === code}
                onClick={() => {
                  set("title", title === code ? undefined : code);
                }}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rotate-45"
                  style={{ background: TITLE_COLOR[code] }}
                />
                {titleShort(reference.data, code)}
              </button>
            ))}
          </div>
          <label className="ml-auto flex items-center gap-2">
            <span className="label">Filter</span>
            <input
              type="search"
              value={text}
              onChange={(e) => {
                set("q", e.target.value || undefined);
              }}
              placeholder="Name or description…"
              className="w-56 rounded border border-night-600 bg-night-900 px-2.5 py-1.5 text-sm text-steel-100 placeholder:text-steel-400"
            />
          </label>
        </div>
      </div>

      {entities.isPending ? (
        <Loading variant="panel" label="Loading the archive…" />
      ) : entities.isError ? (
        <div className="panel p-4">
          <ErrorMessage error={entities.error} onRetry={() => void entities.refetch()} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <Empty>Nothing matches these filters.</Empty>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Results">
          {filtered.map((e) => {
            const art = artFor(e.id).main ?? sceneFor(e.id);
            return (
              <li key={e.id}>
                <Link
                  to={entityPath(e.id)}
                  className={`panel panel-link group flex h-full flex-col gap-2 overflow-hidden p-4 ${art?.kind === "cutout" ? "pr-[40%]" : art ? "pr-[30%]" : ""}`}
                >
                  {art?.kind === "cutout" ? (
                    // A figure standing in the card, cut off at the knees like a roster portrait.
                    <Artwork
                      entry={art}
                      decorative
                      className="pointer-events-none absolute top-3 -right-1 h-[165%] w-auto max-w-[38%] object-contain object-top transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-1.5 [mask-image:linear-gradient(to_bottom,#000_45%,transparent_62%)]"
                    />
                  ) : art ? (
                    <Artwork
                      entry={art}
                      decorative
                      className="pointer-events-none absolute inset-y-0 right-0 w-2/5 object-cover opacity-45 transition-opacity group-hover:opacity-70 [mask-image:linear-gradient(to_left,#000_35%,transparent)]"
                    />
                  ) : null}
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="label">
                      {isEntityKind(e.kind) ? KIND_LABELS[e.kind].one : e.kind}
                    </span>
                    <TitleDots titles={e.titles} reference={reference.data} />
                  </span>
                  <span className="relative font-display text-xl font-bold tracking-wide text-steel-100 uppercase italic">
                    {e.name}
                  </span>
                  <span className="relative text-sm text-steel-300">{e.summary}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
