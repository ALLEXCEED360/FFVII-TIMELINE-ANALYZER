// Every lazily loaded page, in one place: the routes load them on first visit, and the navigation
// starts loading a section's page as soon as its link is hovered or focused.

type PageModule = Promise<{ Component: () => React.ReactNode }>;

export const PAGES = {
  timeline: () => import("../pages/TimelinePage").then((m) => ({ Component: m.TimelinePage })),
  explore: () => import("../pages/ExplorePage").then((m) => ({ Component: m.ExplorePage })),
  compare: () => import("../pages/ComparePage").then((m) => ({ Component: m.ComparePage })),
  comparison: () =>
    import("../pages/ComparisonPage").then((m) => ({ Component: m.ComparisonPage })),
  network: () =>
    import("../pages/NetworkOverviewPage").then((m) => ({ Component: m.NetworkOverviewPage })),
  networkView: () => import("../pages/NetworkPage").then((m) => ({ Component: m.NetworkPage })),
  divergence: () =>
    import("../pages/DivergencePage").then((m) => ({ Component: m.DivergencePage })),
  divergenceView: () =>
    import("../pages/DivergenceViewPage").then((m) => ({ Component: m.DivergenceViewPage })),
  archive: () => import("../pages/ArchivePage").then((m) => ({ Component: m.ArchivePage })),
  research: () => import("../pages/ResearchPage").then((m) => ({ Component: m.ResearchPage })),
  archiveTitle: () =>
    import("../pages/ArchiveTitlePage").then((m) => ({ Component: m.ArchiveTitlePage })),
  sourceUnit: () =>
    import("../pages/SourceUnitPage").then((m) => ({ Component: m.SourceUnitPage })),
  entity: () => import("../pages/EntityPage").then((m) => ({ Component: m.EntityPage })),
} satisfies Record<string, () => PageModule>;

export type PageName = keyof typeof PAGES;

/** Starts loading a page's code ahead of navigation. Failures are ignored: the route retries. */
export function preloadPage(name: PageName): void {
  PAGES[name]().catch(() => undefined);
}
