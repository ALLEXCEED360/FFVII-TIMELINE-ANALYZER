import type { Core, ElementDefinition, NodeSingular } from "cytoscape";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { GRAPH_STYLE } from "./style";

// The interactive graph (blueprint §27): Cytoscape with the fcose layout, loaded on demand so it
// never weighs down other pages. One Cytoscape instance lives for the component's lifetime;
// changes are applied as a diff, and the layout reruns only when the set of entities changes.

type Cytoscape = typeof import("cytoscape");

let loaded: Promise<Cytoscape> | undefined;
function loadCytoscape(): Promise<Cytoscape> {
  loaded ??= Promise.all([import("cytoscape"), import("cytoscape-fcose")]).then(
    ([{ default: cytoscape }, { default: fcose }]) => {
      cytoscape.use(fcose);
      return cytoscape;
    },
  );
  return loaded;
}

export default function GraphView({
  elements,
  layoutKey,
  onSelect,
  onFocus,
}: {
  elements: ElementDefinition[];
  /** Changes when the set of entities changes, which reruns the layout. */
  layoutKey: string;
  onSelect: (id: string | null) => void;
  /** Double-click: make this entity the centre. */
  onFocus: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  // Cytoscape's listeners are attached once; they call whatever handlers are current.
  const handlers = useRef({ onSelect, onFocus });
  useEffect(() => {
    handlers.current = { onSelect, onFocus };
  });

  // Create the instance once.
  useEffect(() => {
    let cancelled = false;
    void loadCytoscape().then((cytoscape) => {
      if (cancelled || !container.current) return;
      const instance = cytoscape({
        container: container.current,
        style: GRAPH_STYLE,
        minZoom: 0.25,
        maxZoom: 3,
        wheelSensitivity: 0.3,
      });
      instance.on("tap", "node", (event) => {
        handlers.current.onSelect((event.target as NodeSingular).id());
      });
      instance.on("dbltap", "node", (event) => {
        handlers.current.onFocus((event.target as NodeSingular).id());
      });
      instance.on("tap", (event) => {
        if (event.target === instance) handlers.current.onSelect(null);
      });
      cy.current = instance;
      setReady(true);
    });
    return () => {
      cancelled = true;
      cy.current?.destroy();
      cy.current = null;
    };
  }, []);

  // Apply the elements as a diff: remove what's gone, add what's new, update the rest.
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance) return;
    const wanted = new Map(elements.map((e) => [String(e.data.id), e]));
    instance.batch(() => {
      instance.elements().forEach((el) => {
        if (!wanted.has(el.id())) el.remove();
      });
      const toAdd: ElementDefinition[] = [];
      for (const [id, definition] of wanted) {
        const existing = instance.getElementById(id);
        if (existing.empty()) toAdd.push(definition);
        else {
          existing.data(definition.data);
          existing.classes(typeof definition.classes === "string" ? definition.classes : "");
        }
      }
      // Nodes before edges, so every edge finds its endpoints.
      instance.add(toAdd.filter((e) => e.group === "nodes"));
      instance.add(toAdd.filter((e) => e.group === "edges"));
    });
  }, [elements, ready]);

  // Lay out again when the set of entities changes.
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance || instance.nodes().empty()) return;
    instance
      .layout({
        name: "fcose",
        animate: !reducedMotion,
        animationDuration: 400,
        randomize: true,
        nodeRepulsion: () => 9000,
        idealEdgeLength: () => 110,
        padding: 40,
      } as never)
      .run();
  }, [layoutKey, ready, reducedMotion]);

  const zoom = (factor: number) => {
    const instance = cy.current;
    if (!instance) return;
    instance.zoom({
      level: instance.zoom() * factor,
      renderedPosition: { x: instance.width() / 2, y: instance.height() / 2 },
    });
  };

  return (
    <div className="panel relative h-[60vh] min-h-96 overflow-hidden">
      <div
        ref={container}
        // Cytoscape makes its container position: relative, so size it explicitly.
        className="h-full w-full"
        role="img"
        aria-label="Relationship graph. The list below the graph has the same information as text."
      />
      {!ready && (
        <div role="status" className="absolute inset-0 flex items-center justify-center">
          <span className="label">Loading the graph…</span>
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          type="button"
          className="btn bg-night-900 px-2.5"
          aria-label="Zoom in"
          onClick={() => {
            zoom(1.3);
          }}
        >
          +
        </button>
        <button
          type="button"
          className="btn bg-night-900 px-2.5"
          aria-label="Zoom out"
          onClick={() => {
            zoom(1 / 1.3);
          }}
        >
          −
        </button>
        <button
          type="button"
          className="btn bg-night-900"
          onClick={() => cy.current?.fit(undefined, 40)}
        >
          Fit
        </button>
      </div>
    </div>
  );
}
