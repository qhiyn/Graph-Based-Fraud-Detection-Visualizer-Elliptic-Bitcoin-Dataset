"use client";

import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface ConnectionSelectorProps {
  targets: string[];
  stats: { avgRisk: number; highRisk: number; unknown: number };
  canAddSelected: boolean;
  canAddHighRisk: boolean;
  canAddSuspicious: boolean;
  onAddSelected: () => void;
  onAddHighRisk: () => void;
  onAddSuspicious: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function AddButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs text-blue-500 hover:underline disabled:text-muted-foreground/40 flex items-center gap-1"
    >
      <Plus className="h-3 w-3" /> {label}
    </button>
  );
}

export function ConnectionSelector(p: ConnectionSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-foreground">Connection targets ({p.targets.length})</p>
        {p.targets.length > 0 && (
          <button onClick={p.onClear} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <AddButton label="Selected" disabled={!p.canAddSelected} onClick={p.onAddSelected} />
        <AddButton label="Visible high-risk" disabled={!p.canAddHighRisk} onClick={p.onAddHighRisk} />
        <AddButton label="Top suspicious" disabled={!p.canAddSuspicious} onClick={p.onAddSuspicious} />
      </div>

      {p.targets.length === 0 ? (
        <p className="text-muted-foreground/60">Select a node in the graph, then add targets above.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {p.targets.map((id) => (
              <Badge key={id} variant="secondary" className="text-xs font-mono gap-1">
                {id.replace(/^tx_/, "")}
                <button onClick={() => p.onRemove(id)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div><p className="text-muted-foreground">Avg risk</p><p className="font-medium">{(p.stats.avgRisk * 100).toFixed(0)}%</p></div>
            <div><p className="text-muted-foreground">High-risk</p><p className="font-medium text-red-500">{p.stats.highRisk}</p></div>
            <div><p className="text-muted-foreground">Unknown</p><p className="font-medium text-slate-400">{p.stats.unknown}</p></div>
          </div>
        </>
      )}
    </div>
  );
}
