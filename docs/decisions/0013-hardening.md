# 0013 — Hardening: end-to-end tests, accessibility and performance

- **Status:** Accepted
- **Date:** 2026-09-29
- **Builds on:** [0007](0007-web-app.md)

## Context

Blueprint §33–35 asks for keyboard navigation, visible focus, semantic HTML, a reduced-motion option, adequate contrast and text alternatives; lazy loading, caching and memoized visualizations, without loading the whole dataset on every page; and a Playwright journey through the app. Until now every page had unit tests with axe in jsdom, which can't measure colour contrast, layout or real keyboard focus.

## Decision

### End-to-end tests: `apps/e2e`

Playwright runs against the real stack: the API on a seeded Postgres, and the **production build** of the web app (`vite preview`), in desktop Chrome and a phone profile (Pixel 7). `pnpm e2e` builds the web app and runs the suite; locally it reuses a running API. A new CI job (`e2e`) migrates and seeds a Postgres service, installs Chromium and runs everything.

| Spec                         | Covers                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `journey`                    | Blueprint §35 in order: open the app, search Cloud, open him, open a related event, compare, switch versions, open the graph, follow a relationship, return to the timeline |
| `divergence-and-archive`     | Event → divergence map → re-root; citation → unit page → neighbouring chapter → research log; a phone journey (timeline list, comparison tabs)                              |
| `accessibility`              | axe (WCAG 2.2 A/AA, **including contrast**) on 18 pages, desktop and phone                                                                                                  |
| `keyboard-and-motion`        | Skip link, timeline and divergence stations by keyboard, the search palette keyboard-only, visible focus on every stop, the Motion setting                                  |
| `resilience-and-performance` | API outage (error, retry, recovery), a page whose code fails to download, the graph library loading only on network pages, prefetching, a lean home page                    |
| `layout`                     | No page scrolls sideways on a phone                                                                                                                                         |

The suite found and fixed three real problems: the navigation overflowed phones (every page scrolled sideways — now it scrolls on its own row), citation links were below the 24 px target size, and the divergence map's SVG stations had no visible focus ring and opened scrolled away from the pivot.

### Accessibility

- **Reduced motion:** a **Motion** setting in the footer — System (the default, following `prefers-reduced-motion`), Reduced or Full — remembered per visitor. It is mirrored to `<html data-motion>` for CSS, and `useReducedMotion()` covers the graph's layout animation and node transitions.
- **Focus:** SVG controls (timeline markers, divergence stations) draw their own focus rings, since outlines don't follow SVG shapes.
- **Errors:** every page has an error boundary inside the site's shell. A page whose code fails to load (typically after a redeploy) says so and offers a reload; nothing ever renders blank.

### Performance

- **Budgets** (`pnpm web:size`, in CI after the build, gzipped): initial JavaScript ≤ 135 kB (now 118), CSS ≤ 15 kB (10), any page ≤ 30 kB (largest: the timeline, 21). The initial bundle is almost entirely React, React Router and TanStack Query.
- **Prefetching:** hovering or focusing a section in the navigation starts loading its page, so the click doesn't wait. All page loaders live in `app/pages.ts`, shared by the routes and the navigation.
- Already in place and now tested: lazy routes, the graph libraries only on network pages, neighbourhood-sized graphs, memoized layouts, and TanStack Query caching.
- **Not done:** virtualized lists and pagination. The largest list is 61 entities, where they would cost more than they save; revisit when the catalogue passes a few hundred.

## Consequences

- ✅ The whole app is exercised the way a visitor uses it, in a real browser, on every push.
- ✅ Contrast, target size and phone layout are now checked automatically, not by eye.
- ❌ The e2e job depends on seeded data, so a data change can require updating a journey — the tests name events like the Death of Aerith on purpose, as a visitor would.
- ❌ One more CI job (about a minute and a half, mostly installing Chromium).
