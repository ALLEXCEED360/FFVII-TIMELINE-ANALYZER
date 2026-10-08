import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// Every kind of page, audited with axe against WCAG 2.2 AA (including contrast) once its data loads.

const PAGES: { name: string; path: string; ready: (page: Page) => Promise<void> }[] = [
  { name: "home", path: "/", ready: heading("One story.") },
  { name: "timeline", path: "/timeline", ready: story },
  { name: "timeline (play order)", path: "/timeline?view=play", ready: story },
  {
    name: "timeline with an event open",
    path: "/timeline?event=event_nibelheim_incident",
    ready: eventWindow,
  },
  { name: "explore", path: "/explore", ready: heading("Who's who, and what's what") },
  { name: "character", path: "/character/cloud-strife", ready: heading("Cloud Strife") },
  { name: "event", path: "/event/aerith-death", ready: heading("Death of Aerith") },
  { name: "compare", path: "/compare", ready: heading("Compare") },
  { name: "comparison", path: "/compare/event/aerith-death", ready: heading("Death of Aerith") },
  { name: "network overview", path: "/network", ready: heading("Who's linked to whom") },
  { name: "network", path: "/network/character/cloud-strife", ready: graph },
  { name: "divergence", path: "/divergence", ready: heading("Divergence") },
  { name: "divergence view", path: "/divergence/event/aerith-death?worlds=1", ready: split },
  { name: "archive", path: "/archive", ready: heading("The games, chapter by chapter") },
  { name: "archive title", path: "/archive/og", ready: heading("Final Fantasy VII") },
  { name: "archive unit", path: "/archive/rebirth/chapter-14", ready: heading("End of the World") },
  { name: "research log", path: "/archive/research", ready: heading("How the facts were checked") },
  { name: "credits", path: "/credits", ready: heading("Credits") },
  { name: "settings", path: "/settings", ready: heading("Settings") },
  { name: "not found", path: "/nowhere/at-all", ready: heading("No record found") },
];

function heading(name: string) {
  return async (page: Page) => {
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
  };
}

/** The story's first chapter (or a game's play order) has arrived. */
async function story(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: "Timeline" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(
    page
      .getByRole("region", { name: /The Distant Past|OG/ })
      .getByRole("listitem")
      .first(),
  ).toBeVisible();
}

async function eventWindow(page: Page) {
  await expect(page.getByRole("complementary", { name: "Event details" })).toContainText(
    "How each telling tells it",
  );
  await expect(page.getByRole("status")).toHaveCount(0);
}

/** The web has settled, with the centre chosen beside it. */
async function graph(page: Page) {
  await expect(page.getByRole("complementary", { name: "Chosen in the web" })).toBeVisible();
  await expect(page.getByRole("img", { name: /The web of links/ })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
}

/** The turning point and the games' lines after it have arrived. */
async function split(page: Page) {
  await expect(page.getByRole("region", { name: "Where each telling goes" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
}

for (const { name, path, ready } of PAGES) {
  test(`${name} has no accessibility violations @mobile`, async ({ page }) => {
    await page.goto(path);
    await ready(page);
    // Measure the page as it rests: entrances fade and lean in, and a half-faded label would
    // fail the contrast check. Endless decorative loops never finish, so they're left out.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity,
        ),
    );
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
