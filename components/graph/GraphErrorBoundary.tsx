"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

// Catches runtime errors thrown while rendering the Cytoscape graph so a
// rendering failure degrades gracefully instead of crashing the dashboard.
export class GraphErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
          <AlertTriangle className="h-10 w-10 text-amber-500/60 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Graph could not be rendered</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try reloading the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
