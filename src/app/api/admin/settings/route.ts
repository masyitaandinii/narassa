/**
 * ============================================================================
 *  API PENGATURAN ADMIN
 *  POST /api/admin/settings   body: { key, value }
 *
 *  Saat ini hanya kunci "payment_accounts": daftar nomor rekening/e-wallet
 *  tujuan transfer donasi (diedit admin di /admin -> tab Pengaturan, dan
 *  ditampilkan pada modal donasi milik member).
 * ============================================================================
 */
import { error, json, readBody } from "@/lib/api";
import { mutate } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { PaymentAccount } from "@/lib/types";

/** Validasi + rapikan daftar rekening; mengembalikan pesan error atau data bersih. */
function cleanAccounts(value: unknown): { error: string } | { data: PaymentAccount[] } {
  if (!Array.isArray(value)) return { error: "Data rekening harus berupa daftar." };

  const data: PaymentAccount[] = [];
  for (const a of value) {
    const method = String(a?.method ?? "").trim();
    const number = String(a?.number ?? "").trim();
    if (!method) return { error: "Setiap rekening wajib punya nama metode." };
    if (!number) return { error: "Setiap rekening wajib punya nomor." };
    if (data.some((x) => x.method.toLowerCase() === method.toLowerCase()))
      return { error: `Metode "${method}" duplikat.` };
    data.push({ method, number, owner: String(a?.owner ?? "").trim() });
  }
  if (!data.length) return { error: "Minimal satu rekening harus tersedia." };
  return { data };
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return error("Akses admin diperlukan.", 403);

  const { key, value } = await readBody<{ key: string; value: unknown }>(req);
  if (key !== "payment_accounts") return error("Kunci pengaturan tidak diizinkan.");

  const cleaned = cleanAccounts(value);
  if ("error" in cleaned) return error(cleaned.error);

  await mutate((m) => {
    const row = m.settings.find((s) => s.key === key);
    if (row) row.value = cleaned.data;
    else m.settings.unshift({ key, value: cleaned.data });
  });
  return json({ ok: true });
}
