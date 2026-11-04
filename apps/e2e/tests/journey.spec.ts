import { type Locator, type Page, expect, test } from "@playwright/test";

// The core journey: search, an entity, a related event, compare, the graph, back to the timeline.

test("from search to comparison, graph and back to the timeline", async ({ page }) => {
  // 1. Open the app.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One story.");

  // 2. Search for Cloud with the command palette.
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: /Search characters/ });
  await expect(search).toBeFocused();
  await search.fill("cloud");
  await expect(page.getByRole("option", { name: /Cloud Strife/ }).first()).toBeVisible();

  // 3. Open the character.
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/character\/cloud-strife$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cloud Strife" })).toBeVisible();

  // 4. Open a related event from his connections.
  const connections = page.getByRole("region", { name: /Connections/ });
  await connections.getByRole("link", { name: "Death of Aerith" }).first().click();
  await expect(page).toHaveURL(/\/event\/aerith-death$/);
  await expect(page.getByRole("heading", { level: 1, name: "Death of Aerith" })).toBeVisible();

  // 5–6. Compare the original with the Remake Trilogy, side by side.
  await page.getByRole("link", { name: "Compare side by side" }).click();
  await expect(page).toHaveURL(/\/compare\/event\/aerith-death/);
  await expect(page.getByRole("heading", { level: 2, name: "The original" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "The Remake Trilogy" })).toBeVisible();
  await expect(page.getByRole("region", { name: /What changes/ })).toContainText("Big change");

  // 7. Open the graph around the event.
  await page.getByRole("link", { name: "Everything about it" }).click();
  await page.getByRole("link", { name: "See the web of links" }).click();
  await expect(page).toHaveURL(/\/network\/event\/aerith-death/);
  const chosen = page.getByRole("complementary", { name: "Chosen in the web" });
  await expect(chosen.getByRole("heading", { name: "Death of Aerith" })).toBeVisible();

  // 8. Follow a link: choose Sephiroth from the moment's links and open his page.
  await chosen.getByRole("button", { name: "Sephiroth", exact: true }).click();
  await expect(page).toHaveURL(/node=character_sephiroth/);
  await chosen.getByRole("link", { name: "Everything about Sephiroth" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Sephiroth" })).toBeVisible();

  // 9. Return to the timeline, on an event he takes part in.
  await page
    .getByRole("region", { name: /Connections/ })
    .getByRole("link", { name: "Nibelheim Incident" })
    .first()
    .click();
  await page.getByRole("link", { name: "Show on the timeline" }).click();
  await expect(page).toHaveURL(/\/timeline\?event=event_nibelheim_incident/);
  await expect(page.getByRole("complementary", { name: "Event details" })).toContainText(
    "Nibelheim Incident",
  );
});

/** Touches the middle of an element and keeps the finger down for most of a second, as a phone does. */
async function hold(page: Page, target: Locator) {
  // Wait until it's in view and has stopped moving (the menu's windows open with a flourish, and
  // the pixel font arriving late can still shift the rows).
  await page.evaluate(() => document.fonts.ready);
  await target.tap({ trial: true });
  const box = await target.boundingBox();
  if (!box) throw new Error("nothing to hold");
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await page.waitForTimeout(700);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test("on a phone, a tap on the home menu opens, and a hold lifts it out to look at @mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "touch only");
  await page.goto("/");
  // Nothing is chosen until a touch.
  await expect(page.locator(".classic-command[aria-current]")).toHaveCount(0);
  // The games in, so the commands have stopped moving as the page fills.
  await expect(page.locator(".classic-member-link")).toHaveCount(4);
  const compare = page.getByRole("link", { name: "Compare", exact: true });
  await hold(page, compare);
  const peek = page.getByRole("dialog", { name: "Compare" });
  await expect(peek).toContainText("what changed between them");
  // Behind it, open as a dialog (so out of the page's roles for now), the glove is on it.
  await expect(page.locator(".classic-command[aria-current]")).toContainText("Compare");
  await expect(page).toHaveURL(/\/$/);
  // A tap outside puts it back.
  await page.touchscreen.tap(8, 8);
  await expect(peek).toHaveCount(0);
  await hold(page, compare);
  await page.getByRole("link", { name: "Open Compare" }).tap();
  await expect(page).toHaveURL(/\/compare$/);

  await page.goto("/");
  await page.getByRole("link", { name: "Network", exact: true }).tap();
  await expect(page).toHaveURL(/\/network$/);
});

