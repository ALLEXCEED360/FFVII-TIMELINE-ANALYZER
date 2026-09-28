import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { vi } from "vitest";
import { routes } from "../app/routes";
import entityAerithDeath from "./entity-aerith-death.json";
import reference from "./reference.json";
import timeline from "./timeline.json";

// Renders the app at a URL, with `fetch` answering from fixtures captured from the real API
// (reference.json, timeline.json, entity-*.json — regenerate them if the API's shapes change).

type Responder = (url: URL) => { status: number; body: unknown } | undefined;

const FIXTURES: Record<string, unknown> = {
  "/reference": reference,
  "/timeline": timeline,
  "/entities/event_aerith_death": entityAerithDeath,
  "/entities": { items: [] },
};

export function stubApi(override?: Responder) {
  const requests: URL[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: Request) => {
      const url = new URL(input.url);
      requests.push(url);
      const custom = override?.(url);
      const answer =
        custom ??
        (url.pathname in FIXTURES
          ? { status: 200, body: FIXTURES[url.pathname] }
          : { status: 404, body: { error: "not_found", message: "No such entity." } });
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
