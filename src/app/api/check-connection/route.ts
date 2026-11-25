import { json } from "@/lib/api";
import { getDB, isCloudDB } from "@/lib/db";

export async function GET() {
  try {
    const isCloud = isCloudDB();
    const db = await getDB();

    const jumlah_baris: Record<string, number> = {
      users: db.users?.length ?? 0,
      donations: db.donations?.length ?? 0,
      txs: db.txs?.length ?? 0,
      activities: db.activities?.length ?? 0,
      applications: db.applications?.length ?? 0,
      certificates: db.certificates?.length ?? 0,
      attendance: db.attendance?.length ?? 0,
      notifications: db.notifications?.length ?? 0,
      blog: db.blog?.length ?? 0,
      feed: db.feed?.length ?? 0,
      fundraising: db.fundraising?.length ?? 0,
      recurring: db.recurring?.length ?? 0,
      supporters: db.supporters?.length ?? 0,
      csr: db.csr?.length ?? 0,
      otps: db.otps?.length ?? 0,
      settings: db.settings?.length ?? 0,
    };

    return json({
      koneksi: true,
      mode: isCloud ? "supabase" : "lokal",
      pesan: isCloud
        ? "Terhubung ke Supabase. Semua tabel berhasil terbaca."
        : "Berjalan pada mode database lokal (data/db.json). Semua tabel terbaca.",
      jumlah_baris,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return json(
      {
        koneksi: false,
        pesan: err instanceof Error ? err.message : "Gagal memeriksa koneksi database.",
        error: String(err),
      },
      500
    );
  }
}
