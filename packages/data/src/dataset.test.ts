import { fileURLToPath } from "node:url";
import { CoverageIndex, TITLES_IN_ORDER, displayStatus } from "@ffvii/shared";
import { describe, expect, it } from "vitest";
import { readDataDir } from "./files.ts";
import { formatIssue } from "./issues.ts";
import { loadDataset } from "./load.ts";
import { validateDataset } from "./validate.ts";

// The real dataset in data/ must always validate.

const DATA_DIR = fileURLToPath(new URL("../../../data/", import.meta.url));

describe("data/", async () => {
  const { dataset, issues } = loadDataset(await readDataDir(DATA_DIR));
  issues.push(...validateDataset(dataset));

  it("has no errors", () => {
    expect(issues.filter((i) => i.level === "error").map(formatIssue)).toEqual([]);
  });

  it("shows the original's later events as not yet reached in the Remake series", () => {
    const index = new CoverageIndex(dataset.segments, dataset.coverage);
    const event = dataset.entities.get("event_cloud_memories_restored")?.entity;
    expect(event).toBeDefined();
    const statuses = TITLES_IN_ORDER.map((title) =>
      displayStatus(event!.appearances, title, index),
    );
    expect(statuses).toEqual(["depicted", "not_yet_reached", "absent", "not_yet_reached"]);
  });
});
