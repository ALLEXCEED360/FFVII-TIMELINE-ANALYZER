import {
  ACYCLIC_EDGE_TYPES,
  type Appearance,
  CoverageIndex,
  type DateRef,
  EDGE_TYPES,
  type EdgeTypeDefinition,
  type Entity,
  type InUniverseDate,
  type Locator,
  MAIN_WORLD,
  TITLES,
  type TitleCode,
  chapterCount,
  displayStatus,
  edgeTitles,
  isRemakeSeries,
  ogSegmentOf,
  resolveDate,
  resolveWhen,
} from "@ffvii/shared";
import type { Issue } from "./issues.ts";
import { type Dataset, type LoadedEdge, REFERENCE_FILES } from "./load.ts";

/**
 * Cross-file rules from the design docs: references, locators, coverage, appearances,
 * differences, relationships, cycles, chronology and reference data. Schema rules run earlier,
 * in `loadDataset`.
 */
export function validateDataset(dataset: Dataset): Issue[] {
  return [
    ...checkRedirects(dataset),
    ...checkSegments(dataset),
    ...checkCoverage(dataset),
    ...checkArcs(dataset),
    ...checkWorlds(dataset),
    ...checkEntities(dataset),
    ...checkEdges(dataset),
    ...checkCycles(dataset),
    ...checkChronology(dataset),
    ...checkResearch(dataset),
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function error(file: string, path: string | undefined, message: string): Issue {
  return path === undefined
    ? { level: "error", file, message }
    : { level: "error", file, path, message };
}

function warning(file: string, path: string | undefined, message: string): Issue {
  return { ...error(file, path, message), level: "warning" };
}

/** Problems with a locator that only the reference data can reveal. */
function locatorProblem(dataset: Dataset, locator: Locator): string | undefined {
  if (!("segment" in locator)) return undefined;
  const segment = dataset.segments.find((s) => s.id === locator.segment);
  if (segment === undefined) return `unknown segment \`${locator.segment}\``;
  if (segment.disc !== locator.disc) {
    return `\`${locator.segment}\` is on disc ${String(segment.disc)}, not disc ${String(locator.disc)}`;
  }
  return undefined;
}

function checkLocators(
  dataset: Dataset,
  file: string,
  entries: readonly (readonly [string, Locator])[],
): Issue[] {
  return entries.flatMap(([path, locator]) => {
    const problem = locatorProblem(dataset, locator);
    return problem === undefined ? [] : [error(file, path, problem)];
  });
}

function appearanceLocators(appearance: Appearance, base: string): [string, Locator][] {
  return [
    ...appearance.sources.map((s, i) => [`${base}.sources[${String(i)}]`, s] as [string, Locator]),
    ...appearance.depictions.map(
      (d, i) => [`${base}.depictions[${String(i)}].at`, d.at] as [string, Locator],
    ),
  ];
}

function segmentIndex(dataset: Dataset, id: string): number {
  return dataset.segments.findIndex((s) => s.id === id);
}

function unknownEntity(dataset: Dataset, id: string): string | undefined {
  if (dataset.entities.has(id)) return undefined;
  const replacement = dataset.redirects[id];
  if (replacement === undefined) return `unknown entity \`${id}\``;
  return `\`${id}\` was retired${replacement ? ` — use \`${replacement}\`` : ""}`;
}

// ─── Reference data ───────────────────────────────────────────────────────────

function checkRedirects({ entities, redirects }: Dataset): Issue[] {
  const issues: Issue[] = [];
  for (const [retired, replacement] of Object.entries(redirects)) {
    const fail = (message: string) =>
      issues.push(error(REFERENCE_FILES.redirects, retired, message));
    if (entities.has(retired)) fail("a retired ID can't also be a live entity");
    if (replacement !== null && !entities.has(replacement)) {
      fail(`redirect target \`${replacement}\` isn't a live entity (redirects can't chain)`);
    }
  }
  return issues;
}

