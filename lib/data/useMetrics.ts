"use client";

import { useQuery } from "@tanstack/react-query";
import { MetricsData } from "@/lib/types/metrics";
import { fetchJson } from "./useGraphData";

export function useMetrics() {
  return useQuery({ queryKey: ["metrics"], queryFn: () => fetchJson<MetricsData>("/api/metrics") });
}
