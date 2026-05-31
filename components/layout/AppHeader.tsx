import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-red-500" />
          <Link href="/" className="font-semibold text-sm tracking-tight">
            Fraud Graph Visualizer
          </Link>
          <Badge variant="outline" className="text-xs">Elliptic Bitcoin</Badge>
          <Badge variant="outline" className="text-xs">GraphSAGE</Badge>
          <Badge variant="secondary" className="text-xs">Demo</Badge>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/methodology" className="hover:text-foreground transition-colors">
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
