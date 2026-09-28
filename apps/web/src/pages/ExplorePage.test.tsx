import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import entities from "../test/entities.json";
import { renderAt, stubApi } from "../test/render";

describe("explore page", () => {
  it("lists every entity, linking to its page", async () => {
    stubApi();
    renderAt("/explore");
    const results = await screen.findByRole("list", { name: "Results" });
    expect(within(results).getAllByRole("link")).toHaveLength(entities.items.length);
    const sector7 = within(results)
      .getAllByRole("link")
      .find((link) => link.querySelector(".font-display")?.textContent === "Sector 7");
    expect(sector7?.getAttribute("href")).toBe("/location/sector-7");
  });

  it("filters by kind, title and text, keeping filters in the URL", async () => {
    stubApi();
    const { router } = renderAt("/explore");
    await userEvent.click(await screen.findByRole("button", { name: /Locations/ }));
    await userEvent.click(screen.getByRole("button", { name: "INTERmission" }));
    const results = screen.getByRole("list", { name: "Results" });
    expect(
      within(results)
        .getAllByRole("link")
        .map((l) => l.querySelector(".font-display")?.textContent),
    ).toEqual(["Midgar", "Sector 7"]);
    expect(router.state.location.search).toBe("?kind=location&title=intermission");

    await userEvent.type(screen.getByRole("searchbox"), "seventh");
    expect(within(screen.getByRole("list", { name: "Results" })).getAllByRole("link")).toHaveLength(
      1,
    );
  });

  it("says so when nothing matches", async () => {
    stubApi();
    renderAt("/explore?q=zzzz");
    expect(await screen.findByText("Nothing matches these filters.")).toBeTruthy();
  });
});
