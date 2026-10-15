import { screen, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

async function noViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

describe("archive", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("offers each game to go through, how the facts were checked, and what's to come", async () => {
    stubApi();
    renderAt("/archive");
    const titles = await screen.findByRole("region", { name: "Pick a game" });
    const cards = await within(titles).findAllByRole("heading", { level: 3 });
    expect(cards.map((h) => h.textContent)).toEqual([
      "Final Fantasy VII",
      "Final Fantasy VII Remake",
      "Final Fantasy VII Remake Intergrade — Episode INTERmission",
      "Final Fantasy VII Rebirth",
    ]);
    expect(within(cards[0]!).getByRole("link").getAttribute("href")).toBe("/archive/og");
    expect(within(titles).getByText(/39 parts on 3 discs/)).toBeTruthy();
    expect(
      within(titles).getByText("Retells the original from Mako Reactor 1 to The Shinra Building."),
    ).toBeTruthy();
    expect(screen.getByText("Final Fantasy VII Revelation")).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/archive");
    await screen.findByRole("region", { name: "Pick a game" });
    await screen.findAllByRole("heading", { level: 3 });
    await noViolations(container);
  });
});

describe("a title's units", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the original's parts by disc, with arcs, retellings and how much each shows", async () => {
    stubApi();
    renderAt("/archive/og");
    const disc1 = await screen.findByRole("region", { name: "Disc 1" });
    const capital = within(disc1).getByRole("link", { name: "The Forgotten Capital" });
    expect(capital.getAttribute("href")).toBe("/archive/og/forgotten-capital");
    const row = capital.closest("li")!;
    expect(row.textContent).toContain("Retold in Rebirth");
    expect(row.textContent).toMatch(/Shows \d+ people and things/);
    expect(screen.getByRole("region", { name: "Disc 3" })).toBeTruthy();
  });

  it("lists chapters and parts in play order", async () => {
    stubApi();
    renderAt("/archive/rebirth");
    const list = await screen.findByRole("region", { name: "Chapters" });
    const links = within(list).getAllByRole("link");
    expect(links.slice(0, 2).map((l) => l.textContent)).toEqual([
      "Interlude: A World Apart",
      "Chapter 1 · Fall of a Hero",
    ]);
    expect(links[1]?.getAttribute("href")).toBe("/archive/rebirth/chapter-1");
  });

  it("shows not found for an unknown title", async () => {
    stubApi();
    renderAt("/archive/crisis-core");
    expect(await screen.findByRole("heading", { name: "No record found" })).toBeTruthy();
  });
});

describe("a unit as a source", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists what the unit shows, differences, relationships, worlds and open questions", async () => {
    stubApi();
    renderAt("/archive/rebirth/chapter-14");
    expect(await screen.findByRole("heading", { level: 1, name: "End of the World" })).toBeTruthy();
    expect(screen.getByText("Rebirth · Chapter 14")).toBeTruthy();

    const shown = screen.getByRole("region", { name: /^Who and what it shows/ });
    const characters = within(shown).getByRole("region", { name: "People" });
    expect(
      within(characters)
        .getAllByRole("link")
        .map((l) => l.textContent),
    ).toEqual([
      "Aerith Gainsborough",
      "Cid Highwind",
      "Cloud Strife",
      "Sephiroth",
      "Tifa Lockhart",
      "Vincent Valentine",
    ]);
    expect(within(shown).getByRole("link", { name: "Death of Aerith" }).getAttribute("href")).toBe(
      "/event/aerith-death",
    );

    const relationships = screen.getByRole("region", { name: /^Links it shows/ });
    expect(relationships.textContent).toContain("Sephiroth killed Aerith Gainsborough.");
    expect(
      screen.getByRole("region", { name: "Other worlds glimpsed here" }).textContent,
    ).toContain("Zack survives");

    const neighbours = screen.getByRole("navigation", { name: "Other chapters" });
    expect(
      within(neighbours)
        .getAllByRole("link")
        .map((l) => l.getAttribute("href")),
    ).toEqual(["/archive/rebirth/chapter-13"]);
  });

  it("gives an original segment its summary, arc and retellings", async () => {
    stubApi();
    renderAt("/archive/og/forgotten-capital");
    expect(
      await screen.findByRole("heading", { level: 1, name: "The Forgotten Capital" }),
    ).toBeTruthy();
    expect(screen.getByText("The city of the Cetra, where the first disc ends.")).toBeTruthy();
    expect(screen.getByText(/Retold in/).textContent).toBe("Retold in Rebirth");
    expect(screen.getByText("OG · Disc 1")).toBeTruthy();
  });

  it("says what each person did, and marks what only some playthroughs show", async () => {
    stubApi();
    renderAt("/archive/og/northern-cave");
    const links = await screen.findByRole("region", { name: /^Links it shows/ });
    const line = (name: string) =>
      within(links).getAllByRole("link", { name }).at(0)!.closest("li")!.textContent;
    expect(line("Yuffie")).toContain("goes down with the party");
    expect(line("Yuffie")).toContain("Optional");
    expect(line("Vincent Valentine")).toContain("Optional");
    expect(line("Cloud Strife")).toContain("goes ahead to Sephiroth");
    expect(line("Cloud Strife")).not.toContain("Optional");
  });

  it("shows not found for a unit that doesn't exist", async () => {
    stubApi();
    renderAt("/archive/og/nowhere");
    expect(await screen.findByRole("heading", { name: "No record found" })).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/archive/rebirth/chapter-14");
    await screen.findByRole("region", { name: /^Links it shows/ });
    await noViolations(container);
  });
});

describe("citations elsewhere", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("link to their unit", async () => {
    stubApi();
    renderAt("/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    const citation = screen.getAllByRole("link", { name: "Rebirth · Ch. 14" })[0];
    expect(citation?.getAttribute("href")).toBe("/archive/rebirth/chapter-14");
  });
});
