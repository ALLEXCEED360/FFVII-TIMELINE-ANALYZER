import type { DifferenceCategory, DisplayStatus, DivergenceView } from "../api/client";

// The data's terms ("depicted", "false account") in plain words for the pages.

const MAIN_WORLD = "world_main";

/** How a game tells an event, in a few plain words: "Shown in a flashback", "Only mentioned". */
export function tellingOf(appearance: {
  status: string;
  framing?: string | null;
  world: string;
}): string {
  const { status, framing } = appearance;
  let words: string;
  if (status === "omitted") words = "Left out";
  else if (status === "depicted") {
    words =
      framing === "flashback"
        ? "Shown in a flashback"
        : framing === "false_account"
          ? "Shown, but as a false memory"
          : framing === "disputed_account"
            ? "Shown, but the game casts doubt on it"
            : framing === "vision"
              ? "Seen in a vision"
              : framing === "glimpse"
                ? "Glimpsed"
                : "Shown as it happens";
  } else {
    words =
      framing === "vision"
        ? "Only seen in a vision"
        : framing === "glimpse"
          ? "Only glimpsed"
          : framing === "flashback"
            ? "Briefly recalled"
            : "Only mentioned";
  }
  return appearance.world === MAIN_WORLD ? words : `${words}, in another world`;
}

/** What a game does with something, at a glance. */
export const STATUS_WORDS: Record<DisplayStatus, string> = {
  depicted: "Shows it",
  referenced: "Only mentions it",
  omitted: "Leaves it out",
  not_yet_reached: "Hasn't reached this part yet",
  undocumented: "Not recorded here yet",
  absent: "Not in this game",
};

/** The same, said in a sentence where there's room. */
export const STATUS_SENTENCES: Record<DisplayStatus, string> = {
  depicted: "The game shows this on screen.",
  referenced: "The game only mentions this, or shows it in passing.",
  omitted: "The game covers this part of the story but leaves this out.",
  not_yet_reached:
    "The Remake series hasn't reached this part of the story yet; a later game may tell it.",
  undocumented: "The game covers this, but the archive hasn't recorded how yet.",
  absent: "This game doesn't tell this part of the story.",
};

/** The kinds of change between tellings. */
export const CHANGE_WORDS: Record<DifferenceCategory, string> = {
  presentation: "How it's shown",
  participants: "Who's there",
  setting: "Where it happens",
  chronology: "When it happens",
  outcome: "How it ends",
  role: "Someone's part in it",
  relationship: "Relationships",
  context: "What surrounds it",
  gameplay: "Gameplay",
};

/** How one game tells a moment, measured against the others (the divergence view). */
export type Marking = NonNullable<DivergenceView["events"][number]["stations"][number]>["marking"];

export const SPLIT_WORDS: Record<Marking, string> = {
  shared: "Told the same",
  changed: "Told differently",
  only_here: "Only this game shows it",
  not_yet_retold: "Only this game has told it so far",
  omitted: "Left out",
  not_yet_reached: "Not reached yet",
  undocumented: "Not recorded yet",
};

/** The same, said in a sentence where there's room. */
export const SPLIT_SENTENCES: Record<Marking, string> = {
  shared: "This game tells it the same way as the others.",
  changed: "This game tells it, but differently from the others.",
  only_here: "Only this game shows it; the others cover this part of the story without it.",
  not_yet_retold: "This game tells it; the others haven't reached this part of the story yet.",
  omitted: "This game covers this part of the story but leaves this out.",
  not_yet_reached: "This game hasn't reached this part of the story yet.",
  undocumented: "This game covers this, but the archive hasn't recorded how yet.",
};
