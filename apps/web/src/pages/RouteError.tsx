import { Link, isRouteErrorResponse, useRouteError } from "react-router";

/** A page's code that failed to download — usually because the site was redeployed meanwhile. */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    /dynamically imported module|module script failed|Failed to fetch/i.test(error.message)
  );
}

/** A page that failed to load or render, under the site's bar: never a blank screen. */
export function RouteError() {
  const error = useRouteError();
  const chunk = isChunkLoadError(error);
  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-16">
      <p className="m-label">
        {status === null ? "Something went wrong" : `Error ${String(status)}`}
      </p>
      <h1 className="m-heading m-title">
        {chunk ? "This page couldn't be loaded" : "This page ran into a problem"}
      </h1>
      <p className="m-intro">
        {chunk
          ? "The site may have been updated since you opened it, or the connection dropped. Reloading usually fixes it."
          : "Try reloading. If it keeps happening, the rest of the archive is still available."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="m-choice"
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload
        </button>
        <Link to="/" className="m-pill-link">
          Back to home
        </Link>
      </div>
    </div>
  );
}
