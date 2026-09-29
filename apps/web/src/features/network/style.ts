import type { StylesheetJson } from "cytoscape";

// Cytoscape can't read CSS variables, so the theme's colours (styles.css) are repeated here.
// Kinds get a colour and a shape, so they're told apart without relying on colour alone.

export const KIND_STYLE = {
  character: { color: "#58e0a8", shape: "ellipse" },
  event: { color: "#f2cf7e", shape: "diamond" },
  location: { color: "#7fb2ff", shape: "round-rectangle" },
  organization: { color: "#c9a2f2", shape: "hexagon" },
} as const;

export const CATEGORY_COLOR = {
  structural: "#7c8f9f",
  event: "#a1b2c0",
  causal: "#ff8a7a",
} as const;

const TEXT = "#c9d4dd";
const BACKGROUND = "#0c131b";
const MAKO = "#8ef0c6";

export const GRAPH_STYLE: StylesheetJson = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      color: TEXT,
      "font-family": "Inter Variable, system-ui, sans-serif",
      "font-size": 11,
      "text-valign": "bottom",
      "text-margin-y": 6,
      "text-wrap": "wrap",
      "text-max-width": "110px",
      "text-outline-color": BACKGROUND,
      "text-outline-width": 2,
      width: 22,
      height: 22,
      "border-width": 2,
      "border-color": BACKGROUND,
      "transition-property": "opacity, width, height",
      "transition-duration": 150,
    },
  },
  ...Object.entries(KIND_STYLE).map(([kind, { color, shape }]) => ({
    selector: `node.${kind}`,
    style: { "background-color": color, shape },
  })),
  {
    selector: "node.center",
    style: { width: 34, height: 34, "font-weight": 600, "font-size": 13 },
  },
  { selector: "node.expanded", style: { "border-style": "dashed", "border-color": TEXT } },
  {
    selector: "node.selected",
    style: {
      "border-color": MAKO,
      "border-width": 4,
      "underlay-color": MAKO,
      "underlay-opacity": 0.25,
      "underlay-padding": 6,
    },
  },
  { selector: "node.on-path", style: { "border-color": MAKO, "border-width": 3 } },
  {
    selector: "edge",
    style: {
      width: 1.5,
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.8,
      label: "data(label)",
      "font-size": 9,
      color: "#7c8f9f",
      "text-rotation": "autorotate",
      "text-outline-color": BACKGROUND,
      "text-outline-width": 2,
      "text-opacity": 0,
    },
  },
  ...Object.entries(CATEGORY_COLOR).map(([category, color]) => ({
    selector: `edge.${category}`,
    style: { "line-color": color, "target-arrow-color": color },
  })),
  { selector: "edge.single-title", style: { "line-style": "dashed" } },
  { selector: "edge.near", style: { width: 2.5, "text-opacity": 1 } },
  {
    selector: "edge.on-path",
    style: {
      width: 4,
      "line-color": MAKO,
      "target-arrow-color": MAKO,
      "text-opacity": 1,
      color: MAKO,
    },
  },
  { selector: ".faded", style: { opacity: 0.18 } },
];
