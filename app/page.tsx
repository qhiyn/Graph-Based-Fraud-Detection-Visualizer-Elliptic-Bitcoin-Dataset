import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Network,
  ShieldAlert,
  BarChart3,
  FlaskConical,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

const TECH_STACK = [
  "Next.js", "TypeScript", "Cytoscape.js", "GraphSAGE",
  "PyTorch Geometric", "Recharts", "Tailwind CSS", "Vercel",
];

const FEATURES = [
  {
    icon: Network,
    title: "Interactive Transaction Graph",
    description:
      "Explore the Elliptic Bitcoin transaction graph. Each node is a Bitcoin transaction; each edge is a directed transaction-flow relationship.",
  },
  {
    icon: ShieldAlert,
    title: "GNN Risk Scoring",
    description:
      "A GraphSAGE model trained on the Elliptic benchmark predicts illicit probability for each transaction using graph neighborhood signals.",
  },
  {
    icon: BarChart3,
    title: "Model Evaluation",
    description:
      "Compare GraphSAGE against a Logistic Regression baseline using ROC-AUC, F1, Precision@K, and confusion matrix.",
  },
  {
    icon: FlaskConical,
    title: "Simulation Mode",
    description:
      "Inject a hypothetical transaction node and estimate its risk score using a neighbor-risk heuristic — no GNN retraining required.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <Badge variant="outline" className="mb-4 text-xs">
          Elliptic Bitcoin Dataset · GraphSAGE · Vercel
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Interactive Graph-Based Bitcoin
          <br />
          <span className="text-red-500">Fraud Detection</span> Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Visualize precomputed Graph Neural Network fraud-risk predictions on the Elliptic
          Bitcoin transaction graph. Explore suspicious transaction neighborhoods, inspect
          node-level predictions, and compare model performance.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/methodology"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Methodology
          </Link>
        </div>

        {/* Headline result */}
        <div className="mt-10 max-w-2xl mx-auto rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-sm">
            <strong className="text-foreground">GraphSAGE improved Precision@50 from 0.06 to 0.94</strong>{" "}
            <span className="text-muted-foreground">compared with the Logistic Regression baseline</span> —
            dramatically better prioritization of the most suspicious transactions.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Shown honestly: the Logistic Regression baseline has a higher ROC-AUC (0.855 vs 0.796), but ROC-AUC is a
            weak signal on imbalanced fraud data. Ranking quality — Average Precision and Precision@K — is what matters
            for analyst review.
          </p>
        </div>
      </section>

      {/* Dataset explanation */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-muted/40 rounded-xl p-6 border border-border">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Network className="h-4 w-4" />
            About the Elliptic Bitcoin Dataset
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">Nodes</p>
              <p>203,769 Bitcoin transactions, each with 166 features including local graph statistics and time-step information.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Edges</p>
              <p>234,355 directed transaction-flow relationships between transactions.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Labels</p>
              <p>
                <span className="text-red-500 font-medium">Illicit</span> (4,545) ·{" "}
                <span className="text-green-500 font-medium">Licit</span> (42,019) ·{" "}
                <span className="text-slate-400 font-medium">Unknown</span> (157,205 — not safe)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold mb-6 text-center">Dashboard Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <p className="text-sm text-muted-foreground mb-3">Built with</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {TECH_STACK.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
        </div>
      </section>

      {/* Limitations note */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <strong className="text-foreground">Educational project.</strong>{" "}
            This dashboard is for portfolio demonstration purposes only. Model predictions indicate
            risk patterns in benchmark data and should not be interpreted as proof of illegal activity.
            Unknown labels are unlabeled transactions — they are not confirmed safe.
          </p>
        </div>
      </section>
    </div>
  );
}
