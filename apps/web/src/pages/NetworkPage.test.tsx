import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import networkCloud from "../test/network-cloud.json";
import { renderAt, stubApi } from "../test/render";

// Cytoscape draws on a canvas, which jsdom can't do. The graph is replaced by a stand-in that
// exposes what it was given; everything around it — controls, URL state, selection, path, list —
// is the real thing.
vi.mock("../features/network/GraphView", () => ({
  default: ({
    elements,
    onSelect,
    onFocus,
  }: {
    elements: { data: { id: string }; classes?: string }[];
    onSelect: (id: string | null) => void;
    onFocus: (id: string) => void;
  }) => (
    <div data-testid="graph">
      {elements.map((e) => (
        <span key={e.data.id} data-id={e.data.id} data-classes={e.classes} />
      ))}
      <button
        type="button"
        onClick={() => {
          onSelect("event_aerith_death");
        }}
      >
        graph: select Death of Aerith
      </button>
      <button
        type="button"
        onClick={() => {
          onFocus("location_nibelheim");
        }}
      >
        graph: focus Nibelheim
      </button>
    </div>
  ),
}));

const classesOf = (id: string) =>
  screen.getByTestId("graph").querySelector(`[data-id="${id}"]`)?.getAttribute("data-classes");

describe("network page", () => {
  it("draws the centre's neighbourhood and lists it as text", async () => {
    stubApi();
    renderAt("/network/character/cloud-strife");
    await screen.findByTestId("graph");
    expect(classesOf("character_cloud_strife")).toContain("center");
    expect(classesOf("character_cloud_strife")).toContain("portrait");
    const list = screen.getByRole("list", { name: "Everything in the web and its links" });
    expect(
      within(list)
        .getAllByRole("button", { name: /./ })
        .map((b) => b.textContent),
    ).toEqual(networkCloud.nodes.map((n) => n.name));
  });

  it("selects from the graph: highlights the immediate network and offers actions", async () => {
    stubApi();
    const { router } = renderAt("/network/character/cloud-strife");
    await userEvent.click(
      await screen.findByRole("button", { name: "graph: select Death of Aerith" }),
    );
    expect(router.state.location.search).toBe("?node=event_aerith_death");
    expect(classesOf("event_aerith_death")).toContain("selected");
    expect(classesOf("character_cloud_strife")).toContain("near");
    expect(classesOf("location_nibelheim")).toContain("faded");

    const chosen = screen.getByRole("complementary", { name: "Chosen in the web" });
    expect(within(chosen).getByRole("heading", { name: "Death of Aerith" })).toBeTruthy();
    expect(within(chosen).getByText("Who took part")).toBeTruthy();
    expect(
      within(chosen)
        .getByRole("link", { name: "Everything about Death of Aerith" })
        .getAttribute("href"),
    ).toBe("/event/aerith-death");
    await userEvent.click(within(chosen).getByRole("button", { name: "Show their own links too" }));
    expect(router.state.location.search).toContain("expand=event_aerith_death");
  });

  it("recentres on double-click, keeping filters but not the selection", async () => {
    stubApi();
    const { router } = renderAt("/network/character/cloud-strife?depth=2&node=event_aerith_death");
    await userEvent.click(await screen.findByRole("button", { name: "graph: focus Nibelheim" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/network/location/nibelheim");
    });
    expect(router.state.location.search).toBe("?depth=2");
  });

  it("finds and shows the strongest path", async () => {
    const requests = stubApi();
    renderAt("/network/character/cloud-strife");
    await screen.findByTestId("graph");
    await userEvent.selectOptions(
      screen.getByLabelText("How is Cloud Strife linked to…"),
      "character_sephiroth",
    );
    const panel = await screen.findByRole("region", {
      name: "How Cloud Strife is linked to Sephiroth",
    });
    await within(panel).findByRole("button", { name: "Death of Aerith" });
    expect(within(panel).getByText(/2 steps/)).toBeTruthy();
    expect(classesOf("event_aerith_death")).toContain("on-path");
    const path = requests.find((u) => u.pathname === "/network/path");
    expect(path?.searchParams.get("to")).toBe("character_sephiroth");
  });

  it("sends depth, titles and categories to the API", async () => {
    const requests = stubApi();
    renderAt("/network/character/cloud-strife");
    await screen.findByTestId("graph");
    await userEvent.click(screen.getByRole("button", { name: "Two steps away" }));
    await userEvent.click(screen.getByRole("button", { name: /INTERmission/ }));
    await userEvent.click(screen.getByRole("button", { name: /Family, homes and groups/ }));
    await waitFor(() => {
      const last = requests.filter((u) => u.pathname.startsWith("/network/character")).at(-1);
      expect(Object.fromEntries(last?.searchParams ?? [])).toEqual({
        depth: "2",
        titles: "og,remake,rebirth",
        categories: "event,causal",
      });
    });
  });

  it("has no accessibility violations", async () => {
    stubApi();
    const { container } = renderAt("/network/character/cloud-strife?node=event_aerith_death");
    await screen.findByTestId("graph");
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

describe("network overview", () => {
  it("offers everyone to start with, most linked first, keeping the chosen games", async () => {
    stubApi();
    renderAt("/network?titles=intermission");
    const cast = await screen.findByRole("list", { name: "Whose web to see" });
    const cloud = await within(cast).findByRole("link", { name: /Cloud Strife/ });
    expect(cloud.getAttribute("href")).toBe("/network/character/cloud-strife?titles=intermission");
    await userEvent.click(screen.getByRole("button", { name: "Places" }));
    expect(
      within(screen.getByRole("list", { name: "Whose web to see" }))
        .getByRole("link", { name: /Midgar/ })
        .getAttribute("href"),
    ).toBe("/network/location/midgar?titles=intermission");
  });

  it("opens a path search in the network view", async () => {
    stubApi();
    const { router } = renderAt("/network");
    await screen.findByRole("region", { name: "How are they linked?" });
    await waitFor(() => {
      expect(
        within(screen.getByLabelText("First")).getByRole("option", { name: "Tifa Lockhart" }),
      ).toBeTruthy();
    });
    await userEvent.selectOptions(screen.getByLabelText("First"), "character_tifa_lockhart");
    await userEvent.selectOptions(screen.getByLabelText("Second"), "character_sephiroth");
    await userEvent.click(screen.getByRole("button", { name: "Show how they're linked" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/network/character/tifa-lockhart");
    });
    expect(router.state.location.search).toBe("?to=character_sephiroth");
  });
});