function checkSegments({ segments }: Dataset): Issue[] {
  const file = REFERENCE_FILES.segments;
  const issues: Issue[] = [];
  const seen = new Set<string>();
  segments.forEach((segment, index) => {
    const path = `[${String(index)}]`;
    if (seen.has(segment.id)) issues.push(error(file, path, `duplicate segment \`${segment.id}\``));
    seen.add(segment.id);
    const previous = segments[index - 1];
    if (previous !== undefined && segment.disc < previous.disc) {
      issues.push(error(file, path, "segments must be in play order (discs can't go backwards)"));
    }
  });
  return issues;
}

function checkRange(
  dataset: Dataset,
  file: string,
  path: string,
  range: { from: string; to: string },
): Issue[] {
  const from = segmentIndex(dataset, range.from);
  const to = segmentIndex(dataset, range.to);
  const issues: Issue[] = [];
  if (from < 0) issues.push(error(file, `${path}.from`, `unknown segment \`${range.from}\``));
  if (to < 0) issues.push(error(file, `${path}.to`, `unknown segment \`${range.to}\``));
  if (from >= 0 && to >= 0 && from > to) {
    issues.push(error(file, path, "`from` must not come after `to` in play order"));
  }
  return issues;
}

function checkCoverage(dataset: Dataset): Issue[] {
  const file = REFERENCE_FILES.coverage;
  return Object.entries(dataset.coverage).flatMap(([title, range]) => {
    const issues = checkRange(dataset, file, title, range);
    const from = segmentIndex(dataset, range.from);
    const to = segmentIndex(dataset, range.to);
    for (const segment of range.except ?? []) {
      const index = segmentIndex(dataset, segment);
      if (index < from || index > to) {
        issues.push(error(file, `${title}.except`, `\`${segment}\` isn't inside the range`));
      }
    }
    return issues;
  });
}

function checkArcs(dataset: Dataset): Issue[] {
  const file = REFERENCE_FILES.arcs;
  const issues: Issue[] = [];
  let expected = 0;
  dataset.arcs.forEach((arc, index) => {
    const path = `[${String(index)}]`;
    issues.push(...checkRange(dataset, file, `${path}.og`, arc.og));
    const from = segmentIndex(dataset, arc.og.from);
    const to = segmentIndex(dataset, arc.og.to);
    if (from >= 0 && from !== expected) {
      issues.push(
        error(file, `${path}.og.from`, "arcs must follow each other with no gap or overlap"),
      );
    }
    if (to >= 0) expected = to + 1;

    for (const [title, [first, last]] of Object.entries(arc.chapters ?? {})) {
      const count = chapterCount(title as TitleCode) ?? 0;
      if (first > last || last > count) {
        issues.push(
          error(file, `${path}.chapters.${title}`, `must be a range within 1–${String(count)}`),
        );
      }
    }
  });
  if (dataset.segments.length > 0 && expected !== dataset.segments.length) {
    issues.push(error(file, undefined, "arcs must cover every segment, through the last one"));
  }
  return issues;
}

function checkWorlds(dataset: Dataset): Issue[] {
  const file = REFERENCE_FILES.worlds;
  const issues: Issue[] = [];
  const seen = new Set<string>();
  if (!dataset.worlds.some((world) => world.id === MAIN_WORLD)) {
    issues.push(error(file, undefined, `\`${MAIN_WORLD}\` must be defined`));
  }
  dataset.worlds.forEach((world, index) => {
    const path = `[${String(index)}]`;
    if (seen.has(world.id)) issues.push(error(file, path, `duplicate world \`${world.id}\``));
    seen.add(world.id);
    if (!("firstShown" in world)) return;
    if (!isRemakeSeries(world.firstShown.title)) {
      issues.push(error(file, `${path}.firstShown`, "only the Remake series has other worlds"));
    }
    if (world.branchesFrom !== undefined) {
      const problem = unknownEntity(dataset, world.branchesFrom);
      if (problem) issues.push(error(file, `${path}.branchesFrom`, problem));
    }
    issues.push(
      ...checkLocators(dataset, file, [
        [`${path}.firstShown`, world.firstShown],
        ...world.sources.map((s, i) => [`${path}.sources[${String(i)}]`, s] as [string, Locator]),
      ]),
    );
  });
  return issues;
}

// ─── Entities, appearances and differences ────────────────────────────────────

