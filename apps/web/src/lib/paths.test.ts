import { describe, expect, it } from "vitest";
import { entityPath, idFromPath } from "./paths";

describe("entity paths", () => {
  it("turns IDs into readable paths and back", () => {
    expect(entityPath("character_cloud_strife")).toBe("/character/cloud-strife");
    expect(entityPath("event_mako_reactor_1_bombing")).toBe("/event/mako-reactor-1-bombing");
    expect(idFromPath("character", "cloud-strife")).toBe("character_cloud_strife");
    expect(idFromPath("location", "sector-7")).toBe("location_sector_7");
  });

  it("rejects paths that can't name an entity", () => {
    expect(idFromPath("titan", "attack")).toBeUndefined();
    expect(idFromPath("character", "Cloud_Strife")).toBeUndefined();
    expect(idFromPath("character", undefined)).toBeUndefined();
  });
});
