"use client";

import { useQuery } from "@tanstack/react-query";
import { NodeDetailData } from "@/lib/types/api";
import { fetchJson } from "./useGraphData";

export function useNodeDetail(id: string | null) {
  return useQuery({
    queryKey: ["node", id],
    queryFn: () => fetchJson<NodeDetailData>(`/api/node/${id}`),
    enabled: Boolean(id),
  });
}
