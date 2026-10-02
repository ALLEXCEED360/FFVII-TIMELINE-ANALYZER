import { Link, isRouteErrorResponse, useRouteError } from "react-router";

/** A page's code that failed to download — usually because the site was redeployed meanwhile. */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    /dynamically imported module|module script failed|Failed to fetch/i.test(error.message)
  );
}

/**
 * Shown when a page fails to load or render, inside the site's header and footer, so the rest of
 * the site stays reachable. Never a blank screen.
 */
export function RouteError() {
  const error = useRouteError();
  const chunk = isChunkLoadError(error);
  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-16">
      <p className="label text-ember-400">
        {status === null ? "Something went wrong" : `Error ${String(status)}`}
      </p>
      <h1 className="page-title">
        {chunk ? "This page couldn't be loaded" : "This page ran into a problem"}
      </h1>
      <p className="max-w-2xl text-steel-300">
        {chunk
          ? "The site may have been updated since you opened it, or the connection dropped. Reloading usually fixes it."
          : "Try reloading. If it keeps happening, the rest of the archive is still available."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn"
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload
        </button>
        <Link to="/" className="btn">
          Back to home
        </Link>
      </div>
    </div>
  );
}
