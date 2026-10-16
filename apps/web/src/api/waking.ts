import { useEffect, useState } from "react";
import { ApiError } from "./client";

// The API runs on a free host that sleeps between visits, and waking it can take minutes. Requests
// that fail on the way (no answer, or a server error) are tried again for about three minutes, so a
// page fills in on its own once it answers; a 4xx is a real answer, so it isn't.

const WAKE_RETRIES = 15;

export function retryWhileWaking(failures: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failures < WAKE_RETRIES;
}

/** 1, 2, 4 and 8 seconds, then every 15: about three minutes in all. */
export function wakeRetryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 15_000);
}

export const WAKING_TEXT =
  "Waking the archive — after a quiet spell this can take a minute or two.";

/** True once something has been loading long enough that the API must be waking. */
export function useWaking(loading: boolean, after = 4000): boolean {
  const [waking, setWaking] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      setWaking(true);
    }, after);
    return () => {
      window.clearTimeout(timer);
      setWaking(false);
    };
  }, [loading, after]);
  return loading && waking;
}
