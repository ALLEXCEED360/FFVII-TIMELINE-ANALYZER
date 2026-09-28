import type { TitleCode } from "../api/client";

/** Each title's colour (defined in styles.css), for lanes, chips and markers. */
export const TITLE_COLOR: Record<TitleCode, string> = {
  og: "var(--color-title-og)",
  remake: "var(--color-title-remake)",
  intermission: "var(--color-title-intermission)",
  rebirth: "var(--color-title-rebirth)",
};
