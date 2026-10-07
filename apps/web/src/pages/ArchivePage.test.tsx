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
    expect(
      screen.getByRole("link", { name: "See how each fact was checked" }).getAttribute("href"),
    ).toBe("/archive/research");
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
    ).toEqual(["Aerith Gainsborough", "Cloud Strife", "Sephiroth", "Tifa Lockhart"]);
    expect(within(shown).getByRole("link", { name: "Death of Aerith" }).getAttribute("href")).toBe(
      "/event/aerith-death",
    );

    const relationships = screen.getByRole("region", { name: /^Links it shows/ });
    expect(relationships.textContent).toContain("Sephiroth killed Aerith Gainsborough.");
    expect(
      screen.getByRole("region", { name: "Other worlds glimpsed here" }).textContent,
    ).toContain("Zack survives");
    const questions = await screen.findByRole("region", { name: "Still being checked here" });
    expect(questions.textContent).toContain("How Rebirth shows Aerith's death (chapter 14)");

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

  it("shows not found for a unit that doesn't exist", async () => {
    stubApi();
    renderAt("/archive/og/nowhere");
    expect(await screen.findByRole("heading", { name: "No record found" })).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/archive/rebirth/chapter-14");
    await screen.findByRole("region", { name: "Still being checked here" });
    await noViolations(container);
  });
});

describe("research log", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("separates what facts were checked against from what only found them, and lists what's open", async () => {
    stubApi();
    renderAt("/archive/research");
    const evidence = await screen.findByRole("region", { name: /^Checked against 3/ });
    const transcript = within(evidence).getByRole("link", {
      name: /Final Fantasy VII Rebirth script/,
    });
    expect(transcript.getAttribute("target")).toBe("_blank");
    expect(transcript.getAttribute("rel")).toBe("noreferrer");
    expect(evidence.textContent).toContain("Incomplete when accessed");
    expect(screen.getByRole("region", { name: /^Used only to find things/ })).toBeTruthy();

    const questions = screen.getByRole("region", { name: /^Still being checked/ });
    expect(
      within(questions)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([
      "To check against video of the game",
      "Not in the archive yet",
      "How the games are divided",
    ]);

    const interpretations = screen.getByRole("region", {
      name: /^What the games don't say outright/,
    });
    expect(within(interpretations).getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(
      within(interpretations)
        .getAllByRole("link", { name: /Rebirth · Ch\. 14/ })[0]
        ?.getAttribute("href"),
    ).toBe("/archive/rebirth/chapter-14");
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/archive/research");
    await screen.findByRole("region", { name: /^Checked against \d/ });
    await noViolations(container);
  });
});

describe("citations elsewhere", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("link to their unit, and entity pages show their open questions", async () => {
    stubApi();
    renderAt("/event/aerith-death");
    await screen.findByRole("heading", { level: 1, name: "Death of Aerith" });
    const citation = screen.getAllByRole("link", { name: "Rebirth · Ch. 14" })[0];
    expect(citation?.getAttribute("href")).toBe("/archive/rebirth/chapter-14");
    const questions = screen.getByRole("region", { name: "Still being checked" });
    expect(
      within(questions)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([
      "How Rebirth shows Aerith's death (chapter 14)",
      "Aerith's funeral in the original (opening of disc 2)",
    ]);
  });
});
