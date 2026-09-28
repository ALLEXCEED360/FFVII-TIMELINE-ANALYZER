import type { EntityKind } from "./ids.ts";

// The relationship vocabulary (docs/model/relationships.md §4). A type that isn't here doesn't exist.

export const EDGE_CATEGORIES = ["structural", "event", "causal"] as const;
export type EdgeCategory = (typeof EDGE_CATEGORIES)[number];

export interface EdgeTypeDefinition {
  category: EdgeCategory;
  /** Symmetric types have no direction and are stored once. */
  symmetric: boolean;
  /** Allowed (source kind, target kind) pairs. */
  pairs: readonly (readonly [EntityKind, EntityKind])[];
  /** Whether the edge may carry `from` / `until`. */
  timeBounded: boolean;
  /** Cost in shortest-path search; lower is a stronger link. */
  weight: number;
  /** Label when viewed from the target's side; null for symmetric types. */
  inverse: string | null;
  /** Label from the source's side. */
  label: string;
}

const C = "character";
const E = "event";
const L = "location";
const O = "organization";

export const EDGE_TYPES = {
  // Structural
  parent_of: {
    category: "structural",
    symmetric: false,
    pairs: [[C, C]],
    timeBounded: false,
    weight: 1,
    label: "parent of",
    inverse: "child of",
  },
  sibling_of: {
    category: "structural",
    symmetric: true,
    pairs: [[C, C]],
    timeBounded: false,
    weight: 1,
    label: "sibling of",
    inverse: null,
  },
  spouse_of: {
    category: "structural",
    symmetric: true,
    pairs: [[C, C]],
    timeBounded: true,
    weight: 1,
    label: "spouse of",
    inverse: null,
  },
  member_of: {
    category: "structural",
    symmetric: false,
    pairs: [[C, O]],
    timeBounded: true,
    weight: 3,
    label: "member of",
    inverse: "has member",
  },
  leads: {
    category: "structural",
    symmetric: false,
    pairs: [[C, O]],
    timeBounded: true,
    weight: 2,
    label: "leads",
    inverse: "led by",
  },
  part_of: {
    category: "structural",
    symmetric: false,
    pairs: [
      [O, O],
      [L, L],
    ],
    timeBounded: true,
    weight: 3,
    label: "part of",
    inverse: "includes",
  },
  hometown: {
    category: "structural",
    symmetric: false,
    pairs: [[C, L]],
    timeBounded: false,
    weight: 2,
    label: "from",
    inverse: "hometown of",
  },
  lives_in: {
    category: "structural",
    symmetric: false,
    pairs: [[C, L]],
    timeBounded: true,
    weight: 3,
    label: "lives in",
    inverse: "home of",
  },
  based_at: {
    category: "structural",
    symmetric: false,
    pairs: [[O, L]],
    timeBounded: true,
    weight: 3,
    label: "based at",
    inverse: "base of",
  },
  controls: {
    category: "structural",
    symmetric: false,
    pairs: [[O, L]],
    timeBounded: true,
    weight: 3,
    label: "controls",
    inverse: "controlled by",
  },
  // Event
  participated_in: {
    category: "event",
    symmetric: false,
    pairs: [
      [C, E],
      [O, E],
    ],
    timeBounded: false,
    weight: 2,
    label: "took part in",
    inverse: "participant",
  },
  occurred_at: {
    category: "event",
    symmetric: false,
    pairs: [[E, L]],
    timeBounded: false,
    weight: 2,
    label: "took place at",
    inverse: "site of",
  },
  sub_event_of: {
    category: "event",
    symmetric: false,
    pairs: [[E, E]],
    timeBounded: false,
    weight: 1,
    label: "part of",
    inverse: "includes",
  },
  killed: {
    category: "event",
    symmetric: false,
    pairs: [[C, C]],
    timeBounded: false,
    weight: 1,
    label: "killed",
    inverse: "killed by",
  },
  // Causal and experimental
  caused: {
    category: "causal",
    symmetric: false,
    pairs: [[E, E]],
    timeBounded: false,
    weight: 1,
    label: "led to",
    inverse: "caused by",
  },
  experimented_on: {
    category: "causal",
    symmetric: false,
    pairs: [
      [C, C],
      [O, C],
    ],
    timeBounded: true,
    weight: 1,
    label: "experimented on",
    inverse: "subject of",
  },
  acted_through: {
    category: "causal",
    symmetric: false,
    pairs: [[C, C]],
    timeBounded: true,
    weight: 1,
    label: "acted through",
    inverse: "used as a vessel by",
  },
} as const satisfies Record<string, EdgeTypeDefinition>;

export type EdgeType = keyof typeof EDGE_TYPES;
export const EDGE_TYPE_NAMES = Object.keys(EDGE_TYPES) as EdgeType[];

/** Types whose cycles make no sense (relationships.md §9). */
export const ACYCLIC_EDGE_TYPES: readonly EdgeType[] = [
  "parent_of",
  "sub_event_of",
  "part_of",
  "caused",
];
