interface LegendItem {
  color: string;
  label: string;
  description: string;
  border?: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { color: "bg-red-500", label: "High Risk", description: "Predicted illicit probability ≥ 0.75" },
  { color: "bg-amber-400", label: "Medium Risk", description: "Probability 0.40–0.75" },
  { color: "bg-green-500", label: "Low Risk", description: "Probability < 0.40" },
  { color: "bg-slate-400", label: "Unknown Label", description: "Unlabeled — not safe", border: "border-2 border-dashed border-slate-500" },
];

export function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color} ${item.border ?? ""}`} />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{item.label}</span>
            {" — "}
            {item.description}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-400 ring-2 ring-blue-600" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Selected</span>
          {" — "}
          thick outline
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 flex-shrink-0 bg-purple-400 border-2 border-dashed border-purple-600 rotate-45" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Simulated transaction</span>
          {" — "}
          dashed purple diamond (what-if)
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-purple-500 flex-shrink-0">⇢</span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Simulated flow</span>
          {" — "}
          dashed purple edge
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full flex-shrink-0 bg-slate-300 border-2 border-amber-500/70" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Affected neighbourhood</span>
          {" — "}
          amber ring (what-if reach)
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-purple-500 font-medium flex-shrink-0">⚑</span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Needs review</span>
          {" — "}
          baseline &amp; GraphSAGE disagree
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground flex-shrink-0">→</span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Directed edge</span>
          {" — "}
          transaction flow (arrow = direction)
        </span>
      </div>
    </div>
  );
}
