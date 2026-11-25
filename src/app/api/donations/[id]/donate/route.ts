/**
 * ============================================================================
 *  API DONASI PENGGUNA (QRIS Pribadi & Transfer Manual)
 *  1. Donatur memilih nominal dan metode pembayaran (QRIS Pribadi / Transfer Bank).
 *  2. Donatur mengunggah bukti pembayaran & nomor referensi.
 *  3. Transaksi dicatat dengan status "Menunggu Verifikasi" (TX_PENDING).
 *  4. Dana BELUM ditambahkan ke total program sebelum disetujui admin.
 *  5. Sistem mengirimkan email tanda terima & ucapan terima kasih ke donatur.
 * ============================================================================
 */
import { error, json, readBody } from "@/lib/api";
import { getDB, getPaymentAccounts, mutate, uid } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { MAX_DONATION, MIN_DONATION, TX_PENDING } from "@/lib/payment";
import { sendDonationSubmittedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [user, body] = await Promise.all([
    getSessionUser(),
    readBody<{
      amount: number;
      method: string;
      anon: boolean;
      donorName: string;
      donorEmail?: string;
      donorPhone?: string;
      note?: string;
      reference?: string;
      bukti?: string;
    }>(req),
  ]);

  if (!user) {
    return error("Silakan login terlebih dahulu untuk berdonasi.", 401);
  }

  // Nominal bebas (boleh desimal), dibulatkan ke 2 digit
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_DONATION)
    return error(`Minimal donasi ${formatRupiah(MIN_DONATION)}.`);
  if (amount > MAX_DONATION) return error(`Maksimal donasi ${formatRupiah(MAX_DONATION)}.`);

  const donorName = (body.donorName || "").trim().slice(0, 100);
  if (!donorName) return error("Nama donatur wajib diisi.");

  const donorEmail = (body.donorEmail || user?.email || "").trim().toLowerCase();
  const donorPhone = (body.donorPhone || user?.phone || "").trim();

  // Validasi metode pembayaran
  const method = (body.method || "").trim();
  if (!method) return error("Metode pembayaran wajib dipilih.");
  const validMethods = getPaymentAccounts(await getDB());
  if (!validMethods.some((a) => a.method.toLowerCase() === method.toLowerCase())) {
    return error("Metode pembayaran tidak valid atau tidak tersedia.");
  }

  let campaignTitle = "";
  const txId = uid("tx-");
  const createdAt = new Date().toISOString().split("T")[0];

  const saved = await mutate((m) => {
    const campaign = m.donations.find((d) => d.id === id);
    if (!campaign) return null;
    campaignTitle = campaign.title;

    // Simpan transaksi dengan status Menunggu Verifikasi
    // PENTING: Dana (campaign.collected) dan donorsCount TIDAK bertambah sekarang.
    // Dana hanya bertambah setelah admin memverifikasi bukti di /admin -> Verifikasi Donasi.
    m.txs.unshift({
      id: txId,
      donationId: campaign.id,
      userId: user?.id ?? null,
      donorName: body.anon ? "Donatur Anonim" : donorName,
      donorEmail: donorEmail || undefined,
      donorPhone: donorPhone || undefined,
      amount,
      method,
      anon: !!body.anon,
      note: (body.note || "").trim().slice(0, 300),
      status: TX_PENDING,
      bukti: body.bukti || "",
      reference: (body.reference || "").trim().slice(0, 100),
      createdAt,
    });

    if (user) {
      m.notifications.unshift({
        id: uid("nt-"),
        userId: user.id,
        title: "Bukti donasi terkirim",
        body: `Bukti donasi ${formatRupiah(amount)} untuk "${campaign.title}" sedang menunggu verifikasi tim admin. Terima kasih!`,
        type: "donasi",
        read: false,
        createdAt,
      });
    }
    return { txId };
  });

  if (!saved) return error("Program donasi tidak ditemukan.", 404);

  // Kirim feedback ucapan terima kasih via email jika email tersedia
  if (donorEmail) {
    // Jalankan secara asynchronous tanpa memblokir respons
    sendDonationSubmittedEmail({
      to: donorEmail,
      donorName: body.anon ? "Donatur Budiman" : donorName,
      campaignTitle,
      amount: formatRupiah(amount),
      txId,
      method,
      reference: body.reference,
    }).catch((err) => console.error("Gagal mengirim email donasi:", err));
  }

  return json({
    ok: true,
    status: TX_PENDING,
    txId: saved.txId,
    message: "Bukti donasi berhasil dikirim dan sedang menunggu verifikasi admin. Terima kasih atas kepedulian Anda!",
  });
}
