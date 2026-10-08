import type { Core, ElementDefinition, NodeSingular } from "cytoscape";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../lib/motion";
import { GRAPH_STYLE } from "./style";

// The web (Cytoscape + fcose, loaded on demand). Changes apply as a diff; the layout reruns only when
// the set of entities changes. Plain scroll scrolls the page; Ctrl/⌘ + scroll zooms.

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
  // Hidden until its first layout settles, so it never shows as a heap in one corner.
  const [settled, setSettled] = useState(false);
  const settledRef = useRef(false);
  const reducedMotion = useReducedMotion();
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
        // A plain scroll scrolls the page, not the web; see the wheel handler below.
        userZoomingEnabled: false,
      });
      instance.on("mouseover", "node", (event) => {
        const hood = (event.target as NodeSingular).closedNeighborhood();
        instance.batch(() => {
          instance.elements().not(hood).addClass("dim");
          hood.edges().addClass("lit");
        });
        if (container.current) container.current.style.cursor = "pointer";
      });
      instance.on("mouseout", "node", () => {
        instance.batch(() => {
          instance.elements().removeClass("dim lit");
        });
        if (container.current) container.current.style.cursor = "";
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

  // Cytoscape only re-measures on window resize; refit whenever the box itself changes size.
  useEffect(() => {
    const instance = cy.current;
    const box = container.current;
    if (!ready || !instance || !box || typeof ResizeObserver === "undefined") return;
    let last = `${String(box.clientWidth)}x${String(box.clientHeight)}`;
    const observer = new ResizeObserver(() => {
      const size = `${String(box.clientWidth)}x${String(box.clientHeight)}`;
      if (size === last) return;
      last = size;
      instance.resize();
      instance.fit(undefined, 40);
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [ready]);

  // Ctrl/⌘ + scroll zooms around the pointer; a plain scroll is left to the page.
  useEffect(() => {
    const box = container.current;
    if (!ready || !box) return;
    const onWheel = (event: WheelEvent) => {
      const instance = cy.current;
      if (!instance || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const rect = box.getBoundingClientRect();
      instance.zoom({
        level: instance.zoom() * (event.deltaY < 0 ? 1.15 : 1 / 1.15),
        renderedPosition: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      });
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      box.removeEventListener("wheel", onWheel);
    };
  }, [ready]);

  // Node transitions (selection, fading) follow the Motion setting too.
  useEffect(() => {
    const instance = cy.current;
    if (!ready || !instance) return;
    instance
      .style()
      .selector("node")
      .style("transition-duration", reducedMotion ? 0 : 150)
      .update();
  }, [ready, reducedMotion]);

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
    // Measure the box afresh, and fit the web to it once the layout settles: laid out before the
    // box had its final size, it would sit squashed in a corner.
    instance.resize();
    instance.one("layoutstop", () => {
      instance.resize();
      instance.fit(undefined, 50);
      settledRef.current = true;
      setSettled(true);
    });
    instance
      .layout({
        name: "fcose",
        // The first web appears already laid out; later ones (adding a thing's own links) grow.
        animate: settledRef.current && !reducedMotion,
        animationDuration: 400,
        randomize: true,
        // Room enough that names don't run into each other.
        nodeRepulsion: () => 26000,
        idealEdgeLength: () => 170,
        nodeSeparation: 120,
        nodeDimensionsIncludeLabels: true,
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
    <div className="m-panel nw-graph">
      <div
        ref={container}
        // Cytoscape makes its container position: relative, so size it explicitly.
        className={`nw-graph-canvas h-full w-full ${settled ? "is-settled" : ""}`}
        role="img"
        aria-label="The web of links. The panel beside it and the list below it say the same in words."
      />
      {!settled && (
        <div role="status" className="nw-graph-loading">
          Drawing the web…
        </div>
      )}
      <p aria-hidden="true" className="nw-graph-hint">
        Tap anything to see its links · double-tap to put it in the centre · drag to move around
      </p>
      <div className="nw-graph-tools">
        <button
          type="button"
          className="nw-tool"
          aria-label="Zoom in"
          onClick={() => {
            zoom(1.3);
          }}
        >
          +
        </button>
        <button
          type="button"
          className="nw-tool"
          aria-label="Zoom out"
          onClick={() => {
            zoom(1 / 1.3);
          }}
        >
          −
        </button>
        <button
          type="button"
          className="nw-tool nw-tool-wide"
          onClick={() => cy.current?.fit(undefined, 50)}
        >
          Show all
        </button>
      </div>
    </div>
  );
}
