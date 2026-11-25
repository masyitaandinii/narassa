import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  BadgeCheck,
  CheckCircle2,
  Gift,
  ArrowLeft,
  Share2,
  Bookmark,
  Building2,
} from "lucide-react";
import { getDB } from "@/lib/db";
import { daysLeft } from "@/lib/format";
import RegisterButton from "@/components/RegisterButton";
import ActivityTabs from "@/components/ActivityTabs";

export const revalidate = 15;

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDB();
  const item = db.activities.find((a) => a.id === id);
  if (!item) notFound();

  const related = db.activities.filter((a) => a.id !== item.id).slice(0, 3);
  const applications = db.applications.filter((a) => a.activityId === item.id);
  const sisaHari = daysLeft(item.deadline);

  const volunteerList = applications.map((a) => ({
    id: a.id,
    name: a.name,
    appliedDate: a.appliedDate,
    status: a.status,
  }));

  return (
    <div className="min-h-screen bg-sage pb-24 sm:pb-28">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* ============================================================== */}
          {/* KOLOM UTAMA (KIRI - 2 KOLOM) SESUAI REFERENSI PEDULY           */}
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
                href="/activity"
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
              {/* Kategori & Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-brand-dark bg-brand-light border border-brand-light px-2.5 py-1 rounded-full uppercase">
                  {item.category}
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  {item.type}
                </span>
                {item.verified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-brand-dark bg-brand-light border border-brand-light px-2.5 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
                )}
                {item.urgent && (
                  <span className="text-[10px] font-bold text-white bg-red-600 px-2.5 py-1 rounded-full uppercase">
                    Mendesak
                  </span>
                )}
              </div>

              {/* Judul Kegiatan */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {item.title}
              </h1>

              {/* Tabs [Tentang] dan [Supporter] Ala Peduly */}
              <ActivityTabs
                description={item.description}
                organizer={item.organizer}
                location={item.location}
                date={item.date}
                quota={item.quota}
                registered={item.registered}
                requirements={item.requirements}
                perks={item.perks}
                volunteers={volunteerList}
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SIDEBAR KANAN PALET RESMI NARASSA                              */}
          {/* ============================================================== */}
          <aside className="lg:col-span-1 space-y-5">
            {/* Card Hero Sapaan Pengguna */}
            <div className="bg-brand text-white rounded-3xl p-5 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-light">
                Platform Relawan &amp; Donasi
              </p>
              <h3 className="text-lg font-black leading-snug">
                Halo, Sahabat Baik! Siap Mengabdi?
              </h3>
              <p className="text-xs text-brand-light/90 leading-relaxed">
                Bergabunglah bersama ribuan relawan di seluruh Indonesia dan wujudkan perubahan nyata.
              </p>
              <Link
                href="/activity"
                className="inline-block px-4 py-2 bg-white text-brand-dark font-bold text-xs rounded-full hover:bg-brand-light transition shadow-2xs"
              >
                Jelajahi Aksi Relawan &rarr;
              </Link>
            </div>

            {/* Aksi Sosial / Kegiatan Lainnya */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Kegiatan Serupa
                </h4>
                <Link href="/activity" className="text-xs font-bold text-brand-dark hover:underline">
                  Lihat Semua &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/activity/${rel.id}`}
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
                        {rel.location} · {rel.date}
                      </p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        Gratis · {rel.quota - rel.registered} slot
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Info Komunitas */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-2 shadow-2xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Kolaborasi Komunitas
              </p>
              <h4 className="text-xs font-extrabold text-slate-900">
                Punya Komunitas Sosial?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Publikasikan program kerelawanan dan jaring relawan berdedikasi bersama platform NARASSA.
              </p>
              <Link
                href="/about"
                className="text-xs font-bold text-brand-dark hover:underline inline-block pt-1"
              >
                Daftarkan Komunitas &rarr;
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
              Tutup {item.deadline} · <strong className="text-brand-dark">{sisaHari > 0 ? `${sisaHari} hari lagi` : "Ditutup"}</strong>
            </p>
            <p className="text-xs font-bold text-slate-800">
              Biaya Partisipasi: <span className="text-emerald-700 font-black">Gratis</span> ({item.registered}/{item.quota} Terdaftar)
            </p>
          </div>

          <RegisterButton
            item={item}
            label="Daftar Sekarang"
            className="w-full sm:w-auto px-8 py-3 bg-brand hover:bg-brand-dark text-white font-black text-sm rounded-full shadow-md transition"
          />
        </div>
      </div>
    </div>
  );
}
