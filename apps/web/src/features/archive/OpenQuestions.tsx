import { Link } from "react-router";
import type { OpenQuestion, Reference } from "../../api/client";
import { Citations } from "../../components/Citation";
import { entityPath } from "../../lib/paths";
import { worldName } from "../../lib/reference";
import { QUESTION_KIND_LABELS } from "./units";

/** Research questions: facts awaiting a stronger check, and gaps in the dataset. */
export function OpenQuestionList({
  questions,
  reference,
  showSubjects = true,
  headingLevel = 3,
}: {
  questions: readonly OpenQuestion[];
  reference: Reference | undefined;
  /** List the entities and worlds each question is about (off on their own pages). */
  showSubjects?: boolean;
  headingLevel?: 3 | 4;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <ul className="flex flex-col gap-2">
      {questions.map((q) => (
        <li
          key={q.id}
          className="rounded border border-night-700 border-l-2 border-l-ember-400/70 p-3"
        >
          <p className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="chip">{QUESTION_KIND_LABELS[q.kind]}</span>
          </p>
          <Heading className="text-sm font-semibold text-steel-100">{q.summary}</Heading>
          <p className="mt-1 text-sm text-steel-300">{q.details}</p>
          {showSubjects && (q.entities.length > 0 || q.worlds.length > 0) && (
            <p className="mt-1.5 text-xs text-steel-400">
              About:{" "}
              {q.entities.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ", "}
                  <Link to={entityPath(e.id)} className="text-steel-200 hover:text-mako-300">
                    {e.name}
                  </Link>
                </span>
              ))}
              {q.worlds.map((w, i) => (
                <span key={w.id}>
                  {(i > 0 || q.entities.length > 0) && ", "}
                  the world “{worldName(reference, w.id)}”
                </span>
              ))}
            </p>
          )}
          {q.sources.length > 0 && (
            <p className="mt-1 text-xs text-steel-400">
              Where to look: <Citations sources={q.sources} reference={reference} />
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
