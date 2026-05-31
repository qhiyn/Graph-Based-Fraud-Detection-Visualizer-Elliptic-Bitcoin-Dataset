import { getNodeDetail } from "@/lib/data/getNodeDetail";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await getNodeDetail(id);
    if (!data) {
      return Response.json(
        { success: false, error: { message: `Transaction ${id} not found.`, code: "NODE_NOT_FOUND" } },
        { status: 404 }
      );
    }
    return Response.json({ success: true, data });
  } catch {
    return Response.json(
      { success: false, error: { message: "Node detail could not be loaded.", code: "NODE_LOAD_ERROR" } },
      { status: 500 }
    );
  }
}
