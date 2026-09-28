import {
  type Arcs,
  ArcsSchema,
  type Coverage,
  CoverageSchema,
  type Edge,
  ENTITY_FILE_KINDS,
  type Entity,
  type Eras,
  ErasSchema,
  type FileEntityKind,
  type IdRedirects,
  IdRedirectsSchema,
  type OgSegments,
  OgSegmentsSchema,
  type Worlds,
  WorldsSchema,
} from "@ffvii/shared";
import { parseDocument } from "yaml";
import type { z } from "zod";
import { type Issue, formatPath } from "./issues.ts";

export interface SourceFile {
  /** Relative to the data folder, with forward slashes, e.g. `characters/character_x.yaml`. */
  path: string;
  content: string;
}

export interface LoadedEntity {
  entity: Entity;
  file: string;
}

export interface LoadedEdge {
  edge: Edge;
  file: string;
  /** Position in the file's `relationships` list, for error messages. */
  index: number;
}

export interface Dataset {
  entities: Map<string, LoadedEntity>;
  edges: LoadedEdge[];
  segments: OgSegments;
  coverage: Coverage;
  arcs: Arcs;
  eras: Eras;
  worlds: Worlds;
  redirects: IdRedirects;
}

export const REFERENCE_FILES = {
  segments: "reference/og-segments.yaml",
  coverage: "reference/coverage.yaml",
  arcs: "reference/arcs.yaml",
  eras: "reference/eras.yaml",
  worlds: "reference/worlds.yaml",
  redirects: "id-redirects.yaml",
} as const;

const KIND_BY_FOLDER = new Map<string, FileEntityKind>(
  Object.entries(ENTITY_FILE_KINDS).map(([kind, { folder }]) => [folder, kind as FileEntityKind]),
);

/** Parses and schema-checks every data file. Cross-file rules live in `validateDataset`. */
export function loadDataset(files: readonly SourceFile[]): { dataset: Dataset; issues: Issue[] } {
  const issues: Issue[] = [];
  const dataset: Dataset = {
    entities: new Map(),
    edges: [],
    segments: [],
    coverage: {},
    arcs: [],
    eras: [],
    worlds: [],
    redirects: {},
  };
  const seenReference = new Set<string>();

  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const error = (message: string) => issues.push({ level: "error", file: file.path, message });

    if (!file.path.endsWith(".yaml")) {
      error("data files must use the `.yaml` extension");
      continue;
    }

    seenReference.add(file.path);
    switch (file.path) {
      case REFERENCE_FILES.segments:
        dataset.segments = parseFile(file, OgSegmentsSchema, issues) ?? [];
        continue;
      case REFERENCE_FILES.coverage:
        dataset.coverage = parseFile(file, CoverageSchema, issues) ?? {};
        continue;
      case REFERENCE_FILES.arcs:
        dataset.arcs = parseFile(file, ArcsSchema, issues) ?? [];
        continue;
      case REFERENCE_FILES.eras:
        dataset.eras = parseFile(file, ErasSchema, issues) ?? [];
        continue;
      case REFERENCE_FILES.worlds:
        dataset.worlds = parseFile(file, WorldsSchema, issues) ?? [];
        continue;
      case REFERENCE_FILES.redirects:
        dataset.redirects = parseFile(file, IdRedirectsSchema, issues) ?? {};
        continue;
    }

    const [folder, name, ...rest] = file.path.split("/");
    const kind = folder === undefined ? undefined : KIND_BY_FOLDER.get(folder);
    if (kind === undefined || name === undefined || rest.length > 0) {
      error("unexpected file — entities go in `<kind folder>/<id>.yaml`");
      continue;
    }

    const parsed = parseFile(file, ENTITY_FILE_KINDS[kind].schema, issues);
    if (parsed === undefined) continue;

    if (name !== `${parsed.id}.yaml`) {
      error(`file name must match the ID: rename to \`${parsed.id}.yaml\``);
      continue;
    }
    const existing = dataset.entities.get(parsed.id);
    if (existing) {
      error(`duplicate ID \`${parsed.id}\` (also in ${existing.file})`);
      continue;
    }

    const entity = { kind, ...parsed } as Entity;
    dataset.entities.set(entity.id, { entity, file: file.path });
    entity.relationships.forEach((edge, index) => {
      dataset.edges.push({ edge: { ...edge, source: entity.id }, file: file.path, index });
    });
  }

  for (const path of Object.values(REFERENCE_FILES)) {
    if (path !== REFERENCE_FILES.redirects && !seenReference.has(path)) {
      issues.push({ level: "error", file: path, message: "required reference file is missing" });
    }
  }

  return { dataset, issues };
}

function parseFile<S extends z.ZodType>(
  file: SourceFile,
  schema: S,
  issues: Issue[],
): z.output<S> | undefined {
  const document = parseDocument(file.content);
  if (document.errors.length > 0) {
    for (const yamlError of document.errors) {
      issues.push({ level: "error", file: file.path, message: yamlError.message });
    }
    return undefined;
  }

  const result = schema.safeParse(document.toJS());
  if (!result.success) {
    for (const zodIssue of result.error.issues) {
      issues.push({
        level: "error",
        file: file.path,
        path: formatPath(zodIssue.path),
        message: zodIssue.message,
      });
    }
    return undefined;
  }
  return result.data;
}
