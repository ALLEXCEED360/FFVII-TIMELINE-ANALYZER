import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderAt, stubApi } from "../test/render";

// No files in src/music.
vi.mock("../features/music/library", async (original) => ({
  ...(await original<typeof import("../features/music/library")>()),
  TRACKS: [],
  ALBUMS: [],
  trackOf: () => undefined,
}));

describe("Config's music, with none added", () => {
  it("says so plainly", async () => {
    stubApi();
    renderAt("/settings");
    const music = await screen.findByRole("region", { name: "Music" });
    expect(within(music).getByText("No music has been added to the guide yet.")).toBeTruthy();
  });
});
