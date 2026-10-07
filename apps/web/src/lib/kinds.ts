// The four kinds of thing in plain words, each with its materia colour (decisions 0023, 0024), as
// the original's materia had theirs: green for people, yellow for moments, blue for places,
// purple for groups.

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
  return Object.hasOwn(KIND_WORDS, kind);
}
