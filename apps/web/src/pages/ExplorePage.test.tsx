import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import entities from "../test/entities.json";
import { renderAt, stubApi } from "../test/render";

const names = (list: HTMLElement) =>
  within(list)
    .getAllByRole("link")
    .map((link) => link.querySelector(".ex-card-name")?.textContent);

describe("explore page", () => {
  it("shows everything as cards grouped by kind, each linking to its page", async () => {
    stubApi();
    renderAt("/explore");
    const people = await screen.findByRole("list", { name: "People" });
    const places = screen.getByRole("list", { name: "Places" });
    const groups = ["People", "Moments", "Places", "Groups"]
      .map((name) => screen.queryByRole("list", { name }))
      .filter((list) => list !== null);
    expect(groups.flatMap((list) => within(list).getAllByRole("link"))).toHaveLength(
      entities.items.length,
    );
    expect(names(people)).toContain("Cloud Strife");
    const sector7 = within(places)
      .getAllByRole("link")
      .find((link) => link.querySelector(".ex-card-name")?.textContent === "Sector 7");
    expect(sector7?.getAttribute("href")).toBe("/location/sector-7");
  });

  it("filters by kind, game and text, keeping the choices in the URL", async () => {
    stubApi();
    const { router } = renderAt("/explore");
    await userEvent.click(await screen.findByRole("button", { name: /Places/ }));
    await userEvent.click(screen.getByRole("button", { name: "INTERmission" }));
    expect(names(screen.getByRole("list", { name: "Places" }))).toEqual(["Midgar", "Sector 7"]);
    expect(screen.queryByRole("list", { name: "People" })).toBeNull();
    expect(router.state.location.search).toBe("?kind=location&title=intermission");

    await userEvent.type(screen.getByRole("searchbox"), "seventh");
    expect(within(screen.getByRole("list", { name: "Places" })).getAllByRole("link")).toHaveLength(
      1,
    );
  });

  it("says so when nothing matches, with a way back to everything", async () => {
    stubApi();
    const { router } = renderAt("/explore?q=zzzz");
    expect(await screen.findByText(/Nothing matches/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Show everything" }));
    expect(router.state.location.search).toBe("");
    expect(await screen.findByRole("list", { name: "People" })).toBeTruthy();
  });
});
