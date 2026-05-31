import { getMetrics } from "@/lib/data/getMetrics";

export async function GET() {
  try {
    const data = await getMetrics();
    return Response.json({ success: true, data });
  } catch {
    return Response.json(
      { success: false, error: { message: "Metrics could not be loaded.", code: "METRICS_LOAD_ERROR" } },
      { status: 500 }
    );
  }
}
