import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { type DifferenceCategory, type EdgeCategory, type TitleCode, api, unwrap } from "./client";

// Server state (TanStack Query). The data only changes when the dataset is redeployed, so answers
// are cached for the whole visit.

export function useReference() {
  return useQuery({
    queryKey: ["reference"],
    queryFn: () => unwrap(api.GET("/reference")),
    staleTime: Infinity,
  });
}

export function useEntities() {
  return useQuery({
    queryKey: ["entities"],
    queryFn: () => unwrap(api.GET("/entities")),
  });
}

export function useTimeline(titles: readonly TitleCode[]) {
  const param = titles.join(",");
  return useQuery({
    queryKey: ["timeline", param],
    queryFn: () => unwrap(api.GET("/timeline", { params: { query: { titles: param } } })),
    enabled: titles.length > 0,
    // Keep showing the previous lanes while a title toggle loads, so the chart doesn't flash.
    placeholderData: keepPreviousData,
  });
}

export function useSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => unwrap(api.GET("/search", { params: { query: { q: query, limit: 20 } } })),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
  });
}

export function useComparison(id: string | undefined, titles: readonly TitleCode[]) {
  const param = titles.join(",");
  return useQuery({
    queryKey: ["compare", id, param],
    queryFn: () =>
      unwrap(
        api.GET("/compare/{id}", {
          params: { path: { id: id ?? "" }, query: { titles: param } },
        }),
      ),
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useDifferences(filters: {
  titles: readonly TitleCode[];
  category?: DifferenceCategory | undefined;
  magnitude?: "minor" | "major" | undefined;
}) {
  const titles = filters.titles.join(",");
  const { category, magnitude } = filters;
  return useQuery({
    queryKey: ["differences", titles, category, magnitude],
    queryFn: () =>
      unwrap(
        api.GET("/differences", {
          params: {
            query: {
              titles,
              ...(category ? { category } : {}),
              ...(magnitude ? { magnitude } : {}),
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

interface NetworkFilter {
  titles: readonly TitleCode[];
  categories: readonly EdgeCategory[];
}

function networkQuery(id: string, depth: number, { titles, categories }: NetworkFilter) {
  const query = { depth, titles: titles.join(","), categories: categories.join(",") };
  return {
    queryKey: ["network", id, query],
    queryFn: () => unwrap(api.GET("/network/{id}", { params: { path: { id }, query } })),
    retry: false,
  };
}

export function useNetwork(id: string | undefined, depth: number, filter: NetworkFilter) {
  return useQuery({
    ...networkQuery(id ?? "", depth, filter),
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
  });
}

/** Keeps the loaded results; a stable function, so TanStack Query can keep the array stable. */
function loaded<T>(results: readonly { data?: T | undefined }[]): T[] {
  return results.flatMap((result) => (result.data === undefined ? [] : [result.data]));
}

/** One-step neighbourhoods of expanded entities, added to the main view (loaded ones only). */
export function useNetworkExpansions(ids: readonly string[], filter: NetworkFilter) {
  return useQueries({ queries: ids.map((id) => networkQuery(id, 1, filter)), combine: loaded });
}

export function usePath(from: string | undefined, to: string | null, filter: NetworkFilter) {
  const query = {
    from: from ?? "",
    to: to ?? "",
    titles: filter.titles.join(","),
    categories: filter.categories.join(","),
  };
  return useQuery({
    queryKey: ["path", query],
    queryFn: () => unwrap(api.GET("/network/path", { params: { query } })),
    enabled: from !== undefined && to !== null,
    retry: false,
  });
}

export function useNetworkMetrics(titles: readonly TitleCode[]) {
  const param = titles.join(",");
  return useQuery({
    queryKey: ["metrics", param],
    queryFn: () => unwrap(api.GET("/network/metrics", { params: { query: { titles: param } } })),
    placeholderData: keepPreviousData,
  });
}

export function useEntity(id: string | undefined) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => unwrap(api.GET("/entities/{id}", { params: { path: { id: id ?? "" } } })),
    enabled: id !== undefined,
    retry: false,
  });
}

export function useDivergencePoints(titles: readonly TitleCode[]) {
  const param = titles.join(",");
  return useQuery({
    queryKey: ["divergence", param],
    queryFn: () => unwrap(api.GET("/divergence", { params: { query: { titles: param } } })),
    placeholderData: keepPreviousData,
  });
}

export function useDivergence(
  id: string | undefined,
  titles: readonly TitleCode[],
  worlds: boolean,
) {
  const query = { titles: titles.join(","), worlds: String(worlds) };
  return useQuery({
    queryKey: ["divergence", id, query],
    queryFn: () =>
      unwrap(api.GET("/divergence/{id}", { params: { path: { id: id ?? "" }, query } })),
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: () => unwrap(api.GET("/sources")),
    staleTime: Infinity,
  });
}

export function useSourceUnit(title: TitleCode | undefined, unit: string | undefined) {
  return useQuery({
    queryKey: ["sources", title, unit],
    queryFn: () =>
      unwrap(
        api.GET("/sources/{title}/{unit}", {
          params: { path: { title: title ?? "og", unit: unit ?? "" } },
        }),
      ),
    enabled: title !== undefined && unit !== undefined,
    retry: false,
  });
}

export function useResearch() {
  return useQuery({
    queryKey: ["research"],
    queryFn: () => unwrap(api.GET("/research")),
    staleTime: Infinity,
  });
}
