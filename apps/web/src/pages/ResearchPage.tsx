import { Link } from "react-router";
import type { Interpretation, Reference, ResearchSource } from "../api/client";
import { useReference, useResearch } from "../api/queries";
import { Citations } from "../components/Citation";
import { Empty, ErrorMessage, Loading } from "../components/QueryState";
import { OpenQuestionList } from "../features/archive/OpenQuestions";
import {
  CERTAINTY_DESCRIPTIONS,
  CERTAINTY_LABELS,
  EVIDENCE_LEVELS,
  QUESTION_KIND_LABELS,
  type QuestionKind,
  SOURCE_KIND_LABELS,
} from "../features/archive/units";
import { entityPath, isEntityKind } from "../lib/paths";
import { titleShort } from "../lib/reference";
import { CertaintyBar } from "./ArchivePage";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";

const QUESTION_ORDER: readonly QuestionKind[] = ["needs_footage", "not_in_dataset", "structure"];

const FACT_KIND_LABELS: Record<Interpretation["kind"], string> = {
  appearance: "Appearance",
  difference: "Difference",
  relationship: "Relationship",
  world: "World",
};

/**
 * The research log (blueprint §16): what was used to check the facts, what is still open, and
 * which facts are interpretation — inferred or deliberately left open — rather than stated.
 */
