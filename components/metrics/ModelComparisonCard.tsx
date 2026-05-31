import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModelMetrics } from "@/lib/types/metrics";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ModelComparisonCardProps {
  baseline: ModelMetrics;
  gnn: ModelMetrics;
  note?: string;
}

// "higher is better": green ↑ when GNN wins, amber ↓ when it loses (shown
// honestly — the ROC-AUC drop is not hidden).
function Row({ label, b, g, hint }: { label: string; b?: number; g?: number; hint?: string }) {
  const bv = b ?? 0;
  const gv = g ?? 0;
  const delta = gv - bv;
  const Icon = delta > 0.001 ? ArrowUp : delta < -0.001 ? ArrowDown : Minus;
  const color = delta > 0.001 ? "text-green-500" : delta < -0.001 ? "text-amber-500" : "text-muted-foreground";
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-center text-sm py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">
        {label}
        {hint && <span className="block text-[10px] text-muted-foreground/60">{hint}</span>}
      </span>
      <span className="text-center tabular-nums">{bv.toFixed(3)}</span>
      <span className="text-center font-medium tabular-nums">{gv.toFixed(3)}</span>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
    </div>
  );
}

export function ModelComparisonCard({ baseline, gnn, note }: ModelComparisonCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Baseline vs GraphSAGE</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] text-xs text-muted-foreground pb-2 border-b border-border mb-1">
          <span>Metric</span>
          <span className="text-center"><Badge variant="outline" className="text-xs">{baseline.name}</Badge></span>
          <span className="text-center"><Badge variant="secondary" className="text-xs">{gnn.name}</Badge></span>
          <span />
        </div>

        <Row label="ROC-AUC" hint="overall ranking — tradeoff" b={baseline.rocAuc} g={gnn.rocAuc} />
        <Row label="Average Precision" hint="imbalanced fraud" b={baseline.averagePrecision} g={gnn.averagePrecision} />
        <Row label="Precision@50" hint="top-50 reviewed first" b={baseline.precisionAtK?.k50} g={gnn.precisionAtK?.k50} />
        <Row label="Precision@100" b={baseline.precisionAtK?.k100} g={gnn.precisionAtK?.k100} />
        <Row label="F1" b={baseline.f1} g={gnn.f1} />

        <p className="text-[11px] text-muted-foreground mt-3 leading-snug">
          GraphSAGE adds graph-neighbourhood structure on top of the transaction features. Its
          ROC-AUC is slightly lower, but it is far stronger at <strong className="text-foreground">prioritisation</strong>—
          much higher Average Precision and Precision@K. Analysts review a limited number of top-ranked
          transactions, so better ranking matters more than raw ROC-AUC here.
        </p>
        {note && <p className="text-[11px] text-muted-foreground/70 mt-2 leading-snug">{note}</p>}
      </CardContent>
    </Card>
  );
}
