import { getGraphData } from "@/lib/data/getGraphData";
import { calculateSimulatedRisk } from "@/lib/simulation/calculateSimulatedRisk";
import { getNodeNeighborhood } from "@/lib/graph/getNodeNeighborhood";
import { getDisagreement } from "@/lib/graph/getDisagreement";
import { SimulationRequest } from "@/lib/types/simulation";

const MAX_TARGETS = 25;
const MAX_AFFECTED = 200;

export async function POST(req: Request) {
  let body: SimulationRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: { message: "Invalid request body.", code: "BAD_REQUEST" } }, { status: 400 });
  }

  const cfg = body.simulatedNode ?? {};
  const ids = Array.from(new Set(body.connectToNodeIds ?? [])).slice(0, MAX_TARGETS);
  if (ids.length === 0) {
    return Response.json(
      { success: false, error: { message: "Select at least one transaction to connect to.", code: "NO_CONNECTIONS" } },
      { status: 400 }
    );
  }

  try {
    const { nodes, edges } = await getGraphData();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const targets = ids.map((id) => byId.get(id)).filter((n): n is NonNullable<typeof n> => Boolean(n));
    const connectedNodeIds = targets.map((n) => n.id);

    const neighborProbabilities = targets.map((n) => n.gnnProbability ?? n.fraudProbability);
    const illicitLabeledNeighbors = targets.filter((n) => n.trueLabel === "illicit").length;
    const unknownNeighbors = targets.filter((n) => n.trueLabel === "unknown").length;
    const disagreeingNeighbors = targets.filter((n) => getDisagreement(n.baselineProbability, n.gnnProbability).disagree).length;

    const inStep = cfg.timeStep != null ? nodes.filter((n) => n.timeStep === cfg.timeStep) : [];
    const timeStepRiskFactor = inStep.length
      ? inStep.reduce((a, n) => a + (n.gnnProbability ?? n.fraudProbability), 0) / inStep.length
      : 0.5;

    // Affected neighborhood = connected targets + their 1-hop neighbours.
    const affected = new Set<string>(connectedNodeIds);
    for (const id of connectedNodeIds) {
      if (affected.size >= MAX_AFFECTED) break;
      for (const nb of getNodeNeighborhood(id, edges, 1)) affected.add(nb);
    }

    const risk = calculateSimulatedRisk({
      neighborProbabilities,
      illicitLabeledNeighbors,
      unknownNeighbors,
      disagreeingNeighbors,
      timeStepRiskFactor,
      amountGrowthFactor: cfg.amountGrowthFactor ?? 0.5,
      degreeGrowthFactor: cfg.degreeGrowthFactor ?? Math.min(1, connectedNodeIds.length / 8),
    });

    return Response.json({
      success: true,
      data: {
        simulatedNodeId: "sim_tx_001",
        ...risk,
        connectedNodeIds,
        affectedNodeIds: Array.from(affected).slice(0, MAX_AFFECTED),
      },
    });
  } catch {
    return Response.json({ success: false, error: { message: "Simulation failed.", code: "SIMULATION_ERROR" } }, { status: 500 });
  }
}
