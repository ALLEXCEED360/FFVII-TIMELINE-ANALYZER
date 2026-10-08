import { describe, expect, it } from "vitest";
import { parseTimelineParams, timelineSearch } from "./params";

describe("timeline params", () => {
  it("defaults to both tellings, in the order things happen", () => {
    expect(parseTimelineParams(new URLSearchParams())).toEqual({
      tellings: "both",
      view: "story",
      game: "og",
      keyOnly: false,
      event: null,
    });
  });

  it("reads one telling, and understands older links that named games", () => {
    expect(parseTimelineParams(new URLSearchParams("in=trilogy")).tellings).toBe("trilogy");
    expect(parseTimelineParams(new URLSearchParams("titles=remake,rebirth")).tellings).toBe(
      "trilogy",
    );
    expect(parseTimelineParams(new URLSearchParams("titles=og,rebirth")).tellings).toBe("both");
    expect(parseTimelineParams(new URLSearchParams("view=play&game=rebirth")).game).toBe("trilogy");
  });

  it("still understands the key-moments setting by its old name", () => {
    expect(parseTimelineParams(new URLSearchParams("major=1")).keyOnly).toBe(true);
  });

  it("round-trips, leaving defaults out of the URL", () => {
    const params = parseTimelineParams(
      new URLSearchParams("in=original&view=play&game=trilogy&key=1&event=event_x"),
    );
    expect(timelineSearch(params).toString()).toBe(
      "in=original&view=play&game=trilogy&key=1&event=event_x",
    );
    expect(timelineSearch(parseTimelineParams(new URLSearchParams())).toString()).toBe("");
  });
});
