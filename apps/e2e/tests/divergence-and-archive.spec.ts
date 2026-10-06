import { expect, test } from "@playwright/test";

// The signature view and the source trail: from an event to where its titles part ways, and from
// a citation to everything else that part of the game backs.

test("from an event to where the games part ways, then from an earlier moment", async ({
  page,
}) => {
  await page.goto("/event/aerith-death");
  await page.getByRole("main").getByRole("link", { name: "Divergence", exact: true }).click();
  await expect(page).toHaveURL(/\/divergence\/event\/aerith-death$/);

  const turn = page.getByRole("region", { name: "Death of Aerith" });
  await expect(turn.getByRole("listitem").first()).toContainText("Told differently");

  const before = page.getByRole("region", { name: "The story so far" });
  await before.getByRole("button", { name: /Show the \d+ earlier moments/ }).click();
  await before.getByRole("button", { name: /^Fall of the Sector 7 Plate/ }).click();
  await page
    .getByRole("complementary", { name: "Event details" })
    .getByRole("button", { name: "Make this the turning point" })
    .click();
  await expect(page).toHaveURL(/\/divergence\/event\/sector-7-plate-fall/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Fall of the Sector 7 Plate" }),
  ).toBeVisible();
});

test("from a citation to its part of the game, and on through the archive", async ({ page }) => {
  await page.goto("/event/aerith-death");
  await page.getByRole("link", { name: "Rebirth · Ch. 14" }).first().click();
  await expect(page).toHaveURL(/\/archive\/rebirth\/chapter-14$/);
  await expect(page.getByRole("heading", { level: 1, name: "End of the World" })).toBeVisible();

  // Everything else the chapter backs, including the research question about it.
  await expect(page.getByRole("region", { name: /^Shown here/ })).toContainText("Tifa Lockhart");
  await expect(page.getByRole("region", { name: "Open questions here" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Neighbouring units" })
    .getByRole("link")
    .first()
    .click();
  await expect(page).toHaveURL(/\/archive\/rebirth\/chapter-13$/);
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Rebirth" })
    .click();
  await expect(page.getByRole("region", { name: "Chapters" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Archive" })
    .click();
  await page.getByRole("link", { name: "Open the research log" }).click();
  await expect(page.getByRole("region", { name: /^Open questions/ })).toContainText(
    "How Rebirth shows Aerith's death",
  );
});

test("on a phone: an event opens under itself, and a comparison is tabs @mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "phone layout");
  await page.goto("/timeline");
  const event = page.getByRole("button", { name: /^Nibelheim Incident/ });
  await event.click();
  await expect(page).toHaveURL(/event=event_nibelheim_incident/);
  // The event's window opens inside its own row, not off to the side.
  await expect(
    page.getByRole("listitem").filter({ has: event }).getByRole("complementary", {
      name: "Event details",
    }),
  ).toContainText("How each game tells it");

  await page.goto("/compare/event/aerith-death");
  const tabs = page.getByRole("tablist", { name: "Games" });
  await expect(tabs.getByRole("tab", { name: "OG" })).toHaveAttribute("aria-selected", "true");
  await tabs.getByRole("tab", { name: "Rebirth" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(/Rebirth|Cloud/);
  // The page never scrolls sideways.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
