"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraphViewMode } from "@/lib/graph/buildGraphView";
import { Crosshair, ShieldAlert, RotateCcw } from "lucide-react";

interface GraphToolbarProps {
  mode: GraphViewMode;
  onModeChange: (m: GraphViewMode) => void;
  hop: 1 | 2;
  onHopChange: (h: 1 | 2) => void;
  timeStep: number | null;
  onTimeStepChange: (t: number) => void;
  timeSteps: number[];
  selectedNodeId: string | null;
  visibleNodes: number;
  visibleEdges: number;
  truncated: boolean;
  onReset: () => void;
}

const MODE_LABELS: Record<GraphViewMode, string> = {
  all: "All transactions",
  "high-risk": "High-risk only",
  "selected-node-neighborhood": "Selected neighborhood",
  "selected-time-step": "Time step",
  "suspicious-region": "Suspicious region",
  "simulated-region": "Simulated region",
};

export function GraphToolbar(p: GraphToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Select value={p.mode} onValueChange={(v) => p.onModeChange(v as GraphViewMode)}>
        <SelectTrigger className="h-8 text-xs w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(MODE_LABELS) as GraphViewMode[]).map((m) => (
            <SelectItem key={m} value={m} className="text-xs">{MODE_LABELS[m]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* hop toggle — relevant to neighborhood mode */}
      <div className="flex gap-1">
        {([1, 2] as const).map((h) => (
          <Badge
            key={h}
            variant={p.hop === h ? "secondary" : "outline"}
            className={`cursor-pointer text-xs ${p.hop === h ? "" : "opacity-50"}`}
            onClick={() => p.onHopChange(h)}
          >
            {h}-hop
          </Badge>
        ))}
      </div>

      <Button
        size="sm" variant="outline" className="h-8 text-xs"
        disabled={!p.selectedNodeId}
        onClick={() => p.onModeChange("selected-node-neighborhood")}
      >
        <Crosshair className="h-3 w-3 mr-1" /> Focus selected
      </Button>

      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => p.onModeChange("high-risk")}>
        <ShieldAlert className="h-3 w-3 mr-1" /> High-risk
      </Button>

      <Select
        value={p.mode === "selected-time-step" && p.timeStep != null ? String(p.timeStep) : ""}
        onValueChange={(v) => p.onTimeStepChange(Number(v))}
      >
        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Time step…" /></SelectTrigger>
        <SelectContent>
          {p.timeSteps.map((t) => (
            <SelectItem key={t} value={String(t)} className="text-xs">Step {t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={p.onReset}>
        <RotateCcw className="h-3 w-3 mr-1" /> Reset
      </Button>

      <span className="ml-auto text-muted-foreground">
        {p.visibleNodes} nodes · {p.visibleEdges} edges{p.truncated && " (capped)"}
      </span>
    </div>
  );
}
