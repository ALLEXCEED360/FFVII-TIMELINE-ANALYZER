import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import differences from "../test/differences.json";
import { renderAt, stubApi } from "../test/render";

describe("compare page", () => {
  it("lists every difference, grouped by entity, with a link to each comparison", async () => {
    stubApi();
    renderAt("/compare");
    const list = await screen.findByRole("region", { name: "Differences" });
    await within(list).findByRole("heading", { level: 2, name: /Nibelheim Incident/ });
    expect(within(list).getAllByText(/^Sources:/)).toHaveLength(differences.items.length);
    const links = within(list).getAllByRole("link", { name: /Side by side/ });
    expect(links[0]?.getAttribute("href")).toBe("/compare/event/nibelheim-incident");
  });

  it("asks the API for the chosen titles, category and magnitude", async () => {
    const requests = stubApi();
    renderAt("/compare");
    await screen.findByRole("region", { name: "Differences" });
    await userEvent.click(screen.getByRole("button", { name: "OG vs Remake" }));
    await userEvent.selectOptions(screen.getByLabelText("Category"), "gameplay");
    await userEvent.click(screen.getByLabelText("Major differences only"));
    await waitFor(() => {
      const last = requests.filter((u) => u.pathname === "/differences").at(-1);
      expect(Object.fromEntries(last?.searchParams ?? [])).toEqual({
        titles: "og,remake",
        category: "gameplay",
        magnitude: "major",
      });
    });
  });

  it("opens an entity's comparison from the picker, keeping the chosen titles", async () => {
    stubApi();
    const { router } = renderAt("/compare?titles=og,rebirth");
    const picker = await screen.findByLabelText("Compare an entity");
    await waitFor(() => {
      expect(within(picker).getByRole("option", { name: "Death of Aerith" })).toBeTruthy();
    });
    await userEvent.selectOptions(picker, "event_aerith_death");
    // The comparison page is lazy-loaded; the router commits the URL once its code has arrived.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/compare/event/aerith-death");
    });
    expect(router.state.location.search).toBe("?titles=og,rebirth");
  });
});
