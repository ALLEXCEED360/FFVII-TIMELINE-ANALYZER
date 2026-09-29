import { expect, test } from "@playwright/test";

// What happens when things go wrong, and what the browser downloads (blueprint §34: don't load
// the whole universe on every page).

test("an unreachable API shows an error with a retry, and recovers", async ({ page }) => {
  await page.route("**/timeline?**", (route) => route.abort());
  await page.goto("/timeline");
  const alert = page.getByRole("alert");
  // TanStack Query retries a few times first, as the API may be waking up.
  await expect(alert).toContainText("Couldn't reach the Timeline Analyzer API", {
    timeout: 20_000,
  });

  await page.unroute("**/timeline?**");
  await alert.getByRole("button", { name: /Retry|Try again/ }).click();
  await expect(page.getByRole("group", { name: /Timeline chart/ })).toBeVisible();
});

test("a page whose code fails to download offers a reload, inside the site", async ({ page }) => {
  await page.goto("/");
  await page.route("**/assets/ExplorePage-*.js", (route) => route.abort());
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Explore" })
    .click();
  const alert = page.getByRole("alert");
  await expect(alert.getByRole("heading", { name: "This page couldn't be loaded" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();

  await page.unroute("**/assets/ExplorePage-*.js");
  await alert.getByRole("button", { name: "Reload" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Explore" })).toBeVisible();
});

test("the graph library loads only on network pages", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });
  const graphLibrary = () => scripts.some((url) => url.includes("cytoscape"));

  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Timeline" })
    .click();
  await expect(page.getByRole("group", { name: /Timeline chart/ })).toBeVisible();
  await page.goto("/character/cloud-strife");
  await expect(page.getByRole("heading", { level: 1, name: "Cloud Strife" })).toBeVisible();
  expect(graphLibrary()).toBe(false);

  await page.getByRole("main").getByRole("link", { name: "Network", exact: true }).click();
  await expect(page.getByRole("list", { name: "Entities and their connections" })).toBeVisible();
  await expect.poll(graphLibrary).toBe(true);
});

test("hovering a section in the navigation starts loading its page", async ({ page }) => {
  await page.goto("/");
  const loaded = page.waitForRequest(/\/assets\/ArchivePage-.*\.js$/);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Archive" })
    .hover();
  await loaded;
});

test("the home page loads no other page's code", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(new URL(request.url()).pathname);
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One story.");
  await page.waitForLoadState("networkidle");
  expect(scripts.filter((path) => path.includes("Page-"))).toEqual([]);
});
