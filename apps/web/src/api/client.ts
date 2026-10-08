import createClient from "openapi-fetch";
import type { paths } from "./schema";

// Typed client generated from the API's OpenAPI document (`pnpm api:types`), so a change to the
// API that breaks the web app fails the type check.

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

// Resolve `fetch` per request (not at import), so tests can stub it.
export const api = createClient<paths>({
  baseUrl: API_URL,
  fetch: (request) => globalThis.fetch(request),
});

/** An error response from the API, e.g. `not_found` for an unknown entity. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, body: unknown) {
    const { error, message } = (body ?? {}) as { error?: string; message?: string };
    super(message ?? `Request failed (${String(status)})`);
    this.status = status;
    this.code = error ?? "unknown";
  }
}

/** Unwraps an openapi-fetch result, throwing ApiError for error responses. */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await request;
  if (error !== undefined || data === undefined) throw new ApiError(response.status, error);
  return data;
}

type Json<P extends keyof paths> = paths[P]["get"]["responses"][200]["content"]["application/json"];

export type Reference = Json<"/reference">;
export type ReferenceTitle = Reference["titles"][number];
export type Era = Reference["eras"][number];
export type Arc = Reference["arcs"][number];
export type EntityList = Json<"/entities">;
export type EntityDetail = Json<"/entities/{id}">;
export type Appearance = EntityDetail["appearances"][number];
export type Difference = EntityDetail["differences"][number];
export type Relationship = EntityDetail["relationships"][number];
export type Locator = Appearance["sources"][number];
export type Timeline = Json<"/timeline">;
export type TimelineEvent = Timeline["items"][number];
export type TimelineAppearance = TimelineEvent["appearances"][number];
export type TitleCode = ReferenceTitle["code"];
export type Comparison = Json<"/compare/{id}">;
export type ComparisonColumn = Comparison["columns"][number];
export type ComparedRelationship = Comparison["relationships"][number];
export type DisplayStatus = ComparisonColumn["status"];
export type DifferenceListItem = Json<"/differences">["items"][number];
export type DifferenceCategory = Difference["category"];
export type Network = Json<"/network/{id}">;
export type NetworkNode = Network["nodes"][number];
export type NetworkEdge = Network["edges"][number];
export type EdgeCategory = NetworkEdge["category"];
export type PathResult = Json<"/network/path">;
export type DivergenceView = Json<"/divergence/{id}">;
export type DivergencePoint = Json<"/divergence">["items"][number];
export type OpenQuestion = EntityDetail["openQuestions"][number];
export type SourceCatalogue = Json<"/sources">;
export type CatalogueTitle = SourceCatalogue["titles"][number];
export type CatalogueUnit = CatalogueTitle["units"][number];
export type SourceUnitDetail = Json<"/sources/{title}/{unit}">;
export type Research = Json<"/research">;
export type ResearchSource = Research["sources"][number];
export type Interpretation = Research["interpretations"][number];
