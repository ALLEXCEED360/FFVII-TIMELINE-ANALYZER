import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// Every kind of page, audited with axe in a real browser against WCAG 2.2 A and AA — including
// colour contrast, which the unit tests (jsdom) can't measure. Each page is checked once its data
// has loaded, since loading states are replaced almost at once.

const PAGES: { name: string; path: string; ready: (page: Page) => Promise<void> }[] = [
  { name: "home", path: "/", ready: heading("One story.") },
  { name: "timeline", path: "/timeline", ready: chart },
  { name: "timeline (play order)", path: "/timeline?view=play", ready: chart },
  {
    name: "timeline with inspector",
    path: "/timeline?event=event_nibelheim_incident",
    ready: inspector,
  },
  { name: "explore", path: "/explore", ready: heading("Explore") },
  { name: "character", path: "/character/cloud-strife", ready: heading("Cloud Strife") },
  { name: "event", path: "/event/aerith-death", ready: heading("Death of Aerith") },
  { name: "compare", path: "/compare", ready: heading("Compare") },
  { name: "comparison", path: "/compare/event/aerith-death", ready: heading("Death of Aerith") },
  { name: "network overview", path: "/network", ready: heading("Network") },
  { name: "network", path: "/network/character/cloud-strife", ready: graph },
  { name: "divergence", path: "/divergence", ready: heading("Divergence") },
  { name: "divergence map", path: "/divergence/event/aerith-death?worlds=1", ready: map },
  { name: "archive", path: "/archive", ready: heading("Archive") },
  { name: "archive title", path: "/archive/og", ready: heading("Final Fantasy VII") },
  { name: "archive unit", path: "/archive/rebirth/chapter-14", ready: heading("End of the World") },
  { name: "research log", path: "/archive/research", ready: heading("Research log") },
  { name: "not found", path: "/nowhere/at-all", ready: heading("No record found") },
];

function heading(name: string) {
  return async (page: Page) => {
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
  };
}

/** The chart on wide screens; on phones, the list layout instead. */
async function chart(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: "Timeline" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: /Timeline chart/ })
      .or(page.getByRole("list"))
      .first(),
  ).toBeVisible();
}

async function inspector(page: Page) {
  await expect(page.getByRole("complementary", { name: "Inspector" })).toContainText("Nibelheim");
  await expect(page.getByRole("status")).toHaveCount(0);
}

async function graph(page: Page) {
  await expect(page.getByRole("list", { name: "Entities and their connections" })).toBeVisible();
}

async function map(page: Page) {
  await expect(page.getByRole("group", { name: /Divergence map/ })).toBeVisible();
}

for (const { name, path, ready } of PAGES) {
  test(`${name} has no accessibility violations @mobile`, async ({ page }) => {
    await page.goto(path);
    await ready(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const summary = results.violations.map(
      (v) =>
        `${v.id} (${v.impact ?? "?"}): ${v.help} — ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(" | ")}`,
    );
    expect(summary).toEqual([]);
  });
}
