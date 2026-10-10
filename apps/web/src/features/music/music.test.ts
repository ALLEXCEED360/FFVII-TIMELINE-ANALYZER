import { describe, expect, it } from "vitest";
import { duration, trackFromFile } from "./library";
import { nextTrack, previousTrack } from "./store";

describe("the background music's tracks", () => {
  it("reads a file named 'Artist - Title' as its artist and title, anything else as a title", () => {
    expect(trackFromFile("../../music/Rook%20Lane%20-%20Midgar%20Nights.mp3", "/a.mp3")).toEqual({
      id: "Rook Lane - Midgar Nights",
      artist: "Rook Lane",
      title: "Midgar Nights",
      url: "/a.mp3",
    });
    expect(trackFromFile("../../music/Lifestream.ogg", "/b.ogg")).toEqual({
      id: "Lifestream",
      title: "Lifestream",
      url: "/b.ogg",
    });
  });
});

describe("albums and order", () => {
  it("takes a folder as the album, and a leading number only as the order", () => {
    expect(
      trackFromFile(
        "../../music/1%20-%20Final%20Fantasy%20VII%20(1997)/04%20-%20Aerith's%20Theme.mp3",
        "/c.mp3",
      ),
    ).toEqual({
      id: "1 - Final Fantasy VII (1997)/04 - Aerith's Theme",
      album: "Final Fantasy VII (1997)",
      title: "Aerith's Theme",
      url: "/c.mp3",
    });
    expect(
      trackFromFile("../../music/2 - Crisis Core/01 - Ivy - Wings.mp3", "/d.mp3"),
    ).toMatchObject({
      album: "Crisis Core",
      artist: "Ivy",
      title: "Wings",
    });
  });
});

describe("nextTrack", () => {
  const ids = ["a", "b", "c"];

  it("goes down the list in order, round to the start", () => {
    expect(nextTrack(ids, null, false)).toBe("a");
    expect(nextTrack(ids, "b", false)).toBe("c");
    expect(nextTrack(ids, "c", false)).toBe("a");
  });

  it("shuffled, never plays the same track twice in a row", () => {
    for (let i = 0; i < 30; i++) expect(nextTrack(ids, "b", true)).not.toBe("b");
    expect(nextTrack(["only"], "only", true)).toBe("only");
    expect(nextTrack([], null, true)).toBeNull();
  });
});

describe("previousTrack", () => {
  const ids = ["a", "b", "c"];
  it("goes back to the last one played, else (in order) the one above", () => {
    expect(previousTrack(ids, "c", ["a"], true)).toBe("a");
    expect(previousTrack(ids, "b", [], false)).toBe("a");
    expect(previousTrack(ids, "a", [], false)).toBe("c");
    expect(previousTrack(ids, "b", [], true)).toBe("b");
  });
});

describe("credits from album.json", () => {
  it("adds the album's name, cover and each track's composer", () => {
    const track = trackFromFile(
      "../../music/1 - Final Fantasy VII (1997)/01 - Prelude.mp3",
      "/p.mp3",
      {
        title: "Final Fantasy VII",
        tracks: { "01 - Prelude.mp3": { composer: "Nobuo Uematsu", length: 174 } },
      },
      "/cover.webp",
    );
    expect(track).toMatchObject({
      title: "Prelude",
      album: "Final Fantasy VII",
      cover: "/cover.webp",
      composer: "Nobuo Uematsu",
      length: 174,
    });
    expect(duration(174)).toBe("2:54");
  });
});
