import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import differences from "../test/differences.json";
import { renderAt, stubApi } from "../test/render";

describe("compare page", () => {
  it("lists every change, grouped by what it belongs to, with a way to see each side by side", async () => {
    stubApi();
    renderAt("/compare");
    const list = await screen.findByRole("region", { name: "Changes" });
    await within(list).findByRole("heading", { level: 2, name: "Nibelheim Incident" });
    expect(within(list).getAllByText(/^Where to see it:/)).toHaveLength(differences.items.length);
    const links = within(list).getAllByRole("link", { name: /See it side by side/ });
    expect(links[0]?.getAttribute("href")).toBe("/compare/event/nibelheim-incident");
  });

  it("filters by kind of change in plain words, saying how many each holds", async () => {
    stubApi();
    const { router } = renderAt("/compare");
    const list = await screen.findByRole("region", { name: "Changes" });
    await within(list).findByRole("heading", { level: 2, name: "Nibelheim Incident" });
    const kinds = screen.getByRole("group", { name: "What changes" });
    const everything = within(kinds).getByRole("button", { name: /^Everything/ });
    expect(everything.textContent).toContain(String(differences.items.length));

    const shown = differences.items.filter((d) => d.category === "presentation").length;
    const presentation = within(kinds).getByRole("button", { name: /^How it's shown/ });
    expect(presentation.textContent).toContain(String(shown));
    await userEvent.click(presentation);
    expect(router.state.location.search).toBe("?category=presentation");
    expect(within(list).getAllByText(/^Where to see it:/)).toHaveLength(shown);
  });

  it("asks the API for the chosen games and for big changes only", async () => {
    const requests = stubApi();
    renderAt("/compare");
    await screen.findByRole("region", { name: "Changes" });
    await userEvent.click(screen.getByRole("button", { name: "OG vs Remake" }));
    await userEvent.click(screen.getByRole("button", { name: "Big changes only" }));
    await waitFor(() => {
      const last = requests.filter((u) => u.pathname === "/differences").at(-1);
      expect(Object.fromEntries(last?.searchParams ?? [])).toEqual({
        titles: "og,remake",
        magnitude: "major",
      });
    });
  });

  it("finds anything to compare by name, keeping the chosen games", async () => {
    stubApi();
    const { router } = renderAt("/compare?titles=og,rebirth");
    const picker = await screen.findByRole("region", { name: "Compare anything side by side" });
    await userEvent.type(within(picker).getByRole("searchbox"), "aerith");
    const result = await within(picker).findByRole("link", { name: /Death of Aerith/ });
    // A search looks across every kind, not just the chosen tab.
    expect(within(picker).getByRole("link", { name: /Aerith Gainsborough/ })).toBeTruthy();
    await userEvent.click(result);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/compare/event/aerith-death");
    });
    expect(router.state.location.search).toBe("?titles=og,rebirth");
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/compare");
    const list = await screen.findByRole("region", { name: "Changes" });
    await within(list).findByRole("heading", { level: 2, name: "Nibelheim Incident" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
