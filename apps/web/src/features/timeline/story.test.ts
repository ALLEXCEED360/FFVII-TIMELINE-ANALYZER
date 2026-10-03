import { describe, expect, it } from "vitest";
import type { Reference, TimelineEvent } from "../../api/client";
import reference from "../../test/reference.json";
import timeline from "../../test/timeline.json";
import { markOf, playOrder, storyChapters, tellingOf, whenOf } from "./story";

const events = timeline.items as TimelineEvent[];
const { eras, arcs } = reference as unknown as Reference;
const event = (name: string) => {
  const found = events.find((e) => e.name === name);
  if (!found) throw new Error(`no event ${name}`);
  return found;
};

describe("the story in chapters", () => {
  const chapters = storyChapters(events, eras, arcs);

  it("tells what comes before the story by era, then the story by arc, in order", () => {
    expect(chapters.map((c) => `${c.part}: ${c.name}`)).toEqual([
      "Before the story: The Distant Past",
      "Before the story: Shinra's Rise",
      "Before the story: Five Years Before",
      "The story: Midgar",
      "The story: The Journey Begins",
      "The story: Across the Sea",
      "The story: The Promised Land",
      "The story: Meteor",
      "The story: The Lifestream",
      "The story: The Final Battle",
    ]);
  });

  it("keeps every event exactly once, in story order inside each chapter", () => {
    expect(chapters.flatMap((c) => c.events)).toHaveLength(events.length);
    const midgar = chapters.find((c) => c.name === "Midgar")?.events.map((e) => e.name) ?? [];
    expect(midgar.indexOf("Bombing of Mako Reactor 1")).toBeLessThan(
      midgar.indexOf("Fall of the Sector 7 Plate"),
    );
  });

  it("leaves out chapters with nothing in them", () => {
    const pastOnly = storyChapters(
      events.filter((e) => e.start.earliest < 0),
      eras,
      arcs,
    );
    expect(pastOnly.every((c) => c.part === "Before the story")).toBe(true);
  });
});

describe("plain words", () => {
  it("says whether each game shows an event, only mentions it, or leaves it out", () => {
    const nibelheim = event("Nibelheim Incident");
    expect(markOf(nibelheim, "og")).toBe("shown");
    expect(markOf(nibelheim, "remake")).toBe("mentioned");
    expect(markOf(nibelheim, "intermission")).toBe("none");
  });

  it("describes how a game tells it", () => {
    expect(tellingOf({ status: "depicted", framing: "false_account", world: "world_main" })).toBe(
      "Shown, but as a false memory",
    );
    expect(tellingOf({ status: "referenced", framing: "mention", world: "world_main" })).toBe(
      "Only mentioned",
    );
    expect(
      tellingOf({ status: "referenced", framing: "mention", world: "world_zack_survives" }),
    ).toBe("Only mentioned, in another world");
    expect(tellingOf({ status: "omitted", framing: null, world: "world_main" })).toBe("Left out");
  });

  it("says when, for someone who doesn't know the story", () => {
    expect(whenOf(event("Nibelheim Incident"))).toBe("5 years before the story");
    expect(whenOf(event("The Calamity from the Skies"))).toBe("About 2,000 years before the story");
    expect(whenOf(event("Death of Aerith"))).toBeNull();
  });
});

describe("play order", () => {
  it("lists one game's events in the order you meet them", () => {
    const rebirth = playOrder(events, "rebirth").map((e) => e.name);
    expect(rebirth[0]).toBe("Fall of the Sector 7 Plate");
    expect(rebirth.indexOf("Nibelheim Incident")).toBeLessThan(rebirth.indexOf("Death of Aerith"));
    expect(rebirth).not.toContain("Meteor Is Summoned");
  });
});
