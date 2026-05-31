import { getGraphData } from "@/lib/data/getGraphData";
import { DataError } from "@/lib/data/readJsonFile";

export async function GET() {
  try {
    const data = await getGraphData();
    return Response.json({ success: true, data });
  } catch (e) {
    const code = e instanceof DataError ? e.code : "GRAPH_LOAD_ERROR";
    return Response.json(
      { success: false, error: { message: "Graph data could not be loaded.", code } },
      { status: 500 }
    );
  }
}
