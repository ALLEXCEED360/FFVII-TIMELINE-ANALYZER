import type { RouteObject } from "react-router";
import { AppShell } from "../components/AppShell";
import { Loading } from "../components/QueryState";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";

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
    children: [
      { index: true, element: <HomePage /> },
      lazyPage("timeline", () =>
        import("../pages/TimelinePage").then((m) => ({ Component: m.TimelinePage })),
      ),
      lazyPage("explore", () =>
        import("../pages/ExplorePage").then((m) => ({ Component: m.ExplorePage })),
      ),
      lazyPage("compare", () =>
        import("../pages/ComparePage").then((m) => ({ Component: m.ComparePage })),
      ),
      lazyPage("compare/:kind/:slug", () =>
        import("../pages/ComparisonPage").then((m) => ({ Component: m.ComparisonPage })),
      ),
      // /character/cloud-strife, /event/nibelheim-incident, … (unknown kinds show "not found").
      lazyPage(":kind/:slug", () =>
        import("../pages/EntityPage").then((m) => ({ Component: m.EntityPage })),
      ),
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
