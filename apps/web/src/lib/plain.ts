import type { DifferenceCategory, DisplayStatus } from "../api/client";

// The archive in plain words, for someone new to the story (decisions 0019, 0021). The data's
// own terms ("depicted", "false account", "participants") stay in the data and the API; pages
// for beginners say what they mean.

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
