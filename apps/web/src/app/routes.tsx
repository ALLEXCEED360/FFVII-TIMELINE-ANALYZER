import type { RouteObject } from "react-router";
import { AppShell } from "../components/AppShell";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";

// The home page ships with the app; other pages load on first visit, so the first screen doesn't
// wait for code it may never need (the timeline's chart and zoom, later the graph…).
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "timeline",
        lazy: () => import("../pages/TimelinePage").then((m) => ({ Component: m.TimelinePage })),
      },
      {
        path: "explore",
        lazy: () => import("../pages/ExplorePage").then((m) => ({ Component: m.ExplorePage })),
      },
      {
        path: "compare",
        lazy: () => import("../pages/ComparePage").then((m) => ({ Component: m.ComparePage })),
      },
      {
        path: "compare/:kind/:slug",
        lazy: () =>
          import("../pages/ComparisonPage").then((m) => ({ Component: m.ComparisonPage })),
      },
      // /character/cloud-strife, /event/nibelheim-incident, … (unknown kinds show "not found").
      {
        path: ":kind/:slug",
        lazy: () => import("../pages/EntityPage").then((m) => ({ Component: m.EntityPage })),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
