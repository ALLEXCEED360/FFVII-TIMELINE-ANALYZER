import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type DifferenceCategory, type TitleCode, api, unwrap } from "./client";

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

export function useEntity(id: string | undefined) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => unwrap(api.GET("/entities/{id}", { params: { path: { id: id ?? "" } } })),
    enabled: id !== undefined,
    retry: false,
  });
}
