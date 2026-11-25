import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  UserPlus,
  HandHeart,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  Heart,
  BarChart3,
} from "lucide-react";
import { getDB, getPaymentAccounts } from "@/lib/db";
import { formatRupiah, formatDateId } from "@/lib/format";
import DonateButton from "@/components/DonateButton";
import HeroCarousel from "@/components/HeroCarousel";

export const revalidate = 15;

/** Hero carousel images — high-quality volunteer photography */
const HERO_SLIDES = [
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=80",
];

const CTA_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Relawan Terverifikasi",
    desc: "Semua mitra & relawan melewati proses seleksi ketat.",
  },
  {
    icon: Heart,
    title: "Donasi Aman & Terpercaya",
    desc: "Setiap rupiah dipantau dan diaudit secara transparan.",
  },
  {
    icon: BarChart3,
    title: "Laporan Transparan",
    desc: "Akses laporan dampak & distribusi dana kapan saja.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function HomePage() {
  const db = await getDB();

  const activities = [...db.activities]
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
    .slice(0, 3);

  const donations = [...db.donations]
    .sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate))
    .slice(0, 2);

  const [featuredNews, ...restNews] = db.blog;
  const sideNews = restNews.slice(0, 2);

  const paymentAccounts = getPaymentAccounts(db);

  return (
    <div className="space-y-20 pb-20">
      {/* ============================= HERO ============================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-6 lg:space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand tracking-tight leading-[1.08]">
                Nyalakan Aksi,
                <br />
                <span className="text-brand-accent">Rangkul Asa.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-lg">
                NARASSA menjadi jembatan bagi para relawan untuk berkontribusi dalam berbagai
                gerakan sosial, pelestarian lingkungan, dan pemberdayaan masyarakat melalui aksi
                yang transparan, berdampak, dan berkelanjutan.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/activity"
                className="inline-flex items-center gap-2.5 bg-brand hover:bg-brand-dark text-white font-semibold px-7 py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Jelajahi Kegiatan <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/donation"
                className="inline-flex items-center gap-2.5 border-2 border-brand text-brand hover:bg-brand hover:text-white font-semibold px-7 py-3.5 rounded-2xl text-sm transition-all"
              >
                Mulai Donasi
              </Link>
            </div>

            {/* Trust metrics */}
            <div className="flex gap-8 pt-2">
              <div>
                <p className="text-2xl font-black text-brand">100+</p>
                <p className="text-xs text-slate-500 font-medium">Mitra Aktif</p>
              </div>
              <div className="border-l border-slate-200 pl-8">
                <p className="text-2xl font-black text-brand">5.000+</p>
                <p className="text-xs text-slate-500 font-medium">Relawan Bergabung</p>
              </div>
              <div className="border-l border-slate-200 pl-8 hidden sm:block">
                <p className="text-2xl font-black text-brand">50+</p>
                <p className="text-xs text-slate-500 font-medium">Program Berjalan</p>
              </div>
            </div>
          </div>

          {/* Right: Carousel */}
          <div className="min-w-0 w-full">
            <HeroCarousel slides={HERO_SLIDES} />
          </div>
        </div>
      </section>

      {/* =================== SECTION: KEGIATAN VOLUNTEER =================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Upcoming Event
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Kuota volunteer terbatas! Yuk, segera bergabung dan jadi bagian dari aksi nyata
              bersama NARASSA.
            </p>
          </div>
          <Link
            href="/activity"
            className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1.5 shrink-0 group"
          >
            Lihat Semua Kegiatan
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => {
            const percent = Math.min(100, Math.round((act.registered / Math.max(1, act.quota)) * 100));
            return (
              <article
                key={act.id}
                className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden card-hover flex flex-col justify-between group"
              >
                <div>
                  <Link href={`/activity/${act.id}`} className="relative block h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={act.image}
                      alt={act.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </Link>

                  <div className="p-5 space-y-3">
                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" /> {act.location}
                    </div>

                    <Link href={`/activity/${act.id}`}>
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                        {act.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>

                    {/* Progress */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>
                          {act.registered} / {act.quota} Relawan
                        </span>
                        <span className="font-bold text-brand-accent">{percent}%</span>
                      </div>
                      <div className="w-full bg-sage h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-accent h-full rounded-full progress-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                    <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                    {formatDateId(act.date)}
                  </span>
                  <Link
                    href={`/activity/${act.id}`}
                    className="text-brand font-semibold hover:text-brand-dark inline-flex items-center gap-1 text-sm group/link"
                  >
                    Lihat Detail
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =================== SECTION: DONASI BERDAMPAK NYATA =================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Donasi Berdampak Nyata
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              100% donasi terdistribusi langsung dan dipantau berkala dengan laporan audit publik.
            </p>
          </div>
          <Link
            href="/donation"
            className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1.5 shrink-0 group"
          >
            Semua Penggalangan
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {donations.map((don) => {
            const percent = Math.min(100, Math.round((don.collected / Math.max(1, don.target)) * 100));
            return (
              <article
                key={don.id}
                className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden card-hover flex flex-col sm:flex-row group"
              >
                <Link href={`/donation/${don.id}`} className="sm:w-5/12 relative h-52 sm:h-auto overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={don.image}
                    alt={don.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="sm:w-7/12 p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <Link href={`/donation/${don.id}`}>
                      <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-brand transition-colors">
                        {don.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{don.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-sm">
                        <span className="font-bold text-brand">{formatRupiah(don.collected)}</span>
                        <span className="text-xs font-semibold text-slate-500">{percent}%</span>
                      </div>
                      <div className="w-full bg-sage h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-accent h-full rounded-full progress-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        dari target {formatRupiah(don.target)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 text-sm inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {don.donorsCount} Donatur
                      </span>
                      <DonateButton
                        item={don}
                        accounts={paymentAccounts}
                        label="Donasi Sekarang"
                        className="bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =================== SECTION: BERITA & ISU =================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Berita &amp; Isu Lingkungan Aktual
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Laporan mendalam dari relawan dan penggiat ekologi di berbagai sudut nusantara.
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1.5 shrink-0 group"
          >
            Baca Seluruh Artikel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured article */}
          {featuredNews && (
            <Link
              href={`/blog/${featuredNews.slug}`}
              className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden card-hover flex flex-col group"
            >
              <div className="relative h-60 sm:h-72 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredNews.image}
                  alt={featuredNews.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="inline-block text-xs font-semibold tracking-wider text-brand-accent uppercase bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                    {featuredNews.category}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-xl sm:text-2xl leading-snug group-hover:text-brand transition-colors">
                  {featuredNews.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
                  {featuredNews.excerpt}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm mt-auto">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
                      {initials(featuredNews.author)}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-700 block text-sm">{featuredNews.author}</span>
                      <span className="text-xs text-slate-400">{formatDateId(featuredNews.createdAt)}</span>
                    </div>
                  </div>
                  <span className="text-brand font-semibold inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                    Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Side articles */}
          <div className="space-y-6">
            {sideNews.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="block bg-white rounded-2xl border border-slate-200/60 overflow-hidden card-hover group"
              >
                <div className="h-36 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="text-brand-accent font-semibold">{p.category}</span>
                    <span>•</span>
                    <span>{formatDateId(p.createdAt)}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-sm text-slate-500 line-clamp-2">{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =================== SECTION: CTA BANNER =================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand text-white rounded-3xl p-8 sm:p-12 shadow-xl grid lg:grid-cols-5 gap-10 items-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          <div className="lg:col-span-3 space-y-6 relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Siap Nyalakan Semangat Kebaikan?
              <br />
              Bergabunglah Bersama NARASSA.
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl">
              Baik sebagai relawan perorangan, inisiator komunitas kampus, maupun korporasi mitra
              dampak sosial—ruang aksi Anda terbuka luas di sini.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 text-brand font-bold px-7 py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" /> Daftar Jadi Relawan
              </Link>
              <Link
                href="/donation"
                className="inline-flex items-center gap-2.5 bg-brand-accent hover:bg-emerald-400 text-white font-bold px-7 py-3.5 rounded-2xl text-sm transition-all border border-emerald-400/30 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <HandHeart className="w-4 h-4" /> Mulai Donasi Sekarang
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3 relative z-10">
            {CTA_FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/15 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-accent/25 flex items-center justify-center text-emerald-300 shrink-0">
                  <feat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white">{feat.title}</h4>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
