import { AppHeader } from "@/components/layout/AppHeader";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "dataset",
    title: "Dataset",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          This project uses the <strong className="text-foreground">Elliptic Bitcoin Dataset</strong>, a
          publicly available graph-based financial fraud benchmark. It contains 203,769 Bitcoin
          transaction nodes and 234,355 directed transaction-flow edges collected over 49 time steps.
        </p>
        <p>
          Each node has 166 features: 94 local features (transaction amount, fees, input/output counts)
          and 72 aggregated neighborhood features. Labels are assigned to 46,564 nodes:
          4,545 illicit and 42,019 licit. The remaining 157,205 nodes are unlabeled.
        </p>
        <p className="text-amber-600 dark:text-amber-400">
          Unknown labels are not safe. They are unlabeled transactions — not confirmed licit.
        </p>
      </div>
    ),
  },
  {
    id: "graph",
    title: "Graph Representation",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          The dataset is modeled as a directed graph where:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong className="text-foreground">Nodes</strong> represent Bitcoin transactions.</li>
          <li><strong className="text-foreground">Edges</strong> represent directed transaction-flow relationships (one transaction funding another).</li>
          <li><strong className="text-foreground">Labels</strong> are licit, illicit, or unknown.</li>
        </ul>
        <p>
          The dashboard visualizes a sampled subgraph of 300–1,500 nodes centered on high-risk
          transactions and their local neighborhoods. The full graph is too large to render in a browser.
        </p>
      </div>
    ),
  },
  {
    id: "ml",
    title: "ML Approach",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Baseline:</strong> Logistic Regression trained on node
          features only, without graph structure. Provides a non-graph reference point.
        </p>
        <p>
          <strong className="text-foreground">GNN:</strong> GraphSAGE (Hamilton et al., 2017) performs
          inductive node classification by aggregating neighborhood features. It is trained using
          cross-entropy loss on known labeled nodes only. Unknown nodes participate in message passing
          but do not contribute to the supervised loss.
        </p>
        <p>
          Training uses a time-aware split where earlier time steps are used for training and later
          steps for validation and testing, to avoid temporal leakage.
        </p>
        <p>
          The trained model runs offline. The dashboard consumes precomputed JSON predictions — no
          PyTorch or Python is required at runtime.
        </p>
      </div>
    ),
  },
  {
    id: "evaluation",
    title: "Evaluation",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Evaluation metrics used:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong className="text-foreground">ROC-AUC</strong> — overall discrimination ability.</li>
          <li><strong className="text-foreground">F1-score</strong> — harmonic mean of precision and recall.</li>
          <li><strong className="text-foreground">Precision / Recall</strong> — especially important for imbalanced fraud data.</li>
          <li><strong className="text-foreground">Precision@K</strong> — fraction of true illicit transactions in the top-K ranked predictions. Critical for fraud investigation workflows.</li>
          <li><strong className="text-foreground">Confusion matrix</strong> — true/false positive and negative counts.</li>
        </ul>
        <p>
          Evaluation is performed only on known labeled nodes. Unknown nodes are excluded from
          metric computation.
        </p>
        <p className="font-medium text-foreground pt-1">Baseline vs GraphSAGE (test split):</p>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr className="text-left">
                <th className="pr-4 py-1">Metric</th>
                <th className="pr-4 py-1">Logistic Regression</th>
                <th className="pr-4 py-1">GraphSAGE</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr><td className="pr-4 py-0.5">ROC-AUC</td><td className="pr-4 text-foreground font-medium">0.855</td><td className="pr-4">0.796</td></tr>
              <tr><td className="pr-4 py-0.5">Average Precision</td><td className="pr-4">0.200</td><td className="pr-4 text-foreground font-medium">0.429</td></tr>
              <tr><td className="pr-4 py-0.5">Precision@50</td><td className="pr-4">0.06</td><td className="pr-4 text-foreground font-medium">0.94</td></tr>
              <tr><td className="pr-4 py-0.5">Precision@100</td><td className="pr-4">0.15</td><td className="pr-4 text-foreground font-medium">0.89</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong className="text-foreground">Honest interpretation:</strong> Logistic Regression has the higher
          ROC-AUC, but GraphSAGE is far stronger at Average Precision and Precision@K — the metrics that matter when
          analysts review a limited number of top-ranked transactions. At the top 50, GraphSAGE finds ~94% truly
          illicit versus ~6% for the baseline. ROC-AUC is a weak signal on heavily imbalanced data, so the ranking
          improvement is the headline result.
        </p>
      </div>
    ),
  },
  {
    id: "simulation",
    title: "Simulation Mode",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          Simulation mode allows injecting a hypothetical transaction node connected to selected
          existing nodes. The risk score is estimated using a lightweight heuristic formula:
        </p>
        <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
{`simulatedRisk =
  0.45 × averageNeighborRisk
+ 0.25 × highRiskNeighborRatio
+ 0.15 × predictedIllicitNeighborRatio
+ 0.10 × timeStepRiskFactor
+ 0.05 × degreeGrowthFactor`}
        </pre>
        <p>
          The score is clamped between 0 and 1. This is a heuristic approximation — it does not
          retrain the GNN and should be interpreted as a what-if analysis only.
        </p>
      </div>
    ),
  },
  {
    id: "limitations",
    title: "Limitations",
    content: (
      <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
        <li>The model is trained on benchmark data, not live blockchain monitoring.</li>
        <li>Unknown labels are not ground-truth normal transactions.</li>
        <li>Performance depends on the dataset split strategy.</li>
        <li>The dashboard graph is a sampled subgraph — not the full Elliptic graph.</li>
        <li>Predictions indicate risk patterns, not proof of wrongdoing.</li>
        <li>The deployed version uses precomputed predictions — no live inference.</li>
        <li>GraphSAGE is a strong baseline GNN but not the state of the art for this dataset.</li>
      </ul>
    ),
  },
  {
    id: "ethics",
    title: "Ethical Note",
    content: (
      <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          This dashboard is for <strong className="text-foreground">educational and portfolio demonstration purposes only</strong>.
          Model predictions indicate risk patterns in benchmark data and should not be interpreted as
          proof of illegal activity. The Elliptic dataset is a research benchmark — it does not
          represent a production fraud enforcement system. Do not use this tool to make real-world
          financial or legal decisions.
        </p>
      </div>
    ),
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3 text-xs">Technical Documentation</Badge>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Methodology</h1>
          <p className="text-muted-foreground">
            How the Elliptic Bitcoin dataset is processed, how the GNN model is trained,
            and how the dashboard visualizes precomputed predictions.
          </p>
        </div>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-border">
                {section.title}
              </h2>
              {section.content}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
