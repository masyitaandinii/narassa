/**
 * ============================================================================
 *  API VERIFIKASI DONASI OLEH ADMIN
 *
 *  PATCH /api/admin/txs/[id]   body: { action: "approve" | "reject" }
 *
 *  approve -> transaksi status "Dikonfirmasi", dana MASUK ke jumlah terkumpul
 *             (collected += amount, donorsCount += 1), donor diberi notifikasi
 *             dan dikirimi email terima kasih & konfirmasi resmi.
 *  reject  -> transaksi status "Ditolak", dana TIDAK masuk, donor diberi notifikasi.
 * ============================================================================
 */
import { error, json, readBody } from "@/lib/api";
import { mutate, uid } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { TX_CONFIRMED, TX_REJECTED, isPending } from "@/lib/payment";
import { sendDonationConfirmedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return error("Akses admin diperlukan.", 403);

  const { id } = await ctx.params;
  const { action } = await readBody<{ action: "approve" | "reject" }>(req);
  if (action !== "approve" && action !== "reject") return error("Aksi tidak dikenal (approve/reject).");
  const approve = action === "approve";

  let emailData: {
    to: string;
    donorName: string;
    campaignTitle: string;
    amount: string;
    txId: string;
  } | null = null;

  const result = await mutate((m) => {
    const tx = m.txs.find((t) => t.id === id);
    if (!tx) return { fail: "Transaksi tidak ditemukan." } as const;
    if (!isPending(tx)) return { fail: `Transaksi ini sudah berstatus "${tx.status ?? TX_CONFIRMED}".` } as const;

    const campaign = m.donations.find((d) => d.id === tx.donationId);
    tx.status = approve ? TX_CONFIRMED : TX_REJECTED;

    // Tambah dana program hanya jika disetujui
    if (approve && campaign) {
      campaign.collected += tx.amount;
      campaign.donorsCount += 1;
    }

    // Cari user jika ada untuk notifikasi akun & email
    const donorUser = tx.userId ? m.users.find((u) => u.id === tx.userId) : null;
    const recipientEmail = tx.donorEmail || donorUser?.email;

    if (approve && recipientEmail) {
      emailData = {
        to: recipientEmail,
        donorName: tx.donorName,
        campaignTitle: campaign?.title ?? "Program Peduli Sesama",
        amount: formatRupiah(tx.amount),
        txId: tx.id,
      };
    }

    if (tx.userId) {
      const prefix = `Donasi ${formatRupiah(tx.amount)} untuk "${campaign?.title ?? "program"}"`;
      m.notifications.unshift({
        id: uid("nt-"),
        userId: tx.userId,
        title: approve ? "Donasi berhasil dikonfirmasi" : "Donasi ditolak",
        body: approve
          ? `${prefix} telah diverifikasi dan disetujui oleh admin. Terima kasih atas ketulusan Anda!`
          : `${prefix} ditolak oleh admin (bukti transfer tidak sesuai/tidak terbaca). Silakan lakukan donasi ulang dengan bukti yang valid.`,
        type: "donasi",
        read: false,
        createdAt: new Date().toISOString().split("T")[0],
      });
    }
    return { ok: true as const, status: tx.status };
  });

  if ("fail" in result) return error(result.fail as string);

  // Kirim email konfirmasi jika disetujui
  if (emailData) {
    sendDonationConfirmedEmail(emailData).catch((err) =>
      console.error("Gagal mengirim email konfirmasi donasi:", err)
    );
  }

  return json(result);
}
