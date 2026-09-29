import { expect, test } from "@playwright/test";

// On a phone, no page may scroll sideways (wide views scroll inside their own panels).

const PATHS = [
  "/",
  "/timeline",
  "/explore",
  "/character/cloud-strife",
  "/event/aerith-death",
  "/compare",
  "/compare/event/aerith-death",
  "/network",
  "/network/character/cloud-strife",
  "/divergence",
  "/divergence/event/aerith-death",
  "/archive",
  "/archive/og",
  "/archive/rebirth/chapter-14",
  "/archive/research",
];

for (const path of PATHS) {
  test(`${path} fits the screen @mobile`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    const excess = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(excess).toBeLessThanOrEqual(0);
  });
}
