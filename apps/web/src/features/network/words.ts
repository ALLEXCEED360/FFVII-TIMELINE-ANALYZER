import type { EdgeCategory } from "../../api/client";

// The network in plain words and materia (decision 0023). Every kind of thing has its materia
// colour, as the original's materia had theirs: green for people, yellow for moments, blue for
// places, purple for groups. Every link reads as a phrase from either end.

export type Kind = "character" | "event" | "location" | "organization";

export const KIND_WORDS: Record<Kind, { one: string; many: string }> = {
  character: { one: "Person", many: "People" },
  event: { one: "Moment", many: "Moments" },
  location: { one: "Place", many: "Places" },
  organization: { one: "Group", many: "Groups" },
};

/** Each kind's materia: its colour, a lighter tone and a deeper one (for the orb's shading). */
export const MATERIA: Record<Kind, { color: string; light: string; deep: string; name: string }> = {
  character: { color: "#3fd28a", light: "#c9ffe4", deep: "#0d4a30", name: "green" },
  event: { color: "#f2c94c", light: "#fff6cf", deep: "#6b4c06", name: "yellow" },
  location: { color: "#4fa3ff", light: "#d6ebff", deep: "#0c3263", name: "blue" },
  organization: { color: "#b07cf2", light: "#efe2ff", deep: "#3d1d66", name: "purple" },
};

export function isKind(kind: string): kind is Kind {
  return kind in KIND_WORDS;
}

/** The three kinds of link, said plainly, each with the colour its lines are drawn in. */
export const CATEGORY_WORDS: Record<EdgeCategory, { name: string; color: string }> = {
  event: { name: "Moments and places", color: "#a9c2d6" },
  structural: { name: "Family, homes and groups", color: "#c9a7f2" },
  causal: { name: "Cause and effect", color: "#ff8f7a" },
};

/**
 * A link's heading, read from one end: "Took part in" from a person, "Who took part" from the
 * moment. Grouped under these, a thing's links read like sentences.
 */
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