test("on a phone, Search and Credits in the menu's bar open on a tap too @mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "touch only");
  await page.goto("/");
  const bar = page.locator("[data-menu-bar]");
  const search = bar.getByRole("button", { name: "Search" });
  await hold(page, search);
  await expect(page.locator(".classic-help")).toContainText("Find anyone");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await search.tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  const credits = bar.getByRole("link", { name: "Credits" });
  await hold(page, credits);
  await expect(page.locator(".classic-help")).toContainText("Who made the games");
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/$/);
  await credits.tap();
  await expect(page).toHaveURL(/\/credits$/);
});

test("on a phone, choosing the next event keeps it where it was tapped @mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "touch only");
  await page.goto("/timeline");
  const buttons = page.locator(".tl-event-button");
  await buttons.nth(0).tap();
  await expect(page.locator(".tl-window")).toHaveCount(1);
  // A moment to read it, as anyone would, before going on.
  await page.waitForTimeout(1200);
  // The next event, below the first one's open window: closing that window would pull it up.
  const next = buttons.nth(1);
  await next.scrollIntoViewIfNeeded();
  const before = (await next.boundingBox())?.y ?? 0;
  await next.tap();
  await expect(next).toHaveAttribute("aria-pressed", "true");
  // Once the page has settled, it's where it was.
  await page.waitForTimeout(1200);
  const after = (await next.boundingBox())?.y ?? 0;
  expect(Math.abs(after - before)).toBeLessThan(2);
});

test("on a phone, choosing the next change on Compare keeps it where it was tapped @mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "touch only");
  await page.goto("/compare");
  const buttons = page.locator(".cmp-row-button");
  await buttons.nth(0).tap();
  await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "true");
  // A moment to read it, as anyone would, before going on.
  await page.waitForTimeout(1200);
  // The next change, below the first one's open window: closing that window would pull it up.
  const next = buttons.nth(1);
  await next.scrollIntoViewIfNeeded();
  const before = (await next.boundingBox())?.y ?? 0;
  await next.tap();
  await expect(next).toHaveAttribute("aria-pressed", "true");
  // Once the page has settled, it's where it was.
  await page.waitForTimeout(1200);
  const after = (await next.boundingBox())?.y ?? 0;
  expect(Math.abs(after - before)).toBeLessThan(2);
});

test("on a phone, a moment on Divergence opens in a sheet where you are @mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "touch only");
  await page.goto("/divergence/event/jenova-calamity");
  // Upright, one telling at a time.
  const trilogy = page.getByRole("button", { name: "The Remake Trilogy", exact: true });
  await trilogy.tap();
  await expect(trilogy).toHaveAttribute("aria-pressed", "true");
  const moment = page.locator(".dv-branch[data-following] .dv-moment").nth(2);
  await moment.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await moment.tap();
  const sheet = page.locator("[data-sheet]");
  await expect(sheet.getByRole("complementary", { name: "Event details" })).toBeVisible();
  // Its own Close lowers it, and the page hasn't moved.
  await sheet.getByRole("button", { name: "Close" }).tap();
  await expect(sheet).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test("on a phone, what's chosen in the Network opens in a sheet where you are @mobile", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "touch only");
  await page.goto("/network/character/cloud-strife");
  const chip = page.locator(".nw-panel .nw-chip").nth(1);
  const name = (await chip.textContent()) ?? "";
  await chip.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await chip.tap();
  const sheet = page.locator("[data-sheet]");
  await expect(sheet.getByRole("heading", { name })).toBeVisible();
  // Its links lead on to the next thing, in the same sheet.
  await sheet.locator(".nw-chip").first().tap();
  await expect(sheet.getByRole("heading", { name })).toHaveCount(0);
  await sheet.getByRole("button", { name: "Close" }).tap();
  await expect(sheet).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});
