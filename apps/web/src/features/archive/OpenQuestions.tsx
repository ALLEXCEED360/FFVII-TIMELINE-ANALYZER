import { Link } from "react-router";
import type { OpenQuestion, Reference } from "../../api/client";
import { Citations } from "../../components/Citation";
import { entityPath } from "../../lib/paths";
import { worldName } from "../../lib/reference";

/** Questions still open: things waiting on a closer look at the games, and gaps in the archive. */
export function OpenQuestionList({
  questions,
  reference,
  showSubjects = true,
  headingLevel = 3,
}: {
  questions: readonly OpenQuestion[];
  reference: Reference | undefined;
  /** Name what each question is about (off where the page is already about it). */
  showSubjects?: boolean;
  headingLevel?: 3 | 4;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <ul className="ar-questions">
      {questions.map((q) => (
        <li key={q.id} className="ar-question">
          <Heading className="ar-question-name">{q.summary}</Heading>
          <p className="ar-text">{q.details}</p>
          {showSubjects && (q.entities.length > 0 || q.worlds.length > 0) && (
            <p className="ar-small">
              About:{" "}
              {q.entities.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ", "}
                  <Link to={entityPath(e.id)} className="ar-link">
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
            <p className="ar-small">
              Where to look: <Citations sources={q.sources} reference={reference} />
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
