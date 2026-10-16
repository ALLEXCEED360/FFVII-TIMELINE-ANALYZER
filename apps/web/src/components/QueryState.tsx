import type { ReactNode } from "react";
import { ApiError } from "../api/client";
import { WAKING_TEXT, useWaking } from "../api/waking";

// Loading, error and empty states shared by every data view: no panel is ever left blank.

export function Loading({
  label = "Loading…",
  variant = "lines",
}: {
  label?: string;
  /** "panel" holds the space of a large view (like the timeline) so the page doesn't jump. */
  variant?: "lines" | "panel";
}) {
  // A long wait means the API is waking: say so rather than look stuck.
  const waking = useWaking(true);
  const note = waking && <span className="max-w-prose text-sm text-(--m-dim)">{WAKING_TEXT}</span>;
  if (variant === "panel") {
    return (
      <div
        role="status"
        className="m-panel flex h-80 flex-col items-center justify-center gap-3 px-4 text-center"
      >
        <span aria-hidden="true" className="size-2.5 rotate-45 animate-pulse bg-mako-400" />
        <span className="m-label">{label}</span>
        {note}
      </div>
    );
  }
  return (
    <div role="status" className="flex flex-col gap-2.5 py-1">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="skeleton h-3 w-3/4" />
      <span aria-hidden="true" className="skeleton h-3 w-1/2" />
      <span aria-hidden="true" className="skeleton h-3 w-2/3" />
      {note}
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
        <button type="button" className="m-choice" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-steel-400">{children}</p>;
}
