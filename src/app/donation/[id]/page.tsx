import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  Users,
  MapPin,
  Building2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Share2,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getDB, getPaymentAccounts } from "@/lib/db";
import { formatRupiah, formatDateId, daysLeft } from "@/lib/format";
import DonateButton from "@/components/DonateButton";
import DonationTabs from "@/components/DonationTabs";
import ShareRow from "@/components/ShareRow";
import { txStatus } from "@/lib/payment";
import { ProgressBar } from "@/components/ui";

export const revalidate = 15;

export default async function DonationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDB();
  const item = db.donations.find((d) => d.id === id);
  if (!item) notFound();

  const pct = Math.min(100, Math.round((item.collected / item.target) * 100));
  const sisaHari = daysLeft(item.endDate);
  const txs = db.txs.filter((t) => t.donationId === item.id).slice(0, 10);
  const related = db.donations.filter((d) => d.id !== item.id).slice(0, 3);
  const campaignCount = db.donations.filter((d) => d.organizer === item.organizer).length;

  const endDate = new Date(item.endDate + "T00:00:00");
  const tanggal = endDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const feed = db.feed.slice(0, 3).map((f) => ({
    id: f.id,
    title: f.title,
    body: f.body,
    date: formatDateId(f.createdAt),
    tag: f.tag,
  }));

  const txItems = txs.map((t) => ({
    id: t.id,
    name: t.anon ? "Donatur Anonim" : t.donorName,
    meta: `${formatDateId(t.createdAt)} · ${t.method}${t.reference ? ` · Ref ${t.reference}` : ""}`,
    amount: formatRupiah(t.amount),
    status: txStatus(t),
    note: t.note,
  }));

  const paymentAccounts = getPaymentAccounts(db);

  // Estimasi dana yang telah disalurkan (misal 45% dari dana terkumpul)
  const danaTersalurkan = Math.round(item.collected * 0.45);

  return (
    <div className="min-h-screen bg-sage pb-24 sm:pb-28">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* ============================================================== */}
          {/* KOLOM UTAMA (KIRI - 2 KOLOM) TAMPILAN PERSIS REFERENSI PEDULY  */}
          {/* ============================================================== */}
          <div className="lg:col-span-2 space-y-0">
            {/* 1. Hero Image dengan Tombol Kembali & Share di atas */}
            <div className="relative rounded-t-3xl overflow-hidden shadow-xs bg-slate-900">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
              />
              {/* Tombol Back di Kiri Atas */}
              <Link
                href="/donation"
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center transition shadow-md"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              {/* Tombol Bookmark & Share di Kanan Atas */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center transition shadow-md"
                  aria-label="Simpan"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center transition shadow-md"
                  aria-label="Bagikan"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Kartu Konten Mengambang (Rounded Top Card) Menimpa Banner */}
            <div className="-mt-6 relative bg-white rounded-3xl p-5 sm:p-7 space-y-5 border border-slate-200/80 shadow-xs">
              {/* Judul Kampanye */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {item.title}
              </h1>

              {/* Baris Nominal Terkumpul & Target */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Terkumpul
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-brand-dark">
                      {formatRupiah(item.collected)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    dari target <strong className="text-slate-800">{formatRupiah(item.target)}</strong>
                  </span>
                </div>

                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>{item.donorsCount.toLocaleString("id-ID")} Donatur</span>
                  <span className="text-brand-dark font-extrabold">{pct}% Tercapai</span>
                </div>

                {/* Progress Bar NARASSA */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Kotak Transparansi Penyaluran Dana Hijau */}
              {danaTersalurkan > 0 && (
                <div className="p-3 bg-brand-soft border border-brand-light rounded-2xl flex items-center justify-between text-xs text-brand-dark">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>
                      <strong>{formatRupiah(danaTersalurkan)}</strong> telah disalurkan (1 termin)
                    </span>
                  </div>
                  <span className="font-bold text-brand-dark hover:underline flex items-center cursor-pointer text-[11px]">
                    Transparansi &rarr;
                  </span>
                </div>
              )}

              {/* Info Penggalang Dana & Masa Aktif */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-light text-brand-dark flex items-center justify-center font-black text-sm">
                      {item.organizer.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{item.organizer}</p>
                      <p className="text-[10px] text-brand-dark font-bold flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> Penggalang Dana Terverifikasi
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Status Masa Aktif Kampanye</span>
                  <span className="font-extrabold text-brand-dark">
                    {sisaHari > 0 ? `Sisa ${sisaHari} hari` : "Telah Berakhir"}
                  </span>
                </div>
              </div>

              {/* Tab Navigasi [Tentang] dan [Supporter] */}
              <DonationTabs
                description={item.description}
                feed={feed}
                txs={txItems}
                collected={item.collected}
                target={item.target}
                donors={item.donorsCount}
                pct={pct}
                endDateLabel={tanggal}
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SIDEBAR KANAN ALA PEDULY DENGAN PALET NARASSA                   */}
          {/* ============================================================== */}
          <aside className="lg:col-span-1 space-y-5">
            {/* Card Hero Sapaan Pengguna */}
            <div className="bg-brand text-white rounded-3xl p-5 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-light">
                Platform Relawan &amp; Donasi
              </p>
              <h3 className="text-lg font-black leading-snug">
                Halo, Sahabat Baik! Siap Berbagi?
              </h3>
              <p className="text-xs text-brand-light/90 leading-relaxed">
                Kebaikan kecil Anda menghadirkan senyuman dan harapan nyata bagi mereka yang membutuhkan.
              </p>
              <Link
                href="/impact"
                className="inline-block px-4 py-2 bg-white text-brand-dark font-bold text-xs rounded-full hover:bg-brand-light transition shadow-2xs"
              >
                Lihat Dampak Sosial &rarr;
              </Link>
            </div>

            {/* Aksi Sosial Pilihan Lainnya */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Aksi Sosial Pilihan
                </h4>
                <Link href="/donation" className="text-xs font-bold text-brand-dark hover:underline">
                  Jelajahi &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/donation/${rel.id}`}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition group"
                  >
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-900 group-hover:text-brand-dark transition line-clamp-1 leading-snug">
                        {rel.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {rel.organizer}
                      </p>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {formatRupiah(rel.collected)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Card Komunitas & Organisasi */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-2 shadow-2xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Organisasi &amp; Komunitas
              </p>
              <h4 className="text-xs font-extrabold text-slate-900">
                Buat Galang Dana untuk Organisasimu
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mulai penggalangan dana sosial secara transparan &amp; terverifikasi bersama NARASSA.
              </p>
              <Link
                href="/about"
                className="text-xs font-bold text-brand-dark hover:underline inline-block pt-1"
              >
                Pelajari Selengkapnya &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STICKY BOTTOM ACTION BAR (PALET NARASSA)                        */}
      {/* ============================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-3 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500 font-semibold">
              Tutup {tanggal} · <strong className="text-brand-dark">{sisaHari > 0 ? `${sisaHari} hari lagi` : "Selesai"}</strong>
            </p>
            <p className="text-xs font-bold text-slate-800 hidden sm:block">
              Donasi mulai dari {formatRupiah(10000)} (QRIS Bebas Biaya)
            </p>
          </div>

          <DonateButton
            item={item}
            accounts={paymentAccounts}
            label="Donasi Sekarang"
            className="w-full sm:w-auto px-8 py-3 bg-brand hover:bg-brand-dark text-white font-black text-sm rounded-full shadow-md transition"
          />
        </div>
      </div>
    </div>
  );
}