export function ResearchPage() {
  useBackdrop(SECTION_ART.research, { strength: 0.6 });
  const research = useResearch();
  const reference = useReference();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="label">
          <Link to="/archive" className="hover:text-mako-300">
            Archive
          </Link>
        </nav>
        <h1 className="page-title">Research log</h1>
        <p className="max-w-3xl text-sm text-steel-300">
          A fact goes into the archive only once it has been checked against the game itself. Wikis
          and guides are used only to find where something happens, never as evidence. Everything
          below is kept in the dataset, so this page is always current.
        </p>
      </header>

      {research.isPending ? (
        <Loading variant="panel" label="Loading the research log…" />
      ) : research.isError ? (
        <div className="panel p-4">
          <ErrorMessage error={research.error} onRetry={() => void research.refetch()} />
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <section
              aria-labelledby="research-evidence-levels"
              className="panel flex flex-col gap-3 p-4"
            >
              <h2 id="research-evidence-levels" className="section-title">
                Evidence, best first
              </h2>
              <ol className="flex flex-col gap-2 text-sm">
                {EVIDENCE_LEVELS.map((level, i) => {
                  const used = research.data.sources.filter(
                    (s) => s.role === "evidence" && s.kind === level.kind,
                  ).length;
                  return (
                    <li key={level.kind} className="flex gap-3">
                      <span className="font-display text-xl font-semibold text-mako-300">
                        {i + 1}
                      </span>
                      <span>
                        <span className="font-semibold text-steel-100">{level.label}.</span>{" "}
                        <span className="text-steel-300">{level.note}</span>
                        <span className="block text-xs text-steel-400">
                          {used > 0 ? `${String(used)} used so far` : "None recorded yet"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
            <section aria-labelledby="research-certainty" className="panel flex flex-col gap-3 p-4">
              <h2 id="research-certainty" className="section-title">
                Certainty
              </h2>
              <CertaintyBar certainty={research.data.certainty} />
              <dl className="flex flex-col gap-1.5 text-sm">
                {(["stated", "inferred", "ambiguous"] as const).map((c) => (
                  <div key={c}>
                    <dt className="inline font-semibold text-steel-100">{CERTAINTY_LABELS[c]}. </dt>
                    <dd className="inline text-steel-300">{CERTAINTY_DESCRIPTIONS[c]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <SourceTable
            id="research-sources-evidence"
            heading="Evidence"
            sources={research.data.sources.filter((s) => s.role === "evidence")}
            reference={reference.data}
          />
          <SourceTable
            id="research-sources-locating"
            heading="Used only to locate"
            sources={research.data.sources.filter((s) => s.role === "locating")}
            reference={reference.data}
          />

          <section aria-labelledby="research-questions" className="flex flex-col gap-4">
            <h2 id="research-questions" className="section-title">
              Open questions{" "}
              <span className="text-steel-300">{research.data.questions.length}</span>
            </h2>
            {research.data.questions.length === 0 ? (
              <div className="panel">
                <Empty>No open questions.</Empty>
              </div>
            ) : (
              QUESTION_ORDER.map((kind) => {
                const questions = research.data.questions.filter((q) => q.kind === kind);
                if (questions.length === 0) return null;
                return (
                  <section
                    key={kind}
                    aria-labelledby={`questions-${kind}`}
                    className="flex flex-col gap-2"
                  >
                    <h3 id={`questions-${kind}`} className="text-sm font-semibold text-steel-200">
                      {QUESTION_KIND_LABELS[kind]}
                    </h3>
                    <OpenQuestionList
                      questions={questions}
                      reference={reference.data}
                      headingLevel={4}
                    />
                  </section>
                );
              })
            )}
          </section>

          <section aria-labelledby="research-interpretations" className="flex flex-col gap-3">
            <h2 id="research-interpretations" className="section-title">
              Inferred and left open{" "}
              <span className="text-steel-300">{research.data.interpretations.length}</span>
            </h2>
            <p className="max-w-3xl text-sm text-steel-300">
              Facts the titles don't state outright. Each explains itself: an inference shows its
              reasoning; an open fact describes what is shown and what is left open, without
              settling it with a theory.
            </p>
            <ul className="flex flex-col gap-2">
              {research.data.interpretations.map((fact, i) => (
                <li key={i} className="panel p-3 text-sm">
                  <p className="mb-1 flex flex-wrap items-center gap-1.5">
                    {isEntityKind(fact.subject.kind) ? (
                      <Link
                        to={entityPath(fact.subject.id)}
                        className="font-semibold text-steel-100 hover:text-mako-300"
                      >
                        {fact.subject.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-steel-100">{fact.subject.name}</span>
                    )}
                    <span className="chip">{FACT_KIND_LABELS[fact.kind]}</span>
                    <span className="chip border-ember-400/60">
                      {CERTAINTY_LABELS[fact.certainty]}
                    </span>
                    {fact.titles.map((t, j) => (
                      <span key={j} className="chip">
                        {titleShort(reference.data, t)}
                      </span>
                    ))}
                  </p>
                  <p className="text-steel-200">{fact.label}</p>
                  <p className="mt-1 text-xs text-steel-300 italic">{fact.notes}</p>
                  <p className="mt-1 text-xs text-steel-400">
                    Sources: <Citations sources={fact.sources} reference={reference.data} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function SourceTable({
  id,
  heading,
  sources,
  reference,
}: {
  id: string;
  heading: string;
  sources: readonly ResearchSource[];
  reference: Reference | undefined;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="section-title">
        {heading} <span className="text-steel-300">{sources.length}</span>
      </h2>
      <ul className="panel divide-y divide-night-800">
        {sources.map((source) => (
          <li key={source.id} className="flex flex-col gap-1 p-3 text-sm">
            <p className="flex flex-wrap items-center gap-1.5">
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-steel-100 hover:text-mako-300"
                >
                  {source.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <span className="font-semibold text-steel-100">{source.name}</span>
              )}
              <span className="chip">{SOURCE_KIND_LABELS[source.kind] ?? source.kind}</span>
              {source.covers.map((t) => (
                <span key={t} className="chip">
                  {titleShort(reference, t)}
                </span>
              ))}
            </p>
            <p className="text-steel-300">{source.usedFor}</p>
            {source.notes && <p className="text-xs text-steel-400 italic">{source.notes}</p>}
            {source.accessed && (
              <p className="text-xs text-steel-400">Accessed {source.accessed}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
