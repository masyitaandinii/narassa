"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Filter,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { isPending, TX_CONFIRMED, TX_REJECTED } from "@/lib/payment";
import type { DonationRow } from "@/components/AdminPanel";

interface TxItem {
  id: string;
  donationId: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  method: string;
  anon: boolean;
  note: string;
  createdAt: string;
  status?: string;
  bukti?: string;
  reference?: string;
}

interface Props {
  txs: TxItem[];
  donations: DonationRow[];
  onNavigateToVerify?: () => void;
}

export default function AdminDonationDashboard({
  txs,
  donations,
  onNavigateToVerify,
}: Props) {
  const [timeframe, setTimeframe] = useState<"7" | "14" | "30" | "all">("14");

  // Format tanggal hari ini (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Transaksi yang masuk hari ini
  const todayTxs = useMemo(() => {
    return txs.filter((t) => t.createdAt === todayStr);
  }, [txs, todayStr]);

  const todayIncome = useMemo(() => {
    return todayTxs
      .filter((t) => t.status === TX_CONFIRMED || !t.status)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayTxs]);

  const pendingTxs = useMemo(() => txs.filter(isPending), [txs]);
  const pendingTotal = useMemo(() => pendingTxs.reduce((sum, t) => sum + t.amount, 0), [pendingTxs]);

  // Filter transaksi berdasarkan timeframe
  const filteredTxs = useMemo(() => {
    if (timeframe === "all") return txs;
    const days = parseInt(timeframe, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return txs.filter((t) => t.createdAt >= cutoffStr);
  }, [txs, timeframe]);

  // Total terkonfirmasi pada timeframe terpilih
  const confirmedInTimeframe = useMemo(() => {
    return filteredTxs
      .filter((t) => t.status === TX_CONFIRMED || !t.status)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTxs]);

  // Rata-rata donasi
  const avgDonation = useMemo(() => {
    const confirmedCount = filteredTxs.filter((t) => t.status === TX_CONFIRMED || !t.status).length;
    return confirmedCount > 0 ? confirmedInTimeframe / confirmedCount : 0;
  }, [filteredTxs, confirmedInTimeframe]);

  // Agregasi Donasi Harian untuk Grafik (Daily Income Chart)
  const dailyChartData = useMemo(() => {
    const daysCount = timeframe === "all" ? 30 : parseInt(timeframe, 10);
    const result: { dateStr: string; label: string; amount: number; count: number }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      const dayTxs = txs.filter(
        (t) => t.createdAt === dateStr && (t.status === TX_CONFIRMED || !t.status)
      );
      const amount = dayTxs.reduce((sum, t) => sum + t.amount, 0);

      result.push({ dateStr, label, amount, count: dayTxs.length });
    }
    return result;
  }, [txs, timeframe]);

  const maxDailyAmount = useMemo(() => {
    const max = Math.max(...dailyChartData.map((d) => d.amount), 1);
    return max;
  }, [dailyChartData]);

  // Leaderboard Tujuan Donasi Terbesar (Top Campaigns)
  const topCampaigns = useMemo(() => {
    return [...donations]
      .sort((a, b) => b.collected - a.collected)
      .slice(0, 5);
  }, [donations]);

  // Distribusi Donasi per Kategori
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    donations.forEach((d) => {
      const cat = d.category || "Sosial";
      map.set(cat, (map.get(cat) || 0) + d.collected);
    });

    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [donations]);

  // Status breakdown
  const statusStats = useMemo(() => {
    const confirmed = txs.filter((t) => t.status === TX_CONFIRMED || !t.status).length;
    const pending = txs.filter(isPending).length;
    const rejected = txs.filter((t) => t.status === TX_REJECTED).length;
    const total = txs.length || 1;

    return {
      confirmed,
      pending,
      rejected,
      pctConfirmed: Math.round((confirmed / total) * 100),
      pctPending: Math.round((pending / total) * 100),
      pctRejected: Math.round((rejected / total) * 100),
    };
  }, [txs]);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* BARIS METRIK UTAMA (KPI CARDS)                                 */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pemasukan Hari Ini */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Pemasukan Hari Ini
            </span>
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(todayIncome)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
            <span>{todayTxs.length} transaksi masuk hari ini</span>
          </div>
        </div>

        {/* Pemasukan Periode Terpilih */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Periode ({timeframe === "all" ? "Semua" : `${timeframe} Hari`})
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-blue-900 tracking-tight">
            {formatRupiah(confirmedInTimeframe)}
          </p>
          <p className="text-xs text-slate-500">
            Total dana terkonfirmasi dalam filter
          </p>
        </div>

        {/* Donasi Menunggu Approval */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Menunggu Approval
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-900 tracking-tight">
            {pendingTxs.length} <span className="text-xs font-semibold text-slate-400">Transaksi</span>
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-bold">
              {formatRupiah(pendingTotal)}
            </span>
            {pendingTxs.length > 0 && onNavigateToVerify && (
              <button
                onClick={onNavigateToVerify}
                className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-0.5"
              >
                Verifikasi Sekarang &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Rata-rata Donasi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Rata-rata Donasi
            </span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(avgDonation)}
          </p>
          <p className="text-xs text-slate-500">
            Per transaksi terkonfirmasi
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GRAFIK PEMASUKAN DONASI HARIAN (DAILY INCOME CHART)            */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-700" />
              Grafik Pemasukan Donasi Harian
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau tren pemasukan dana donasi terkonfirmasi per hari secara visual
            </p>
          </div>

          {/* Filter Range */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            {(["7", "14", "30", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeframe(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  timeframe === r
                    ? "bg-white text-teal-800 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r === "all" ? "Semua" : `${r} Hari`}
              </button>
            ))}
          </div>
        </div>

        {/* Visualisasi Bar Chart SVG Responsif */}
        <div className="space-y-3">
          <div className="h-64 w-full flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-200">
            {dailyChartData.map((d, idx) => {
              const heightPct = Math.max(6, Math.round((d.amount / maxDailyAmount) * 100));
              const isToday = d.dateStr === todayStr;

              return (
                <div
                  key={d.dateStr}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                >
                  {/* Tooltip Hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-slate-900 text-white text-[11px] rounded-lg py-1.5 px-2.5 shadow-lg whitespace-nowrap text-center space-y-0.5">
                      <p className="font-bold">{d.dateStr}</p>
                      <p className="text-teal-300 font-black">{formatRupiah(d.amount)}</p>
                      <p className="text-[10px] text-slate-400">{d.count} Donatur</p>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                  </div>

                  {/* Batang Chart */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 group-hover:opacity-85 ${
                      isToday
                        ? "bg-teal-700 shadow-xs ring-2 ring-teal-400/40"
                        : d.amount > 0
                        ? "bg-teal-500"
                        : "bg-slate-200"
                    }`}
                  />
                  {/* Label Bawah */}
                  <span
                    className={`text-[9px] sm:text-[10px] mt-2 block truncate font-semibold ${
                      isToday ? "text-teal-700 font-extrabold" : "text-slate-400"
                    }`}
                  >
                    {idx % (timeframe === "30" || timeframe === "all" ? 4 : 2) === 0 ? d.label : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Rendah: Rp 0</span>
            <span className="font-bold text-teal-800">
              Puncak Harian: {formatRupiah(maxDailyAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2 KOLOM: TUJUAN DONASI TERBESAR & DISTRIBUSI KATEGORI          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEADERBOARD TUJUAN DONASI TERBESAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Tujuan Donasi Terbesar (Top Programs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Program penggalangan dana dengan perolehan terbesar
              </p>
            </div>
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
              Top 5
            </span>
          </div>

          <div className="space-y-3.5">
            {topCampaigns.map((prog, idx) => {
              const pct = Math.min(100, Math.round((prog.collected / (prog.target || 1)) * 100));
              return (
                <div
                  key={prog.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-teal-50/20 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0
                            ? "bg-amber-400 text-slate-950 shadow-xs"
                            : idx === 1
                            ? "bg-slate-300 text-slate-800"
                            : idx === 2
                            ? "bg-amber-700/60 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {prog.title}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {prog.category} · {prog.donorsCount} Donatur
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-teal-800">
                        {formatRupiah(prog.collected)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Target {formatRupiah(prog.target)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Tercapai: {pct}%</span>
                      <span>{prog.endDate ? `Selesai ${prog.endDate}` : "Sedang berjalan"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DISTRIBUSI KATEGORI & STATUS TRANSAKSI */}
        <div className="space-y-6">
          {/* Distribusi Kategori Donasi */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-teal-700" />
                Alokasi Donasi per Kategori
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Persentase perolehan donasi berdasarkan sektor misi
              </p>
            </div>

            <div className="space-y-3">
              {categoryStats.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800">{c.category}</span>
                    <span className="font-extrabold text-teal-800">
                      {formatRupiah(c.amount)} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-700 h-full rounded-full"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Status Verifikasi Keseluruhan Transaksi
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-base font-black text-emerald-800">{statusStats.confirmed}</p>
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Dikonfirmasi</p>
                <span className="text-[10px] text-emerald-600 font-semibold">{statusStats.pctConfirmed}%</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-base font-black text-amber-800">{statusStats.pending}</p>
                <p className="text-[10px] font-bold text-amber-700 uppercase">Menunggu</p>
                <span className="text-[10px] text-amber-600 font-semibold">{statusStats.pctPending}%</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-base font-black text-rose-800">{statusStats.rejected}</p>
                <p className="text-[10px] font-bold text-rose-700 uppercase">Ditolak</p>
                <span className="text-[10px] text-rose-600 font-semibold">{statusStats.pctRejected}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DAFTAR TRANSAKSI HARI INI                                      */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Transaksi Masuk Hari Ini ({todayStr})
            </h3>
            <p className="text-xs text-slate-500">
              Daftar donasi yang dikirim donatur pada hari ini
            </p>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {todayTxs.length} Transaksi
          </span>
        </div>

        {todayTxs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada donasi yang masuk hari ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Donatur</th>
                  <th className="py-2.5 px-3">Program</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayTxs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{t.donorName}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                      {donations.find((d) => d.id === t.donationId)?.title || "Program Donasi"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        {t.method}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-teal-800">
                      {formatRupiah(t.amount)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          t.status === TX_CONFIRMED || !t.status
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === TX_REJECTED
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.status || TX_CONFIRMED}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
