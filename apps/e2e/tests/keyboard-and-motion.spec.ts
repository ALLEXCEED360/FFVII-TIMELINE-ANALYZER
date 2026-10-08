import { expect, test } from "@playwright/test";

// Keyboard use and the reduced-motion option (blueprint §33).

test("the skip link jumps past the navigation", async ({ page }) => {
  await page.goto("/timeline");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  // The next stop is inside the page, not the header.
  expect(await page.evaluate(() => document.activeElement?.closest("main") !== null)).toBe(true);
});

test("timeline events can be chosen with the keyboard", async ({ page }) => {
  await page.goto("/timeline");
  const event = page.getByRole("button", { name: /^Nibelheim Incident/ });
  await event.focus();
  await expect(event).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/event=event_nibelheim_incident/);
  const details = page.getByRole("complementary", { name: "Event details" });
  await expect(details).toContainText("Nibelheim Incident");
  await details.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(/\/timeline$/);
});

test("the search palette works from the keyboard alone", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await page.keyboard.type("seto");
  const option = page.getByRole("option", { name: /The Truth About Seto/ }).first();
  await expect(option).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/event\/truth-about-seto$/);
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search the archive" })).toHaveCount(0);
});

test("divergence moments can be chosen with the keyboard", async ({ page }) => {
  await page.goto("/divergence/event/aerith-death");
  const moment = page
    .getByRole("region", { name: "Death of Aerith" })
    .getByRole("button", { name: /See the details of this moment/ });
  // Reach it by keyboard (Shift+Tab, Tab), so it matches :focus-visible.
  await moment.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(moment).toBeFocused();
  await expect(moment).not.toHaveCSS("outline-style", "none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/node=event_aerith_death/);
  await expect(page.getByRole("complementary", { name: "Event details" })).toContainText(
    "How each game tells it",
  );
});

/** Choose a Motion option in Settings, clicking its label as a visitor would (the radio is hidden). */
async function chooseMotion(page: import("@playwright/test").Page, option: string) {
  await page.goto("/settings");
  await page
    .getByRole("group", { name: "Motion" })
    .locator("label")
    .filter({ hasText: new RegExp(`^${option}$`) })
    .click();
  await expect(page.getByRole("radio", { name: option })).toBeChecked();
}

test.describe("reduced motion", () => {
  const navTransition = (page: import("@playwright/test").Page) =>
    page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Timeline" })
      .evaluate((el) => getComputedStyle(el).transitionDuration);

  test("follows the system setting by default", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/timeline");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "system");
    expect(Number.parseFloat(await navTransition(page))).toBeLessThan(0.01);
  });

  test("can be chosen in Settings, and is remembered", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/timeline");
    expect(Number.parseFloat(await navTransition(page))).toBeGreaterThan(0.1);

    await chooseMotion(page, "Less movement");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
    expect(Number.parseFloat(await navTransition(page))).toBeLessThan(0.01);

    await page.reload();
    await expect(page.getByRole("radio", { name: "Less movement" })).toBeChecked();
    expect(Number.parseFloat(await navTransition(page))).toBeLessThan(0.01);
  });

  test("full motion overrides the system setting", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await chooseMotion(page, "Full movement");
    expect(Number.parseFloat(await navTransition(page))).toBeGreaterThan(0.1);
  });
});

test("keyboard focus is always visible", async ({ page }) => {
  await page.goto("/archive");
  await expect(
    page.getByRole("heading", { level: 1, name: "The games, chapter by chapter" }),
  ).toBeVisible();
  // Walk the first stops of the page and check each shows a focus outline.
  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return "none";
      const style = getComputedStyle(el);
      return style.outlineStyle === "none" || style.outlineWidth === "0px"
        ? `${el.tagName} ${el.textContent.trim().slice(0, 30)}`
        : "ok";
    });
    expect(outline).toBe("ok");
  }
});

test("a link to an event on the timeline goes straight to it", async ({ page }) => {
  await page.goto("/timeline?event=event_defeat_of_sephiroth");
  await expect(page.getByRole("complementary", { name: "Event details" })).toContainText(
    "Defeat of Sephiroth",
  );
  await expect(page.getByRole("button", { name: /^Defeat of Sephiroth/ })).toBeInViewport();
});

test("moving between sections plays the wipe, but not under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("link", { name: "Timeline" })
    .click();
  await expect(page.locator(".wipe")).toContainText("Timeline");
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.locator(".wipe")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Archive" })
    .click();
  await expect(page).toHaveURL(/\/archive$/);
  await expect(page.locator(".wipe")).toHaveCount(0);
});

