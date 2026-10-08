import type { EdgeCategory } from "../../api/client";

// The network's links in plain words: every link reads as a phrase from either
// end. The kinds of thing and their materia are in lib/kinds.ts.

/** The three kinds of link, said plainly, each with the colour its lines are drawn in. */
export const CATEGORY_WORDS: Record<EdgeCategory, { name: string; color: string }> = {
  event: { name: "Moments and places", color: "#a9c2d6" },
  structural: { name: "Family, homes and groups", color: "#c9a7f2" },
  causal: { name: "Cause and effect", color: "#ff8f7a" },
};

/** A link read from one end: "Took part in" from a person, "Who took part" from the moment. */
const PHRASES: Record<string, { out: string; in: string }> = {
  participated_in: { out: "Took part in", in: "Who took part" },
  occurred_at: { out: "Where it happened", in: "What happened here" },
  sub_event_of: { out: "Part of", in: "Made up of" },
  caused: { out: "Led to", in: "Came about because of" },
  experimented_on: { out: "Experimented on", in: "Experimented on by" },
  based_at: { out: "Based at", in: "Home to" },
  hometown: { out: "Comes from", in: "Hometown of" },
  leads: { out: "Leads", in: "Led by" },
  lives_in: { out: "Lives in", in: "Home of" },
  member_of: { out: "Member of", in: "Members" },
  parent_of: { out: "Parent of", in: "Child of" },
  part_of: { out: "Part of", in: "Includes" },
};

export function linkHeading(type: string, label: string, outgoing: boolean): string {
  const phrase = PHRASES[type];
  if (phrase) return outgoing ? phrase.out : phrase.in;
  const first = label.charAt(0).toUpperCase() + label.slice(1);
  return outgoing ? first : `${first} (by)`;
}

/** One step of a path as a sentence, the right way round: "Hojo experimented on Sephiroth." */
export function linkSentence(source: string, label: string, target: string): string {
  return `${source} ${label} ${target}.`;
}
