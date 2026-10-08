import { Link } from "react-router";
import type { Interpretation, Reference, ResearchSource } from "../api/client";
import { useReference, useResearch } from "../api/queries";
import { SECTION_ART } from "../art/manifest";
import { useBackdrop } from "../components/Backdrop";
import { Citations } from "../components/Citation";
import { ErrorMessage, Loading } from "../components/QueryState";
import { OpenQuestionList } from "../features/archive/OpenQuestions";
import {
  CERTAINTY_COLORS,
  CERTAINTY_DESCRIPTIONS,
  CERTAINTY_LABELS,
  EVIDENCE_LEVELS,
  QUESTION_KIND_LABELS,
  type QuestionKind,
  SOURCE_KIND_LABELS,
} from "../features/archive/units";
import { entityPath, isEntityKind } from "../lib/paths";
import { titleShort } from "../lib/reference";
import "../features/archive/archive.css";

const QUESTION_ORDER: readonly QuestionKind[] = ["needs_footage", "not_in_dataset", "structure"];

const FACT_KIND_WORDS: Record<Interpretation["kind"], string> = {
  appearance: "Who or what's there",
  difference: "A change",
  relationship: "A link",
  world: "Another world",
};

/** How the facts were checked: sources, certainty, open questions, and what's left unsaid. */
export function ResearchPage() {
  useBackdrop(SECTION_ART.research, { strength: 0.55, side: "full" });
  const research = useResearch();
  const reference = useReference();

  return (
    <div className="ar">
      <header>
        <nav aria-label="Breadcrumb">
          <ol className="ar-crumbs">
            <li>
              <Link to="/archive">Archive</Link>
            </li>
          </ol>
        </nav>
        <p className="m-label">Research log</p>
        <h1 className="m-heading m-title">How the facts were checked</h1>
        <p className="m-intro">
          A fact goes into this guide only once it has been checked against the game itself. Fan
          wikis and guides are used only to find where something happens, never as proof.
        </p>
      </header>

      {research.isPending ? (
        <Loading variant="panel" label="Opening the research log…" />
      ) : research.isError ? (
        <div className="m-panel ar-panel">
          <ErrorMessage error={research.error} onRetry={() => void research.refetch()} />
        </div>
      ) : (
        <>
          <div className="ar-pair">
            <section aria-labelledby="ar-best" className="m-panel ar-panel ar-section">
              <h2 id="ar-best" className="m-heading ar-heading">
                What counts as proof, best first
              </h2>
              <ol className="ar-ladder">
                {EVIDENCE_LEVELS.map((level) => {
                  const used = research.data.sources.filter(
                    (s) => s.role === "evidence" && s.kind === level.kind,
                  ).length;
                  return (
                    <li key={level.kind} className="ar-rung">
                      <strong className="ar-link">{level.label}</strong>
                      <span className="ar-text">{level.note}</span>
                      <span className="ar-small">
                        {used > 0 ? `${String(used)} used so far` : "None used yet"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
            <section aria-labelledby="ar-sure" className="m-panel ar-panel ar-section">
              <h2 id="ar-sure" className="m-heading ar-heading">
                How sure each fact is
              </h2>
              <Sureness certainty={research.data.certainty} />
            </section>
          </div>

          <SourceList
            id="ar-evidence"
            heading="Checked against"
            sources={research.data.sources.filter((s) => s.role === "evidence")}
            reference={reference.data}
          />
          <SourceList
            id="ar-locating"
            heading="Used only to find things"
            sources={research.data.sources.filter((s) => s.role === "locating")}
            reference={reference.data}
          />

          <section aria-labelledby="ar-open" className="ar-section">
            <h2 id="ar-open" className="m-heading ar-heading">
              Still being checked <span className="ar-count">{research.data.questions.length}</span>
            </h2>
            {research.data.questions.length === 0 ? (
              <p className="m-panel ar-panel ar-text">Nothing is waiting to be checked.</p>
            ) : (
              QUESTION_ORDER.map((kind) => {
                const questions = research.data.questions.filter((q) => q.kind === kind);
                if (questions.length === 0) return null;
                return (
                  <section key={kind} aria-labelledby={`ar-open-${kind}`} className="ar-section">
                    <h3 id={`ar-open-${kind}`} className="m-label">
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

          <section aria-labelledby="ar-unsaid" className="ar-section">
            <h2 id="ar-unsaid" className="m-heading ar-heading">
              What the games don&apos;t say outright{" "}
              <span className="ar-count">{research.data.interpretations.length}</span>
            </h2>
            <p className="ar-text ar-dim">
              Each explains itself: something worked out says how; something the game leaves open
              says what is shown, without settling it with a theory.
            </p>
            <ul className="ar-list">
              {research.data.interpretations.map((fact, i) => (
                <li key={i} className="m-panel ar-item">
                  <p className="ar-item-head">
                    {isEntityKind(fact.subject.kind) ? (
                      <Link to={entityPath(fact.subject.id)} className="ar-link">
                        {fact.subject.name}
                      </Link>
                    ) : (
                      <span className="ar-link">{fact.subject.name}</span>
                    )}
                    <span className="ar-tag">{FACT_KIND_WORDS[fact.kind]}</span>
                    <span
                      className="ar-tag"
                      style={{ borderColor: CERTAINTY_COLORS[fact.certainty] }}
                    >
                      {CERTAINTY_LABELS[fact.certainty]}
                    </span>
                    <span className="ar-small">
                      {fact.titles.map((t) => titleShort(reference.data, t)).join(", ")}
                    </span>
                  </p>
                  <p className="ar-text">{fact.label}</p>
                  <p className="ar-small">{fact.notes}</p>
                  <p className="ar-small">
                    Where to see it: <Citations sources={fact.sources} reference={reference.data} />
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

/** How many facts are said outright, worked out, or left open: a bar and its key. */
function Sureness({
  certainty,
}: {
  certainty: { stated: number; inferred: number; ambiguous: number };
}) {
  const total = Math.max(1, certainty.stated + certainty.inferred + certainty.ambiguous);
  const parts = ["stated", "inferred", "ambiguous"] as const;
  return (
    <div className="ar-sure">
      <span aria-hidden="true" className="ar-sure-bar">
        {parts.map((p) => (
          <span
            key={p}
            style={{
              width: `${String((certainty[p] / total) * 100)}%`,
              background: CERTAINTY_COLORS[p],
            }}
          />
        ))}
      </span>
      <ul className="ar-sure-key">
        {parts.map((p) => (
          <li key={p}>
            <span
              aria-hidden="true"
              className="ar-dot"
              style={{ background: CERTAINTY_COLORS[p] }}
            />
            <span>
              <strong>{CERTAINTY_LABELS[p]}.</strong>{" "}
              <span className="ar-dim">{CERTAINTY_DESCRIPTIONS[p]}</span>
            </span>
            <span className="ar-small">{certainty[p]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceList({
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
    <section aria-labelledby={id} className="ar-section">
      <h2 id={id} className="m-heading ar-heading">
        {heading} <span className="ar-count">{sources.length}</span>
      </h2>
      <ul className="ar-list">
        {sources.map((source) => (
          <li key={source.id} className="m-panel ar-item">
            <p className="ar-item-head">
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer" className="ar-link">
                  {source.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <span className="ar-link">{source.name}</span>
              )}
              <span className="ar-tag">{SOURCE_KIND_LABELS[source.kind] ?? source.kind}</span>
              <span className="ar-small">
                {source.covers.map((t) => titleShort(reference, t)).join(", ")}
              </span>
            </p>
            <p className="ar-text">{source.usedFor}</p>
            {source.notes && <p className="ar-small">{source.notes}</p>}
            {source.accessed && <p className="ar-small">Looked at on {source.accessed}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
