import { MetricsData } from "@/lib/types/metrics";
import { readJsonFile } from "./readJsonFile";

export function getMetrics(): Promise<MetricsData> {
  return readJsonFile<MetricsData>("metrics.json");
}
