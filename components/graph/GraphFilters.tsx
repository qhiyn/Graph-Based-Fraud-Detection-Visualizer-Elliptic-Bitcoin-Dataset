"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";
import {
  DashboardFilters,
  ALL_RISK_LEVELS,
  ALL_CLASS_LABELS,
  DEFAULT_FILTERS,
  normalizeDashboardFilters,
} from "@/lib/graph/filterGraph";
import { RiskLevel, TransactionLabel } from "@/lib/types/graph";

interface GraphFiltersProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  timeSteps: number[];
}

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function formatProbabilityPercent(value: unknown): string {
  const numeric =
    typeof value === "number" && Number.isFinite(value) ? value : 0;

  return `${Math.round(numeric * 100)}%`;
}

const RISK_VARIANT: Record<RiskLevel, "destructive" | "outline" | "secondary"> = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
};

export function GraphFilters({ filters, onChange, timeSteps }: GraphFiltersProps) {
  const normalizedFilters = normalizeDashboardFilters(filters);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
        <button
          onClick={() =>
            onChange({
              ...DEFAULT_FILTERS,
              riskLevels: [...ALL_RISK_LEVELS],
              classLabels: [...ALL_CLASS_LABELS],
            })
          }
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div>
          <p className="font-medium text-foreground mb-1.5">Risk Level</p>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_RISK_LEVELS.map((r) => {
              const active = normalizedFilters.riskLevels.includes(r);
              return (
                <Badge
                  key={r}
                  variant={active ? RISK_VARIANT[r] : "outline"}
                  className={`cursor-pointer text-xs capitalize ${active ? "" : "opacity-40"}`}
                  onClick={() =>
                    onChange({
                      ...normalizedFilters,
                      riskLevels: toggle(normalizedFilters.riskLevels, r),
                    })
                  }
                >
                  {r}
                </Badge>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-medium text-foreground mb-1.5">Class Label</p>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_CLASS_LABELS.map((l: TransactionLabel) => {
              const active = normalizedFilters.classLabels.includes(l);
              return (
                <Badge
                  key={l}
                  variant={active ? "secondary" : "outline"}
                  className={`cursor-pointer text-xs capitalize ${active ? "" : "opacity-40"}`}
                  onClick={() =>
                    onChange({
                      ...normalizedFilters,
                      classLabels: toggle(normalizedFilters.classLabels, l),
                    })
                  }
                >
                  {l}
                </Badge>
              );
            })}
          </div>
          <p className="text-muted-foreground/60 mt-1">Unknown = unlabeled, not safe.</p>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <p className="font-medium text-foreground">Min Fraud Probability</p>
            <span className="text-muted-foreground">
              {formatProbabilityPercent(normalizedFilters.minFraudProbability)}
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[normalizedFilters.minFraudProbability]}
            onValueChange={(value) => {
              const nextValue = Array.isArray(value) ? value[0] : value;
              const safeValue =
                typeof nextValue === "number" && Number.isFinite(nextValue)
                  ? nextValue
                  : 0;

              onChange({ ...normalizedFilters, minFraudProbability: safeValue });
            }}
          />
        </div>

        <div>
          <p className="font-medium text-foreground mb-1.5">Time Step</p>
          <Select
            value={normalizedFilters.timeStep === null ? "all" : String(normalizedFilters.timeStep)}
            onValueChange={(v) =>
              onChange({
                ...normalizedFilters,
                timeStep: v === "all" ? null : Number(v),
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All time steps</SelectItem>
              {timeSteps.map((t) => (
                <SelectItem key={t} value={String(t)} className="text-xs">
                  Step {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
