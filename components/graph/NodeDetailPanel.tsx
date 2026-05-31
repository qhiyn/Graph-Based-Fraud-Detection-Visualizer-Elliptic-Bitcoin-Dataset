import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NodeDetailData } from "@/lib/types/api";
import { getDisagreement } from "@/lib/graph/getDisagreement";
import { NeighborhoodSummary } from "@/lib/graph/getNeighborhoodSummary";
import { ClientSimulation } from "@/lib/types/simulation";
import { Info, AlertTriangle, Loader2, FlaskConical } from "lucide-react";

interface NodeDetailPanelProps {
  detail: NodeDetailData | null;
  loading?: boolean;
  neighborhood?: NeighborhoodSummary | null;
  simulated?: ClientSimulation | null;
}

const RISK_BADGE: Record<string, "destructive" | "outline" | "secondary"> = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
};
const LABEL_COLORS: Record<string, string> = {
  illicit: "text-red-500",
  licit: "text-green-500",
  unknown: "text-slate-400",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Node Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">{children}</CardContent>
    </Card>
  );
}

export function NodeDetailPanel({ detail, loading, neighborhood, simulated }: NodeDetailPanelProps) {
  if (simulated) {
    const { node, result } = simulated;
    return (
      <Shell>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-purple-500" />
          <span className="font-medium text-purple-500">Simulated transaction</span>
          <Badge variant="outline" className="text-xs ml-auto border-purple-400 text-purple-500">what-if</Badge>
        </div>
        <div>
          <p className="text-muted-foreground">Simulated ID</p>
          <p className="font-mono font-medium">{node.id}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><p className="text-muted-foreground">Risk score</p><p className="font-medium">{(result.simulatedRiskScore * 100).toFixed(0)}%</p></div>
          <div><p className="text-muted-foreground">Risk</p><Badge variant={RISK_BADGE[result.riskLevel]} className="text-xs">{result.riskLevel}</Badge></div>
          <div><p className="text-muted-foreground">Targets</p><p className="font-medium">{result.connectedNodeIds.length}</p></div>
        </div>
        <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground">Not a real Elliptic transaction — it has <strong className="text-foreground">no true label</strong> and does not exist in the dataset.</p>
        </div>
        <div className="border-t border-border pt-2">
          <p className="text-muted-foreground mb-1.5">Explanation</p>
          <ul className="space-y-1">
            {result.explanation.map((b, i) => <li key={i} className="flex gap-1.5"><span className="text-muted-foreground mt-0.5">•</span><span>{b}</span></li>)}
          </ul>
        </div>
        <p className="text-[11px] text-muted-foreground/70 border-t border-border pt-2">{result.disclaimer}</p>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading node…
        </div>
      </Shell>
    );
  }
  if (!detail) {
    return (
      <Shell>
        <p className="text-muted-foreground">Click a transaction node in the graph (or a row in the table) to inspect its details.</p>
      </Shell>
    );
  }

  const pct = (v?: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);
  const dis = getDisagreement(detail.baselineProbability, detail.gnnProbability);

  return (
    <Shell>
      <div>
        <p className="text-muted-foreground">Transaction ID</p>
        <p className="font-mono font-medium">{detail.id}</p>
      </div>

      {!detail.knownLabel && (
        <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground">Unlabeled transaction — <strong className="text-foreground">unknown is not the same as safe</strong>.</p>
        </div>
      )}

      {dis.disagree && (
        <Badge variant="outline" className="text-xs border-purple-400 text-purple-500">
          ⚑ Needs analyst review · {dis.label}
        </Badge>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-muted-foreground">True Label</p>
          <p className={`font-medium ${LABEL_COLORS[detail.trueLabel]}`}>
            {detail.trueLabel}{!detail.knownLabel && <span className="text-muted-foreground"> (unlabeled)</span>}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Predicted</p>
          <p className={`font-medium ${LABEL_COLORS[detail.predictedLabel]}`}>{detail.predictedLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-muted-foreground">Baseline</p>
          <p className="font-medium">{pct(detail.baselineProbability)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">GraphSAGE</p>
          <p className="font-medium">{pct(detail.gnnProbability ?? detail.fraudProbability)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Risk</p>
          <Badge variant={RISK_BADGE[detail.riskLevel]} className="text-xs">{detail.riskLevel}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div><p className="text-muted-foreground">Step</p><p className="font-medium">{detail.timeStep}</p></div>
        <div><p className="text-muted-foreground">Deg</p><p className="font-medium">{detail.degree}</p></div>
        <div><p className="text-muted-foreground">In</p><p className="font-medium">{detail.inDegree}</p></div>
        <div><p className="text-muted-foreground">Out</p><p className="font-medium">{detail.outDegree}</p></div>
      </div>

      {neighborhood && (
        <div className="border-t border-border pt-2">
          <p className="text-muted-foreground mb-1.5">Neighborhood</p>
          <div className="grid grid-cols-3 gap-2">
            <div><p className="text-muted-foreground">1-hop</p><p className="font-medium">{neighborhood.oneHop}</p></div>
            <div><p className="text-muted-foreground">2-hop</p><p className="font-medium">{neighborhood.twoHop}</p></div>
            <div><p className="text-muted-foreground">High-risk</p><p className="font-medium text-red-500">{neighborhood.highRisk}</p></div>
            <div><p className="text-muted-foreground">Illicit nbrs</p><p className="font-medium text-red-500">{neighborhood.illicit}</p></div>
            <div><p className="text-muted-foreground">Unknown nbrs</p><p className="font-medium text-slate-400">{neighborhood.unknown}</p></div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-1.5 leading-snug">
            GraphSAGE uses neighboring transaction structure to estimate risk, but this is still a model prediction.
          </p>
        </div>
      )}

      <div className="border-t border-border pt-2">
        <p className="text-muted-foreground mb-1.5">Explanation</p>
        <ul className="space-y-1">
          {detail.explanation.map((b, i) => (
            <li key={i} className="flex gap-1.5"><span className="text-muted-foreground mt-0.5">•</span><span>{b}</span></li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-muted-foreground/70 border-t border-border pt-2">
        This is a model prediction, not a confirmed fraud label.
      </p>
    </Shell>
  );
}
