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
  const marker = page.getByRole("button", { name: /Nibelheim Incident/ }).first();
  await marker.focus();
  await expect(marker).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/event=event_nibelheim_incident/);
  await expect(page.getByRole("complementary", { name: "Inspector" })).toContainText(
    "Nibelheim Incident",
  );
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

test("divergence stations can be chosen with the keyboard", async ({ page }) => {
  await page.goto("/divergence/event/aerith-death");
  const station = page
    .getByRole("group", { name: /Divergence map/ })
    .getByRole("button", { name: /^Death of Aerith — OG/ });
  // Reach it by keyboard (Shift+Tab, Tab), so it matches :focus-visible.
  await station.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(station).toBeFocused();
  // SVG stations draw their own focus ring.
  await expect(station.locator(".focus-ring")).not.toHaveCSS("stroke", "none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/node=event_aerith_death/);
});

/** Click the option's label, as a visitor would (the radio itself is visually hidden). */
async function chooseMotion(page: import("@playwright/test").Page, option: string) {
  await page
    .locator("footer label")
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
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "system");
    expect(Number.parseFloat(await navTransition(page))).toBeLessThan(0.01);
  });

  test("can be chosen in the footer, and is remembered", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    expect(Number.parseFloat(await navTransition(page))).toBeGreaterThan(0.1);

    await chooseMotion(page, "Reduced");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
    expect(Number.parseFloat(await navTransition(page))).toBeLessThan(0.01);

    await page.reload();
    await expect(page.getByRole("radio", { name: "Reduced" })).toBeChecked();
    expect(Number.parseFloat(await navTransition(page))).toBeLessThan(0.01);
  });

  test("full motion overrides the system setting", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await chooseMotion(page, "Full");
    expect(Number.parseFloat(await navTransition(page))).toBeGreaterThan(0.1);
  });
});

test("keyboard focus is always visible", async ({ page }) => {
  await page.goto("/archive");
  await expect(page.getByRole("heading", { level: 1, name: "Archive" })).toBeVisible();
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
