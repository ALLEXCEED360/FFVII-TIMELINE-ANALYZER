import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAt, stubApi } from "../test/render";

describe("the page bar", () => {
  it("keeps Config and Credits beside the sections, lit on their own page", async () => {
    stubApi();
    renderAt("/settings");
    const more = await screen.findByRole("navigation", { name: "More" });
    const links = within(more).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Config", "/settings"],
      ["Credits", "/credits"],
    ]);
    expect(links[0]?.getAttribute("aria-current")).toBe("page");
  });
});
