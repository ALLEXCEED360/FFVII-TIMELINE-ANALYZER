import { formatYearBounds } from "@ffvii/shared/labels";
import { useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import type { EntityDetail, Reference, Relationship } from "../api/client";
import { ApiError } from "../api/client";
import { useEntity, useReference, useTimeline } from "../api/queries";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { AppearanceCard, DifferenceList, TitleDots } from "../features/entity/parts";
import {
  ENTITY_KINDS,
  KIND_LABELS,
  comparePath,
  entityPath,
  idFromPath,
  kindOf,
  divergencePath,
  networkPath,
} from "../lib/paths";
import { TITLE_ORDER, describeLocator, titleShort } from "../lib/reference";
import { TITLE_COLOR } from "../lib/titles";
import { OpenQuestionList } from "../features/archive/OpenQuestions";
import { NotFoundPage } from "./NotFoundPage";

/**
 * One entity in full (blueprint §25): identity, how each title presents it, what changes, and
 * everything it's connected to — at `/character/cloud-strife`, `/event/nibelheim-incident`, …
 */
export function EntityPage() {
  const { kind, slug } = useParams();
  const id = idFromPath(kind, slug);
  const entity = useEntity(id);
  const reference = useReference();
  const navigate = useNavigate();

  // A retired ID is redirected by the API; show the canonical URL for what came back.
  const canonical = entity.data ? entityPath(entity.data.id) : undefined;
  useEffect(() => {
    if (canonical && id && entity.data?.id !== id) void navigate(canonical, { replace: true });
  }, [canonical, entity.data?.id, id, navigate]);

  if (id === undefined) return <NotFoundPage />;
  if (entity.isPending) return <Loading variant="panel" label="Loading…" />;
  if (entity.isError) {
    if (entity.error instanceof ApiError && entity.error.status === 404) return <NotFoundPage />;
    return (
      <div className="panel p-4">
        <ErrorMessage error={entity.error} onRetry={() => void entity.refetch()} />
      </div>
    );
  }
  if (kindOf(entity.data.id) !== kind) return <Navigate to={entityPath(entity.data.id)} replace />;

  return <EntityView entity={entity.data} reference={reference.data} />;
}

function EntityView({
  entity,
  reference,
}: {
  entity: EntityDetail;
  reference: Reference | undefined;
}) {
  const kind = kindOf(entity.id) ?? "event";
  const presentIn = new Set(
    entity.appearances.filter((a) => a.status !== "omitted").map((a) => a.title),
  );

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/explore" className="hover:text-mako-300">
            Explore
          </Link>{" "}
          /{" "}
          <Link to={`/explore?kind=${kind}`} className="hover:text-mako-300">
            {KIND_LABELS[kind].many}
          </Link>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-steel-100 sm:text-4xl">
          {entity.name}
        </h1>
        {entity.aliases.length > 0 && (
          <p className="text-sm text-steel-400">Also known as {entity.aliases.join(", ")}</p>
        )}
        {entity.event && (
          <p className="label text-mako-300">
            {formatYearBounds(entity.event.start)} · {entity.event.arc.name}
            {entity.event.importance === 3 ? " · Pivotal" : ""}
          </p>
        )}
        <p className="max-w-3xl text-steel-300">{entity.summary}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label mr-1">Appears in</span>
          {TITLE_ORDER.map((title) => (
            <span
              key={title}
              className="chip"
              style={
                presentIn.has(title)
                  ? { borderColor: TITLE_COLOR[title], color: "var(--color-steel-100)" }
                  : { opacity: 0.45 }
              }
            >
              {titleShort(reference, title)}
              <span className="sr-only">{presentIn.has(title) ? "" : " (not in this title)"}</span>
            </span>
          ))}
          <span className="ml-auto flex gap-2">
            {presentIn.size >= 2 && (
              <Link to={comparePath(entity.id)} className="btn">
                Compare titles
              </Link>
            )}
            {entity.relationships.length > 0 && (
              <Link to={networkPath(entity.id)} className="btn">
                Network
              </Link>
            )}
            {entity.event && (
              <Link to={divergencePath(entity.id)} className="btn">
                Divergence
              </Link>
            )}
            {entity.event && (
              <Link to={`/timeline?event=${entity.id}`} className="btn">
                Show on timeline
              </Link>
            )}
          </span>
        </div>
      </header>

      {entity.event && <EventContext id={entity.id} />}

      <section aria-labelledby="entity-titles" className="flex flex-col gap-3">
        <h2 id="entity-titles" className="label">
          In each title
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {entity.appearances.map((appearance) => (
            <AppearanceCard
              key={`${appearance.title}-${appearance.world}`}
              appearance={appearance}
              reference={reference}
              headingLevel={3}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="entity-differences" className="flex flex-col gap-3">
        <h2 id="entity-differences" className="label">
          Differences between titles
        </h2>
        {entity.differences.length > 0 ? (
          <DifferenceList differences={entity.differences} reference={reference} />
        ) : (
          <p className="text-sm text-steel-400">No differences documented yet.</p>
        )}
      </section>

      <Connections entity={entity} reference={reference} />

      {entity.openQuestions.length > 0 && (
        <section aria-labelledby="entity-questions" className="flex flex-col gap-3">
          <h2 id="entity-questions" className="label">
            Open research questions
          </h2>
          <p className="text-sm text-steel-400">
            Parts of this record still awaiting a stronger check. See the{" "}
            <Link to="/archive/research" className="text-steel-200 hover:text-mako-300">
              research log
            </Link>
            .
          </p>
          <OpenQuestionList
            questions={entity.openQuestions}
            reference={reference}
            showSubjects={false}
          />
        </section>
      )}
    </article>
  );
}

/** For events: what comes just before and after, in the world of the story (blueprint §25). */
function EventContext({ id }: { id: string }) {
  const timeline = useTimeline(TITLE_ORDER);
  const items = timeline.data?.items ?? [];
  const index = items.findIndex((e) => e.id === id);
  if (index < 0) return null;
  const neighbours = [
    { label: "Before", event: items[index - 1] },
    { label: "After", event: items[index + 1] },
  ];
  if (neighbours.every((n) => n.event === undefined)) return null;
  return (
    <nav aria-label="Chronology" className="grid gap-3 sm:grid-cols-2">
      {neighbours.map(({ label, event }) =>
        event ? (
          <Link
            key={label}
            to={entityPath(event.id)}
            className="panel p-3 transition hover:border-mako-500"
          >
            <span className="label block">{label}</span>
            <span className="text-steel-100">{event.name}</span>
            <span className="block text-xs text-steel-400">{formatYearBounds(event.start)}</span>
          </Link>
        ) : (
          <div key={label} className="hidden sm:block" />
        ),
      )}
    </nav>
  );
}

/** Everything the entity is related to, grouped by what it's related to. */
function Connections({
  entity,
  reference,
}: {
  entity: EntityDetail;
  reference: Reference | undefined;
}) {
  const timeline = useTimeline(TITLE_ORDER);
  const order = useMemo(
    () => new Map((timeline.data?.items ?? []).map((e, i) => [e.id, i])),
    [timeline.data],
  );

  const groups = ENTITY_KINDS.map((kind) => {
    const items = entity.relationships.filter((r) => r.other.kind === kind);
    const sorted =
      kind === "event"
        ? [...items].sort((a, b) => (order.get(a.other.id) ?? 0) - (order.get(b.other.id) ?? 0))
        : items;
    return { kind, items: sorted };
  }).filter((g) => g.items.length > 0);

  return (
    <section aria-labelledby="entity-connections" className="flex flex-col gap-3">
      <h2 id="entity-connections" className="label">
        Connections
      </h2>
      {groups.length === 0 ? (
        <div className="panel">
          <Empty>No relationships documented yet.</Empty>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map(({ kind, items }) => (
            <div key={kind} className="panel p-4">
              <h3 className="mb-2 font-display text-sm font-semibold tracking-wider text-steel-100 uppercase">
                {KIND_LABELS[kind].many}
              </h3>
              <ul className="flex flex-col gap-2">
                {items.map((r) => (
                  <RelationshipRow
                    key={`${r.id}-${r.direction}`}
                    relationship={r}
                    reference={reference}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RelationshipRow({
  relationship: r,
  reference,
}: {
  relationship: Relationship;
  reference: Reference | undefined;
}) {
  const notes = r.titles
    .filter((t) => t.notes)
    .map((t) => `${titleShort(reference, t.title)}: ${t.notes ?? ""}`);
  const uncertain = r.titles.some((t) => t.certainty !== "stated");
  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs text-steel-400">{r.label}</span>
        <Link to={entityPath(r.other.id)} className="text-steel-100 hover:text-mako-300">
          {r.other.name}
        </Link>
        {typeof r.attributes.role === "string" && (
          <span className="text-xs text-steel-400">({r.attributes.role})</span>
        )}
        {uncertain && <span className="chip">Uncertain</span>}
        <span className="ml-auto">
          <TitleDots
            titles={r.titles.map((t) => t.title)}
            reference={reference}
            describe={(title) =>
              r.titles
                .find((t) => t.title === title)
                ?.sources.map((s) => describeLocator(reference, s))
                .join("; ") ?? ""
            }
          />
        </span>
      </div>
      {notes.length > 0 && (
        <p className="mt-0.5 text-xs text-steel-400 italic">{notes.join(" · ")}</p>
      )}
    </li>
  );
}