test("only pages other than the home menu show the site navigation; none has a footer", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Sections" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  await page.goto("/timeline");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});

test("the home menu is driven with the arrow keys", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "Sections" });
  await menu.getByRole("link", { name: /^Timeline/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("link", { name: /^Compare/ })).toBeFocused();
  await page.keyboard.press("End");
  await expect(menu.getByRole("link", { name: /^Config/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("link", { name: /^Timeline/ })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await expect(menu.getByRole("link", { name: /^Archive/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/archive$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "The games, chapter by chapter" }),
  ).toBeVisible();
});

test("W A S D move the glove anywhere on the home menu, and left and right cross to the games", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "Sections" });
  const games = page.getByRole("list", { name: "The four tellings" });
  // The games arrive with the API's reference data; wait for them before crossing to them.
  await expect(games.getByRole("link")).toHaveCount(4);
  // Nothing focused yet: the keys still work.
  await page.keyboard.press("s");
  await expect(menu.getByRole("link", { name: /^Compare/ })).toBeFocused();
  await page.keyboard.press("w");
  await expect(menu.getByRole("link", { name: /^Timeline/ })).toBeFocused();

  // Left to the games: the first is chosen, and its cover stands out.
  await page.keyboard.press("a");
  const og = games.getByRole("link").first();
  await expect(og).toBeFocused();
  await expect(og).toHaveAttribute("data-selected", "");
  await page.keyboard.press("ArrowDown");
  await expect(games.getByRole("link").nth(1)).toBeFocused();
  await expect(og).not.toHaveAttribute("data-selected", "");

  // Right, back to the command the glove left.
  await page.keyboard.press("d");
  await expect(menu.getByRole("link", { name: /^Timeline/ })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(games.getByRole("link").nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/archive\/remake$/);
});

/** The gloves showing on the home menu, by the text of what each points at. */
async function gloves(page: import("@playwright/test").Page) {
  return page
    .locator(".ff7-hand")
    .evaluateAll((hands) =>
      hands
        .filter((hand) => getComputedStyle(hand).visibility === "visible")
        .map((hand) => (hand.parentElement?.textContent ?? "").replace("☞", "").trim().slice(0, 8)),
    );
}

test("the keys and the mouse move one glove on the home menu", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "Sections" });
  const games = page.getByRole("list", { name: "The four tellings" });
  await expect(games.getByRole("link")).toHaveCount(4);
  // Quick presses each count.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("link", { name: /^Network/ })).toBeFocused();
  expect(await gloves(page)).toEqual(["Network"]);

  // Pointing takes the same glove, and the keys carry on from there.
  await menu.getByRole("link", { name: /^Timeline/ }).hover();
  expect(await gloves(page)).toEqual(["Timeline"]);
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("link", { name: /^Compare/ })).toBeFocused();
  expect(await gloves(page)).toEqual(["Compare"]);

  // Into the games, and up to the bar: still one.
  await games.getByRole("link").nth(2).hover();
  expect(await gloves(page)).toEqual(["INTERmis"]);
  await page
    .getByRole("banner")
    .getByRole("link", { name: /Credits/ })
    .hover();
  expect(await gloves(page)).toEqual(["Credits"]);
});

test("up from the top of the home menu reaches Search and Credits in the bar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("list", { name: "The four tellings" }).getByRole("link")).toHaveCount(
    4,
  );
  const menu = page.getByRole("navigation", { name: "Sections" });
  const bar = page.getByRole("banner");
  await page.keyboard.press("ArrowUp");
  await expect(bar.getByRole("button", { name: "Search" })).toBeFocused();
  await page.keyboard.press("d");
  await expect(bar.getByRole("link", { name: /Credits/ })).toBeFocused();
  // Down goes back to where the glove came from.
  await page.keyboard.press("s");
  await expect(menu.getByRole("link", { name: /^Timeline/ })).toBeFocused();

  // From the games too, and Enter opens Search.
  await page.keyboard.press("a");
  await page.keyboard.press("w");
  await page.keyboard.press("ArrowLeft");
  await expect(bar.getByRole("button", { name: "Search" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Search the archive" })).toBeVisible();
  // Typing in the search box types; it doesn't move the glove.
  await page.keyboard.type("wasd");
  await expect(page.getByRole("combobox")).toHaveValue("wasd");
});

test.describe("title screen", () => {
  // A first visit: nothing saved, so the title screen plays.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("plays on the first visit, waits for a key, then not again this session", async ({
    page,
  }) => {
    await page.goto("/");
    const title = page.getByRole("dialog", { name: /Timeline\s*Analyzer/ });
    await expect(title).toBeVisible();
    await expect(title).toContainText("Archive online");
    await expect(
      page.getByRole("button", { name: /Press any button|Tap the screen/ }),
    ).toBeFocused();
    await page.waitForTimeout(800);
    await page.keyboard.press("Enter");
    await expect(title).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One story.");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One story.");
    await expect(title).toHaveCount(0);
  });

  test("steps aside by itself on a shared link @mobile", async ({ page }) => {
    await page.goto("/character/cloud-strife");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Cloud Strife" })).toBeVisible();
  });
});

test("the Back button follows you down a long page", async ({ page }) => {
  await page.goto("/divergence");
  await page
    .getByRole("region", { name: "The big turning points" })
    .getByRole("link")
    .first()
    .click();
  await expect(page).toHaveURL(/\/divergence\/event\//);
  const backs = page.getByRole("button", { name: "Back" });
  await expect(backs).toHaveCount(1);
  // Scrolled past the one at the top, the same button floats in the corner.
  await page.mouse.wheel(0, 3000);
  await expect(backs).toHaveCount(2);
  await expect(page.locator(".m-back-float")).toBeInViewport();
  await page.locator(".m-back-float").click();
  await expect(page).toHaveURL(/\/divergence$/);
});