function checkEntities(dataset: Dataset): Issue[] {
  const index = new CoverageIndex(dataset.segments, dataset.coverage);
  const worlds = new Set(dataset.worlds.map((world) => world.id));
  const arcs = new Set(dataset.arcs.map((arc) => arc.id));
  const issues: Issue[] = [];

  for (const { entity, file } of dataset.entities.values()) {
    const ogSegment = ogSegmentOf(entity.appearances);

    entity.appearances.forEach((appearance, i) => {
      const base = `appearances[${String(i)}]`;
      issues.push(...checkLocators(dataset, file, appearanceLocators(appearance, base)));

      if (!worlds.has(appearance.world)) {
        issues.push(error(file, `${base}.world`, `unknown world \`${appearance.world}\``));
      } else if (appearance.world !== MAIN_WORLD && !isRemakeSeries(appearance.title)) {
        issues.push(error(file, `${base}.world`, "only the Remake series has other worlds"));
      }

      if (appearance.status === "omitted") {
        if (ogSegment === undefined) {
          issues.push(
            error(file, `${base}.status`, "`omitted` needs an `og` appearance to compare with"),
          );
        } else if (!index.covers(appearance.title, ogSegment)) {
          issues.push(
            error(
              file,
              `${base}.status`,
              `${appearance.title} doesn't cover \`${ogSegment}\` — it can't have omitted this`,
            ),
          );
        }
      }

      if (appearance.when !== undefined) {
        const explained = entity.differences.some(
          (d) =>
            d.category === "chronology" &&
            (d.to.title === appearance.title || d.from.title === appearance.title),
        );
        if (!explained) {
          issues.push(
            error(
              file,
              `${base}.when`,
              "a `when` override needs a `chronology` difference for this title",
            ),
          );
        }
      }
    });

    entity.differences.forEach((difference, i) => {
      const base = `differences[${String(i)}]`;
      issues.push(
        ...checkLocators(
          dataset,
          file,
          difference.sources.map(
            (s, j) => [`${base}.sources[${String(j)}]`, s] as [string, Locator],
          ),
        ),
      );
      for (const side of ["from", "to"] as const) {
        const { title, world } = difference[side];
        const found = entity.appearances.some((a) => a.title === title && a.world === world);
        if (!found) {
          issues.push(
            error(file, `${base}.${side}`, `no ${title} appearance in \`${world}\` to compare`),
          );
        }
      }
      (difference.related ?? []).forEach((id, j) => {
        const problem = unknownEntity(dataset, id);
        if (problem) issues.push(error(file, `${base}.related[${String(j)}]`, problem));
      });
    });

    if (entity.kind === "event") {
      if (!arcs.has(entity.arc)) issues.push(error(file, "arc", `unknown arc \`${entity.arc}\``));
      if (entity.importance >= 2) {
        for (const title of Object.keys(dataset.coverage) as TitleCode[]) {
          const subject = { appearances: entity.appearances, ogSegment };
          if (displayStatus(subject, title, index) === "undocumented") {
            issues.push(
              warning(
                file,
                "appearances",
                `${TITLES[title].shortName} covers this part of the story but has no appearance (undocumented)`,
              ),
            );
          }
        }
      }
    }
  }
  return issues;
}

// ─── Relationships ────────────────────────────────────────────────────────────

function edgeIssue(loaded: LoadedEdge, message: string, field?: string): Issue {
  const path = `relationships[${String(loaded.index)}]${field ? `.${field}` : ""}`;
  return error(loaded.file, path, message);
}

function dateRefEvent(ref: DateRef | undefined): string | undefined {
  return ref !== undefined && "event" in ref ? ref.event : undefined;
}

