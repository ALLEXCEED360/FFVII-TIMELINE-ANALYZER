import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { vi } from "vitest";
import { routes } from "../app/routes";
import compareAerithDeath from "./compare-aerith-death.json";
import compareMemories from "./compare-memories.json";
import compareSector7 from "./compare-sector-7.json";
import compareTifa from "./compare-tifa.json";
import differences from "./differences.json";
import entities from "./entities.json";
import entityAerithDeath from "./entity-aerith-death.json";
import entityCloudStrife from "./entity-cloud-strife.json";
import metricsIntermission from "./metrics-intermission.json";
import networkCloud from "./network-cloud.json";
import pathCloudSephiroth from "./path-cloud-sephiroth.json";
import reference from "./reference.json";
import searchAeris from "./search-aeris.json";
import searchNibelheim from "./search-nibelheim.json";
import timeline from "./timeline.json";

// Renders the app at a URL, with `fetch` answering from fixtures captured from the real API
// (reference.json, timeline.json, entity-*.json — regenerate them if the API's shapes change).

type Responder = (url: URL) => { status: number; body: unknown } | undefined;

const FIXTURES: Record<string, unknown> = {
  "/reference": reference,
  "/timeline": timeline,
  "/entities": entities,
  "/entities/event_aerith_death": entityAerithDeath,
  "/entities/character_cloud_strife": entityCloudStrife,
  "/compare/event_aerith_death": compareAerithDeath,
  "/compare/event_cloud_memories_restored": compareMemories,
  "/compare/character_tifa_lockhart": compareTifa,
  "/compare/location_sector_7": compareSector7,
  "/differences": differences,
  "/network/character_cloud_strife": networkCloud,
  "/network/path": pathCloudSephiroth,
  "/network/metrics": metricsIntermission,
};

/** Search answers by query; anything else finds nothing. */
const SEARCHES: Record<string, unknown> = { aeris: searchAeris, nibelheim: searchNibelheim };

function answerFor(url: URL): { status: number; body: unknown } {
  if (url.pathname === "/search") {
    const q = url.searchParams.get("q") ?? "";
    return { status: 200, body: SEARCHES[q] ?? { terms: [q], items: [] } };
  }
  return url.pathname in FIXTURES
    ? { status: 200, body: FIXTURES[url.pathname] }
    : { status: 404, body: { error: "not_found", message: "No such entity." } };
}

export function stubApi(override?: Responder) {
  const requests: URL[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: Request) => {
      const url = new URL(input.url);
      requests.push(url);
      const answer = override?.(url) ?? answerFor(url);
      return Promise.resolve(
        new Response(JSON.stringify(answer.body), {
          status: answer.status,
          headers: { "content-type": "application/json" },
        }),
      );
    }),
  );
  return requests;
}

export function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router };
}
