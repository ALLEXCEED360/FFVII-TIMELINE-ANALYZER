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

  it("presents each title as a source, with the research log and what's to come", async () => {
    stubApi();
    renderAt("/archive");
    const titles = await screen.findByRole("region", { name: "The titles as sources" });
    const cards = await within(titles).findAllByRole("heading", { level: 3 });
    expect(cards.map((h) => h.textContent)).toEqual([
      "Final Fantasy VII",
      "Final Fantasy VII Remake",
      "Final Fantasy VII Remake Intergrade — Episode INTERmission",
      "Final Fantasy VII Rebirth",
    ]);
    expect(within(cards[0]!).getByRole("link").getAttribute("href")).toBe("/archive/og");
    expect(within(titles).getByText(/39 story segments on 3 discs/)).toBeTruthy();
    expect(
      within(titles).getByText("Retells the original from Mako Reactor 1 to The Shinra Building."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open the research log" }).getAttribute("href")).toBe(
      "/archive/research",
    );
    expect(screen.getByText("Final Fantasy VII Revelation")).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/archive");
    await screen.findByRole("region", { name: "The titles as sources" });
    await screen.findAllByRole("heading", { level: 3 });
    await noViolations(container);
  });
});

describe("a title's units", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists the original's segments by disc, with arcs, retellings and citation counts", async () => {
    stubApi();
    renderAt("/archive/og");
    const disc1 = await screen.findByRole("region", { name: "Disc 1" });
    const capital = within(disc1).getByRole("link", { name: "The Forgotten Capital" });
    expect(capital.getAttribute("href")).toBe("/archive/og/forgotten-capital");
    const row = capital.closest("li")!;
    expect(row.textContent).toContain("Retold in Rebirth");
    expect(row.textContent).toMatch(/\d+ citations/);
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

    const shown = screen.getByRole("region", { name: /^Shown here/ });
    const characters = within(shown).getByRole("region", { name: "Characters" });
    expect(
      within(characters)
        .getAllByRole("link")
        .map((l) => l.textContent),
    ).toEqual(["Aerith Gainsborough", "Cloud Strife", "Sephiroth", "Tifa Lockhart"]);
    expect(within(shown).getByRole("link", { name: "Death of Aerith" }).getAttribute("href")).toBe(
      "/event/aerith-death",
    );

    const relationships = screen.getByRole("region", { name: /^Relationships shown here/ });
    expect(relationships.textContent).toContain("SephirothkilledAerith Gainsborough");
    expect(screen.getByRole("region", { name: "Worlds shown here" }).textContent).toContain(
      "Zack survives",
    );
    const questions = await screen.findByRole("region", { name: "Open questions here" });
    expect(questions.textContent).toContain("How Rebirth shows Aerith's death (chapter 14)");

    const neighbours = screen.getByRole("navigation", { name: "Neighbouring units" });
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
    await screen.findByRole("region", { name: "Open questions here" });
    await noViolations(container);
  });
});

describe("research log", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("separates evidence from locating sources, and lists open questions and interpretations", async () => {
    stubApi();
    renderAt("/archive/research");
    const evidence = await screen.findByRole("region", { name: /^Evidence 3/ });
    const transcript = within(evidence).getByRole("link", {
      name: /Final Fantasy VII Rebirth script/,
    });
    expect(transcript.getAttribute("target")).toBe("_blank");
    expect(transcript.getAttribute("rel")).toBe("noreferrer");
    expect(evidence.textContent).toContain("Incomplete when accessed");
    expect(screen.getByRole("region", { name: /^Used only to locate/ })).toBeTruthy();

    const questions = screen.getByRole("region", { name: /^Open questions/ });
    expect(
      within(questions)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(["Needs checking against footage", "Not yet in the dataset", "Structure"]);

    const interpretations = screen.getByRole("region", { name: /^Inferred and left open/ });
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
    await screen.findByRole("region", { name: /^Evidence \d/ });
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
