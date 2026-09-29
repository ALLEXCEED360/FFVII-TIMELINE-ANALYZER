import { Link } from "react-router";
import type { Locator, Reference } from "../api/client";
import { sourcePath } from "../lib/paths";
import { describeLocator } from "../lib/reference";

/** A citation as a link to its unit in the archive, where every fact citing it is listed. */
export function Citation({
  locator,
  reference,
}: {
  locator: Locator;
  reference: Reference | undefined;
}) {
  return (
    <Link
      to={sourcePath(locator)}
      className="inline-block min-h-6 py-0.5 font-mono text-steel-400 underline decoration-night-500 underline-offset-2 hover:text-mako-300 hover:decoration-mako-500"
      title={locator.scene ? `Scene: ${locator.scene}` : undefined}
    >
      {describeLocator(reference, locator)}
    </Link>
  );
}

/** Several citations, separated by semicolons. */
export function Citations({
  sources,
  reference,
}: {
  sources: readonly Locator[];
  reference: Reference | undefined;
}) {
  return (
    <>
      {sources.map((locator, i) => (
        <span key={i}>
          {i > 0 && "; "}
          <Citation locator={locator} reference={reference} />
        </span>
      ))}
    </>
  );
}