function checkEdges(dataset: Dataset): Issue[] {
  const { entities } = dataset;
  const worlds = new Set(dataset.worlds.map((world) => world.id));
  const issues: Issue[] = [];
  const identities = new Set<string>();

  for (const loaded of dataset.edges) {
    const { edge } = loaded;
    const definition: EdgeTypeDefinition = EDGE_TYPES[edge.type];

    const missing = unknownEntity(dataset, edge.target);
    if (missing) {
      issues.push(edgeIssue(loaded, missing, "target"));
      continue;
    }
    const source = entities.get(edge.source)?.entity;
    const target = entities.get(edge.target)?.entity;
    if (source === undefined || target === undefined) continue;

    if (!definition.pairs.some(([s, t]) => s === source.kind && t === target.kind)) {
      const allowed = definition.pairs.map(([s, t]) => `${s} → ${t}`).join(", ");
      issues.push(edgeIssue(loaded, `\`${edge.type}\` connects ${allowed}`, "type"));
    }
    if (edge.source === edge.target) {
      issues.push(edgeIssue(loaded, "an entity can't be related to itself", "target"));
    }

    // Identity (source, type, target, from) — relationships.md §2.
    const from = "from" in edge ? JSON.stringify(edge.from ?? null) : "null";
    const identity = `${edge.source}|${edge.type}|${edge.target}|${from}`;
    const reverse = `${edge.target}|${edge.type}|${edge.source}|${from}`;
    if (identities.has(identity)) {
      issues.push(
        edgeIssue(loaded, "duplicate relationship (same source, type, target and `from`)"),
      );
    } else if (definition.symmetric && identities.has(reverse)) {
      issues.push(
        edgeIssue(loaded, `\`${edge.type}\` is symmetric — store it in one direction only`),
      );
    }
    identities.add(identity);

    const refs: [string, DateRef | undefined][] = [
      ["from", "from" in edge ? edge.from : undefined],
      ["until", "until" in edge ? edge.until : undefined],
    ];
    for (const [field, ref] of refs) {
      const event = dateRefEvent(ref);
      const problem = event === undefined ? undefined : unknownEntity(dataset, event);
      if (problem) issues.push(edgeIssue(loaded, problem, field));
    }
    if (edge.type === "killed" && edge.in !== undefined) {
      const problem = unknownEntity(dataset, edge.in);
      if (problem) issues.push(edgeIssue(loaded, problem, "in"));
    }

    for (const title of edgeTitles(edge)) {
      const scope = edge.titles[title];
      if (scope === undefined) continue;
      const base = `titles.${title}`;
      issues.push(
        ...checkLocators(
          dataset,
          loaded.file,
          scope.sources.map(
            (s, i) =>
              [`relationships[${String(loaded.index)}].${base}.sources[${String(i)}]`, s] as [
                string,
                Locator,
              ],
          ),
        ),
      );
      if (!worlds.has(scope.world)) {
        issues.push(edgeIssue(loaded, `unknown world \`${scope.world}\``, `${base}.world`));
      }
      for (const [role, entity] of [
        ["source", source],
        ["target", target],
      ] as const) {
        if (!appearsIn(entity, title, scope.world)) {
          issues.push(
            edgeIssue(
              loaded,
              `the ${role} (\`${entity.id}\`) has no ${title} appearance in \`${scope.world}\``,
              base,
            ),
          );
        }
      }
    }
  }
  return issues;
}

function appearsIn(entity: Entity, title: TitleCode, world: string): boolean {
  return entity.appearances.some(
    (a) => a.title === title && a.world === world && a.status !== "omitted",
  );
}

function checkCycles(dataset: Dataset): Issue[] {
  const issues: Issue[] = [];
  for (const type of ACYCLIC_EDGE_TYPES) {
    const edges = dataset.edges.filter((loaded) => loaded.edge.type === type);
    const next = new Map<string, LoadedEdge[]>();
    for (const loaded of edges) {
      next.set(loaded.edge.source, [...(next.get(loaded.edge.source) ?? []), loaded]);
    }
    const state = new Map<string, "visiting" | "done">();
    const visit = (node: string, path: string[]): string[] | undefined => {
      if (state.get(node) === "visiting") return [...path.slice(path.indexOf(node)), node];
      if (state.get(node) === "done") return undefined;
      state.set(node, "visiting");
      for (const loaded of next.get(node) ?? []) {
        const cycle = visit(loaded.edge.target, [...path, node]);
        if (cycle) return cycle;
      }
      state.set(node, "done");
      return undefined;
    };
    for (const loaded of edges) {
      const cycle = visit(loaded.edge.source, []);
      if (cycle) {
        issues.push(edgeIssue(loaded, `\`${type}\` cycle: ${cycle.join(" → ")}`));
        break;
      }
    }
  }
  return issues;
}

