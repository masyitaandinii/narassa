import { json } from "@/lib/api";
import { getDB, isCloudDB } from "@/lib/db";

export async function GET() {
  try {
    const isCloud = isCloudDB();
    const db = await getDB();
    return json({
      status: "ok",
      mode: isCloud ? "supabase" : "local",
      database: "connected",
      records: {
        users: db.users?.length ?? 0,
        activities: db.activities?.length ?? 0,
        donations: db.donations?.length ?? 0,
        txs: db.txs?.length ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return json(
      {
        status: "error",
        database: "disconnected",
        message: err instanceof Error ? err.message : String(err),
      },
      500
    );
  }
}
