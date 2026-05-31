"use client";

// FraudGraph renders the interactive Cytoscape.js transaction graph.
//
// Cytoscape.js accesses the DOM directly and cannot run during SSR, so the
// react-cytoscapejs component is loaded via next/dynamic with { ssr: false }.
// This file is a Client Component ("use client"), which is required for
// ssr:false dynamic imports in the App Router.

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type cytoscape from "cytoscape";
import type { ElementDefinition } from "cytoscape";
import { Network } from "lucide-react";

const CytoscapeComponent = dynamic(() => import("react-cytoscapejs"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
      Initializing graph…
    </div>
  ),
});

interface FraudGraphProps {
  elements: ElementDefinition[];
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string | null) => void;
  emptyNote?: string | null;
}

const STYLESHEET: cytoscape.StylesheetJsonBlock[] = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      width: "data(size)",
      height: "data(size)",
      "border-width": 1,
      "border-color": "#1e293b",
      label: "data(label)",
      "font-size": 7,
      color: "#e2e8f0",
      "text-valign": "center",
      "text-halign": "center",
      "text-opacity": 0, // hidden by default; revealed for high-risk/selected
    },
  },
  {
    // Unknown true label: distinct dashed gray border (never shown as "safe")
    selector: 'node[trueLabel = "unknown"]',
    style: { "border-width": 2, "border-style": "dashed", "border-color": "#64748b" },
  },
  {
    // Reveal labels only where useful: high-risk nodes
    selector: 'node[riskLevel = "high"]',
    style: { "text-opacity": 1 },
  },
  {
    // Affected neighbourhood: subtle amber ring
    selector: 'node[affected = "1"]',
    style: { "border-width": 2, "border-color": "#f59e0b", "border-opacity": 0.7 },
  },
  {
    // Connection target: highlighted purple border
    selector: 'node[target = "1"]',
    style: { "border-width": 3, "border-color": "#a855f7" },
  },
  {
    // Simulated transaction node: distinct dashed purple diamond, label visible
    selector: 'node[kind = "simulated"]',
    style: {
      shape: "diamond",
      "border-width": 3,
      "border-style": "dashed",
      "border-color": "#a855f7",
      "text-opacity": 1,
      "font-size": 9,
      "font-weight": "bold",
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 4,
      "border-color": "#3b82f6",
      "border-style": "solid",
      "text-opacity": 1,
    },
  },
  {
    selector: "edge",
    style: {
      width: 1,
      "line-color": "#475569",
      "target-arrow-color": "#475569",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.7,
      "curve-style": "bezier",
      opacity: 0.5,
    },
  },
  {
    // Simulated transaction-flow edge: dashed purple
    selector: 'edge[kind = "simulated"]',
    style: { "line-style": "dashed", "line-color": "#a855f7", "target-arrow-color": "#a855f7", opacity: 0.9, width: 2 },
  },
  {
    selector: "node:selected ~ edge, edge:selected",
    style: { "line-color": "#3b82f6", "target-arrow-color": "#3b82f6", opacity: 1, width: 2 },
  },
];

const LAYOUT = {
  name: "cose",
  animate: false,
  padding: 24,
  nodeDimensionsIncludeLabels: true,
  idealEdgeLength: 70,
  nodeRepulsion: 6000,
} as unknown as cytoscape.LayoutOptions;

export function FraudGraph({ elements, selectedNodeId, onNodeSelect, emptyNote }: FraudGraphProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const onSelectRef = useRef(onNodeSelect);
  onSelectRef.current = onNodeSelect;

  const hasNodes = elements.some((el) => !el.data || !("source" in el.data));

  // Sync external selection (e.g. table click) into the graph.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements(":selected").unselect();
      if (selectedNodeId) cy.getElementById(selectedNodeId).select();
    });
  }, [selectedNodeId, elements]);

  if (!hasNodes) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
        <Network className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">{emptyNote ?? "No transactions to display"}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Adjust filters or pick another view mode.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg border border-border bg-muted/20 overflow-hidden">
      <CytoscapeComponent
        // Remount on element-set change so the layout re-runs cleanly.
        key={elements.map((e) => e.data?.id).join(",")}
        elements={elements}
        stylesheet={STYLESHEET}
        layout={LAYOUT}
        style={{ width: "100%", height: "100%" }}
        cy={(cy: cytoscape.Core) => {
          cyRef.current = cy;
          cy.on("layoutstop", () => cy.fit(undefined, 30));
          cy.on("tap", "node", (evt: cytoscape.EventObject) => {
            onSelectRef.current?.(evt.target.id());
          });
          cy.on("tap", (evt: cytoscape.EventObject) => {
            if (evt.target === cy) onSelectRef.current?.(null);
          });
        }}
      />
    </div>
  );
}
