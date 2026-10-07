import { screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { renderAt, stubApi } from "../test/render";

describe("entity page", () => {
  it("shows each game in plain words, with other worlds inside it", async () => {
    stubApi();
    renderAt("/character/cloud-strife");
    expect(await screen.findByRole("heading", { level: 1, name: "Cloud Strife" })).toBeTruthy();
    const games = screen.getByRole("list", { name: "In the games" });
    expect(
      within(games)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["OGAppears", "RemakeAppears", "INTERmissionAppears", "RebirthAppears"]);
    const titles = screen.getByRole("region", { name: "In each game" });
    expect(
      within(titles)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(["OG", "Remake", "INTERmission", "Rebirth"]);
    expect(within(titles).getAllByText(/In another world: Zack survives/)).toHaveLength(2);
  });

  it("groups connections by kind and links to their pages", async () => {
    stubApi();
    renderAt("/character/cloud-strife");
    const connections = await screen.findByRole("region", { name: "Connections" });
    const moments = within(connections).getByRole("region", { name: "Moments" });
    expect(within(moments).getByText("Took part in")).toBeTruthy();
    const nibelheim = within(moments).getByRole("link", { name: "Nibelheim Incident" });
    expect(nibelheim.getAttribute("href")).toBe("/event/nibelheim-incident");
    // Rebirth leaves Cloud's presence at Nibelheim open.
    expect(within(moments).getByText("Left open")).toBeTruthy();
    const places = within(connections).getByRole("region", { name: "Places" });
    expect(within(places).getByText("Comes from")).toBeTruthy();
  });

  it("shows not found for unknown entities and impossible paths", async () => {
    stubApi();
    renderAt("/character/nobody-at-all");
    expect(await screen.findByRole("heading", { name: "No record found" })).toBeTruthy();
  });

  it("tells a moment's place in the story, and what comes just before and after", async () => {
    stubApi();
    renderAt("/event/aerith-death");
    expect(await screen.findByText(/During the story · The Promised Land/)).toBeTruthy();
    expect(screen.getByText("★ Key moment")).toBeTruthy();
    const around = await screen.findByRole("navigation", { name: "Before and after" });
    expect(within(around).getAllByRole("link")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "See where the stories split" }).getAttribute("href"),
    ).toBe("/divergence/event/aerith-death");
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
