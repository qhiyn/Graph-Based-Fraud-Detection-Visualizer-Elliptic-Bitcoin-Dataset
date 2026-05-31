import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClusterSummaryCardProps {
  totalNodes: number;
  illicitCount: number;
  licitCount: number;
  unknownCount: number;
  highRiskCount: number;
}

export function ClusterSummaryCard({
  totalNodes,
  illicitCount,
  licitCount,
  unknownCount,
  highRiskCount,
}: ClusterSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Graph Sample Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total nodes</span>
          <span className="font-medium">{totalNodes.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Illicit</span>
          <Badge variant="destructive" className="text-xs">{illicitCount}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Licit</span>
          <Badge variant="secondary" className="text-xs">{licitCount}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Unknown</span>
          <Badge variant="outline" className="text-xs">{unknownCount}</Badge>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-muted-foreground">High-risk predicted</span>
          <span className="font-medium text-red-500">{highRiskCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}
