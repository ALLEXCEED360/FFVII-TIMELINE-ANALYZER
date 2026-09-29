import type { RouteObject } from "react-router";
import { AppShell } from "../components/AppShell";
import { Loading } from "../components/QueryState";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RouteError } from "../pages/RouteError";
import { PAGES } from "./pages";

// The home page ships with the app; other pages load on first visit, so the first screen doesn't
// wait for code it may never need (the timeline's chart and zoom, later the graph…).

/** A page whose code loads on first visit, with a loading panel while it arrives. */
function lazyPage(
  path: string,
  load: () => Promise<{ Component: () => React.ReactNode }>,
): RouteObject {
  return {
    path,
    lazy: load,
    // Shown when the app is opened directly on this page, before its code has loaded.
    hydrateFallbackElement: <Loading variant="panel" />,
  };
}

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    // Last resort, if the shell itself fails.
    errorElement: <RouteError />,
    children: [
      {
        // A page that fails to load or render shows an error inside the shell.
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage /> },
          lazyPage("timeline", PAGES.timeline),
          lazyPage("explore", PAGES.explore),
          lazyPage("compare", PAGES.compare),
          lazyPage("compare/:kind/:slug", PAGES.comparison),
          lazyPage("network", PAGES.network),
          lazyPage("network/:kind/:slug", PAGES.networkView),
          lazyPage("divergence", PAGES.divergence),
          lazyPage("divergence/:kind/:slug", PAGES.divergenceView),
          lazyPage("archive", PAGES.archive),
          lazyPage("archive/research", PAGES.research),
          lazyPage("archive/:title", PAGES.archiveTitle),
          lazyPage("archive/:title/:unit", PAGES.sourceUnit),
          // /character/cloud-strife, /event/nibelheim-incident, … (unknown kinds show "not found").
          lazyPage(":kind/:slug", PAGES.entity),
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
