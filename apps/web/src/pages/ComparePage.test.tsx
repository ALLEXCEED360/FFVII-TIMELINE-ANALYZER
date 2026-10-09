import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import differences from "../test/differences.json";
import { renderAt, stubApi } from "../test/render";

/** How many different things the changes belong to. */
const things = (items: readonly { entity: { id: string } }[]) =>
  new Set(items.map((d) => d.entity.id)).size;

describe("compare page", () => {
  it("lists each thing that changes, and opens its changes in a window", async () => {
    stubApi();
    const { router } = renderAt("/compare");
    const list = await screen.findByRole("region", { name: "Changes" });
    await within(list).findByRole("button", { name: "Nibelheim Incident" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(things(differences.items));
    expect(screen.getByText("Choose anything")).toBeTruthy();

    await userEvent.click(within(list).getByRole("button", { name: "Nibelheim Incident" }));
    expect(router.state.location.search).toBe("?open=event_nibelheim_incident");
    const window = screen.getByRole("complementary", { name: "What changes" });
    expect(
      within(window).getByRole("heading", { level: 2, name: "Nibelheim Incident" }),
    ).toBeTruthy();
    expect(window.textContent).toContain("The original→");
    expect(within(window).getAllByText(/^Where to see it:/)).toHaveLength(
      differences.items.filter((d) => d.entity.id === "event_nibelheim_incident").length,
    );
    const link = within(window).getByRole("link", { name: "See it side by side" });
    expect(link.getAttribute("href")).toBe("/compare/event/nibelheim-incident");

    await userEvent.click(within(window).getByRole("button", { name: "Close" }));
    expect(router.state.location.search).toBe("");
  });

  it("filters by kind of change in plain words, saying how many each holds", async () => {
    stubApi();
    const { router } = renderAt("/compare");
    const list = await screen.findByRole("region", { name: "Changes" });
    await within(list).findByRole("button", { name: "Nibelheim Incident" });
    const kinds = screen.getByRole("group", { name: "What changes" });
    const everything = within(kinds).getByRole("button", { name: /^Everything/ });
    expect(everything.textContent).toContain(String(differences.items.length));

    const presented = differences.items.filter((d) => d.category === "presentation");
    const shown = presented.length;
    const presentation = within(kinds).getByRole("button", { name: /^How it's shown/ });
    expect(presentation.textContent).toContain(String(shown));
    await userEvent.click(presentation);
    expect(router.state.location.search).toBe("?category=presentation");
    expect(within(list).getAllByRole("listitem")).toHaveLength(things(presented));
  });

  it("always compares the original with the whole Remake Trilogy, and can keep to big changes", async () => {
    const requests = stubApi();
    renderAt("/compare");
    await screen.findByRole("region", { name: "Changes" });
    expect(screen.queryByRole("group", { name: "Pairs" })).toBeNull();
    expect(await screen.findByText(/changes from the original to the Remake Trilogy/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Big changes only" }));
    await waitFor(() => {
      const last = requests.filter((u) => u.pathname === "/differences").at(-1);
      expect(Object.fromEntries(last?.searchParams ?? [])).toEqual({
        titles: "og,remake,intermission,rebirth",
        magnitude: "major",
      });
    });
  });

  it("finds anything both tellings have, by name", async () => {
    stubApi();
    const { router } = renderAt("/compare");
    const picker = await screen.findByRole("region", { name: "Compare anything side by side" });
    await userEvent.type(within(picker).getByRole("searchbox"), "aerith");
    const result = await within(picker).findByRole("link", { name: /Death of Aerith/ });
    // A search looks across every kind, not just the chosen tab.
    expect(within(picker).getByRole("link", { name: /Aerith Gainsborough/ })).toBeTruthy();
    await userEvent.click(result);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/compare/event/aerith-death");
    });
    expect(router.state.location.search).toBe("");
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/compare?open=event_nibelheim_incident");
    await screen.findByRole("complementary", { name: "What changes" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
