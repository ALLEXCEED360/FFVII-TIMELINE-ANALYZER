import type { ReactNode } from "react";
import { ApiError } from "../api/client";

// Loading, error and empty states shared by every data view: no panel is ever left blank.

export function Loading({
  label = "Loading…",
  variant = "lines",
}: {
  label?: string;
  /** "panel" holds the space of a large view (like the timeline) so the page doesn't jump. */
  variant?: "lines" | "panel";
}) {
  if (variant === "panel") {
    return (
      <div role="status" className="panel flex h-80 flex-col items-center justify-center gap-3">
        <span aria-hidden="true" className="size-2.5 rotate-45 animate-pulse bg-mako-400" />
        <span className="label">{label}</span>
      </div>
    );
  }
  return (
    <div role="status" className="flex flex-col gap-2.5 py-1">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="skeleton h-3 w-3/4" />
      <span aria-hidden="true" className="skeleton h-3 w-1/2" />
      <span aria-hidden="true" className="skeleton h-3 w-2/3" />
    </div>
  );
}

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError && error.status < 500
      ? error.message
      : "Couldn't reach the Timeline Analyzer API. It may be waking up.";
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-ember-400">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-steel-400">{children}</p>;
}
