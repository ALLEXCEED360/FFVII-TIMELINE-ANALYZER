import { expect, test } from "@playwright/test";

// The journey from blueprint §35: open the app, search for Cloud, open his page, open a related
// event, switch versions, compare, open the graph, follow a relationship, and return to the
// timeline — all with the keyboard and mouse a visitor would use.

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

  // 5–6. Compare the titles, then switch versions to the original against Rebirth.
  await page.getByRole("link", { name: "Compare titles" }).click();
  await expect(page).toHaveURL(/\/compare\/event\/aerith-death/);
  await page.getByRole("button", { name: "OG vs Rebirth" }).click();
  await expect(page).toHaveURL(/titles=og%2Crebirth/);
  await expect(page.getByRole("heading", { level: 2, name: "OG" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Rebirth" })).toBeVisible();
  await expect(page.getByRole("region", { name: /Documented differences/ })).toContainText("Major");

  // 7. Open the graph around the event.
  await page.getByRole("link", { name: "Entity page" }).click();
  await page.getByRole("main").getByRole("link", { name: "Network", exact: true }).click();
  await expect(page).toHaveURL(/\/network\/event\/aerith-death/);
  const list = page.getByRole("list", { name: "Entities and their connections" });
  await expect(list).toBeVisible();

  // 8. Follow a relationship: select Sephiroth and open his page.
  await list.getByRole("button", { name: "Sephiroth", exact: true }).click();
  await expect(page).toHaveURL(/node=character_sephiroth/);
  await page
    .getByRole("complementary", { name: "Selection" })
    .getByRole("link", { name: "Open page" })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Sephiroth" })).toBeVisible();

  // 9. Return to the timeline, on an event he takes part in.
  await page
    .getByRole("region", { name: /Connections/ })
    .getByRole("link", { name: "Nibelheim Incident" })
    .first()
    .click();
  await page.getByRole("link", { name: "Show on timeline" }).click();
  await expect(page).toHaveURL(/\/timeline\?event=event_nibelheim_incident/);
  await expect(page.getByRole("complementary", { name: "Event details" })).toContainText(
    "Nibelheim Incident",
  );
});
