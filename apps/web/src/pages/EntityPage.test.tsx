import { screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { renderAt, stubApi } from "../test/render";

describe("entity page", () => {
  it("shows every appearance, including other worlds", async () => {
    stubApi();
    renderAt("/character/cloud-strife");
    expect(await screen.findByRole("heading", { level: 1, name: "Cloud Strife" })).toBeTruthy();
    const titles = screen.getByRole("region", { name: "In each title" });
    expect(
      within(titles)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(["OG", "Remake", "Remake", "INTERmission", "Rebirth", "Rebirth"]);
    expect(within(titles).getAllByText("Zack survives")).toHaveLength(2);
  });

  it("groups connections by kind and links to their pages", async () => {
    stubApi();
    renderAt("/character/cloud-strife");
    const connections = await screen.findByRole("region", { name: "Connections" });
    const events = within(connections).getByRole("heading", { name: "Events" }).parentElement!;
    const nibelheim = within(events).getByRole("link", {
      name: "Nibelheim Incident",
    });
    expect(nibelheim.getAttribute("href")).toBe("/event/nibelheim-incident");
    // Rebirth leaves Cloud's presence at Nibelheim open.
    expect(within(events).getByText("Uncertain")).toBeTruthy();
  });

  it("shows not found for unknown entities and impossible paths", async () => {
    stubApi();
    renderAt("/character/nobody-at-all");
    expect(await screen.findByRole("heading", { name: "No record found" })).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