// ─── Chronology and eras ──────────────────────────────────────────────────────

function checkChronology(dataset: Dataset): Issue[] {
  const file = REFERENCE_FILES.eras;
  const issues: Issue[] = [];
  const eras = dataset.eras;

  eras.forEach((era, index) => {
    const previous = eras[index - 1];
    if (previous !== undefined && era.start !== previous.end + 1) {
      issues.push(
        error(file, `[${String(index)}]`, "eras must follow each other with no gap or overlap"),
      );
    }
  });

  const inEra = (year: number) => eras.some((era) => era.start <= year && year <= era.end);
  const checkDate = (entityFile: string, path: string, date: InUniverseDate) => {
    const range = resolveDate(date);
    for (const year of [range.earliest, range.latest]) {
      if (!inEra(year)) {
        issues.push(error(entityFile, path, `year ${String(year)} isn't inside any era`));
        return;
      }
    }
  };

  const events: { id: string; start: number; seq: number | undefined; file: string }[] = [];
  for (const { entity, file: entityFile } of dataset.entities.values()) {
    if (entity.kind !== "event") continue;
    const whens = [
      ["when", entity.when] as const,
      ...entity.appearances.flatMap((a, i) =>
        a.when === undefined ? [] : [[`appearances[${String(i)}].when`, a.when] as const],
      ),
    ];
    for (const [path, when] of whens) {
      if ("start" in when) {
        checkDate(entityFile, `${path}.start`, when.start);
        checkDate(entityFile, `${path}.end`, when.end);
      } else {
        checkDate(entityFile, path, when);
      }
    }
    events.push({
      id: entity.id,
      start: resolveWhen(entity.when).start.earliest,
      seq: entity.seq,
      file: entityFile,
    });
  }

  // Events sharing a start year need `seq` to be ordered (chronology.md §3).
  const byStart = new Map<number, typeof events>();
  for (const event of events)
    byStart.set(event.start, [...(byStart.get(event.start) ?? []), event]);
  for (const group of byStart.values()) {
    if (group.length < 2) continue;
    const seqs = new Map<number, string>();
    for (const event of group) {
      if (event.seq === undefined) {
        issues.push(
          warning(
            event.file,
            "seq",
            `shares its year with ${String(group.length - 1)} other event(s); add a \`seq\``,
          ),
        );
      } else if (seqs.has(event.seq)) {
        issues.push(
          warning(
            event.file,
            "seq",
            `same \`seq\` as \`${String(seqs.get(event.seq))}\` in the same year`,
          ),
        );
      } else {
        seqs.set(event.seq, event.id);
      }
    }
  }

  return issues;
}

// ─── Research log ─────────────────────────────────────────────────────────────

function checkResearch(dataset: Dataset): Issue[] {
  const issues: Issue[] = [];
  const duplicates = (file: string, ids: readonly string[]) => {
    const seen = new Set<string>();
    ids.forEach((id, index) => {
      if (seen.has(id)) issues.push(error(file, `[${String(index)}]`, `duplicate ID \`${id}\``));
      seen.add(id);
    });
  };

  duplicates(
    REFERENCE_FILES.researchSources,
    dataset.researchSources.map((source) => source.id),
  );

  const file = REFERENCE_FILES.openQuestions;
  duplicates(
    file,
    dataset.openQuestions.map((question) => question.id),
  );
  const worlds = new Set(dataset.worlds.map((world) => world.id));
  dataset.openQuestions.forEach((question, index) => {
    const path = `[${String(index)}]`;
    question.entities?.forEach((id, i) => {
      const problem = unknownEntity(dataset, id);
      if (problem) issues.push(error(file, `${path}.entities[${String(i)}]`, problem));
    });
    question.worlds?.forEach((id, i) => {
      if (!worlds.has(id)) {
        issues.push(error(file, `${path}.worlds[${String(i)}]`, `unknown world \`${id}\``));
      }
    });
    issues.push(
      ...checkLocators(
        dataset,
        file,
        (question.sources ?? []).map(
          (s, i) => [`${path}.sources[${String(i)}]`, s] as [string, Locator],
        ),
      ),
    );
  });
  return issues;
}
