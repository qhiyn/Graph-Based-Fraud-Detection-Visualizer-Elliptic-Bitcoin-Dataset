import { getSuspiciousTransactions } from "@/lib/data/getSuspiciousTransactions";

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 15);
  try {
    const data = await getSuspiciousTransactions(Number.isFinite(limit) ? limit : 15);
    return Response.json({ success: true, data });
  } catch {
    return Response.json(
      { success: false, error: { message: "Suspicious transactions could not be loaded.", code: "SUSPICIOUS_LOAD_ERROR" } },
      { status: 500 }
    );
  }
}
