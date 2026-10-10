import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMusic } from "../features/music/store";
import { renderAt, stubApi } from "../test/render";

// A small library, in place of the files in src/music.
vi.mock("../features/music/library", async (original) => {
  const real = await original<typeof import("../features/music/library")>();
  const og = { album: "Final Fantasy VII", cover: "/og.webp" };
  const TRACKS = [
    { id: "og/01", title: "Prelude", composer: "Nobuo Uematsu", length: 174, url: "/a.mp3", ...og },
    {
      id: "og/02",
      title: "Cosmo Canyon",
      composer: "Nobuo Uematsu",
      length: 217,
      url: "/b.mp3",
      ...og,
    },
    {
      id: "cc/01",
      title: "The Price of Freedom",
      composer: "Takeharu Ishimoto",
      length: 222,
      url: "/c.mp3",
      album: "Crisis Core",
    },
  ];
  return {
    ...real,
    TRACKS,
    ALBUMS: [
      { name: "Final Fantasy VII", year: 1997, cover: "/og.webp", tracks: TRACKS.slice(0, 2) },
      { name: "Crisis Core", year: 2007, tracks: TRACKS.slice(2) },
    ],
    trackOf: (id: string | null) => TRACKS.find((t) => t.id === id),
  };
});

const fresh = () => {
  act(() => {
    useMusic.setState({
      on: true,
      shuffle: true,
      volume: 40,
      current: null,
      history: [],
      paused: false,
      time: 0,
      started: 0,
    });
  });
};

describe("the background music", () => {
  beforeEach(fresh);

  it("starts a random track at the first press, plays on from page to page, and says so in the corner", async () => {
    stubApi();
    const { router } = renderAt("/timeline");
    await screen.findByRole("heading", { level: 1, name: "Timeline" });
    expect(useMusic.getState().current).toBeNull();
    await userEvent.click(document.body);
    await waitFor(() => {
      expect(useMusic.getState().current).not.toBeNull();
    });
    const first = useMusic.getState().current;
    act(() => {
      useMusic.getState().markStarted();
    });
    const card = await screen.findByRole("status", { name: "Now playing" });
    const track = [
      ["og/01", "Prelude", "Nobuo Uematsu"],
      ["og/02", "Cosmo Canyon", "Nobuo Uematsu"],
      ["cc/01", "The Price of Freedom", "Takeharu Ishimoto"],
    ].find(([id]) => id === first);
    expect(card.textContent).toContain(track?.[1]);
    expect(card.textContent).toContain(track?.[2]);

    await act(() => router.navigate("/explore"));
    expect(useMusic.getState().current).toBe(first);
  });

  it("goes to the next and previous track with C and X, and pauses with P", async () => {
    stubApi();
    act(() => {
      useMusic.setState({ shuffle: false });
    });
    renderAt("/timeline");
    await screen.findByRole("heading", { level: 1, name: "Timeline" });
    await userEvent.click(document.body);
    await waitFor(() => {
      expect(useMusic.getState().current).toBe("og/01");
    });
    await userEvent.keyboard("c");
    expect(useMusic.getState().current).toBe("og/02");
    await userEvent.keyboard("c");
    expect(useMusic.getState().current).toBe("cc/01");
    await userEvent.keyboard("x");
    expect(useMusic.getState().current).toBe("og/02");
    await userEvent.keyboard("p");
    expect(useMusic.getState().paused).toBe(true);
    // Not while typing, nor with Ctrl held (copying).
    await userEvent.keyboard("{Control>}c{/Control}");
    expect(useMusic.getState().current).toBe("og/02");
  });
});

describe("Config's music player", () => {
  beforeEach(fresh);

  it("shows what's playing, skips back and on, pauses, and plays any track picked", async () => {
    stubApi();
    act(() => {
      useMusic.setState({ current: "og/02", shuffle: false });
    });
    renderAt("/settings");
    const music = await screen.findByRole("region", { name: "Music" });
    expect(within(music).getByText("Cosmo Canyon", { selector: ".mp-now-title" })).toBeTruthy();

    await userEvent.click(within(music).getByRole("button", { name: "Next track" }));
    expect(useMusic.getState().current).toBe("cc/01");
    await userEvent.click(within(music).getByRole("button", { name: "Previous track" }));
    expect(useMusic.getState().current).toBe("og/02");
    await userEvent.click(within(music).getByRole("button", { name: "Pause" }));
    expect(useMusic.getState().paused).toBe(true);

    const tracks = within(music).getByRole("list", { name: "Tracks" });
    await userEvent.click(within(tracks).getByRole("button", { name: /Prelude/ }));
    expect(useMusic.getState().current).toBe("og/01");
    expect(useMusic.getState().paused).toBe(false);
    expect(
      within(tracks)
        .getByRole("button", { name: /Prelude/ })
        .getAttribute("aria-current"),
    ).toBe("true");
  });

  it("shelves the albums, each opening its own tracks", async () => {
    stubApi();
    renderAt("/settings");
    const music = await screen.findByRole("region", { name: "Music" });
    const albums = within(music).getByRole("navigation", { name: "Albums" });
    await userEvent.click(within(albums).getByRole("button", { name: /Crisis Core/ }));
    const tracks = within(music).getByRole("list", { name: "Tracks" });
    expect(
      within(tracks)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual([expect.stringContaining("The Price of Freedom")]);
  });

  it("turns off, and remembers the order and the volume", async () => {
    stubApi();
    renderAt("/settings");
    const music = await screen.findByRole("region", { name: "Music" });
    await userEvent.click(within(music).getByRole("button", { name: "Shuffle (on)" }));
    expect(useMusic.getState().shuffle).toBe(false);
    await userEvent.click(within(music).getByText("Off"));
    expect(useMusic.getState().on).toBe(false);
    expect(within(music).getByText("Music is off")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("ffvii-music") ?? "{}")).toEqual({
      on: false,
      volume: 40,
      shuffle: false,
    });
  });

  it("has no accessibility violations", async () => {
    stubApi();
    act(() => {
      useMusic.setState({ current: "og/01" });
    });
    const { container } = renderAt("/settings");
    await screen.findByRole("region", { name: "Music" });
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
