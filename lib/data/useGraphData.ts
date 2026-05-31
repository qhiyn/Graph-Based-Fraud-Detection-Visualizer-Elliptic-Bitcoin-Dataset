"use client";

import { useQuery } from "@tanstack/react-query";
import { GraphData } from "@/lib/types/graph";
import { ApiResponse } from "@/lib/types/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) throw new Error(body.error.message);
  return body.data;
}

export { fetchJson };

export function useGraphData() {
  return useQuery({ queryKey: ["graph"], queryFn: () => fetchJson<GraphData>("/api/graph") });
}
