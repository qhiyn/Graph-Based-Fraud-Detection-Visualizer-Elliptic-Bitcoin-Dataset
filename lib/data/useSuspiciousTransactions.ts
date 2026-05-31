"use client";

import { useQuery } from "@tanstack/react-query";
import { SuspiciousNode } from "@/lib/types/metrics";
import { fetchJson } from "./useGraphData";

export function useSuspiciousTransactions(limit = 12) {
  return useQuery({
    queryKey: ["suspicious", limit],
    queryFn: () => fetchJson<SuspiciousNode[]>(`/api/suspicious?limit=${limit}`),
  });
}
