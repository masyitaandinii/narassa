"use client";

import { useState } from "react";
import { Users, Target, CalendarClock, ShieldCheck, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";

export interface FeedItem {
  id: string;
  title: string;
  body: string;
  date: string;
  tag: string;
}

export interface TxItem {
  id: string;
  name: string;
  meta: string;
  amount: string;
  status?: string;
  note?: string;
}

const TABS = ["Tentang", "Supporter", "Kabar Terbaru"];

export default function DonationTabs({
  description,
  feed,
  txs,
  collected,
  target,
  donors,
  pct,
  endDateLabel,
}: {
  description: string;
  feed: FeedItem[];
  txs: TxItem[];
  collected: number;
  target: number;
  donors: number;
  pct: number;
  endDateLabel: string;
}) {
  const [active, setActive] = useState(TABS[0]);

  const paragraphs = description.split(/\n+/).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Tab Navigation Ala Peduly dengan Palet NARASSA */}
      <div className="flex border-b border-slate-200">
        {TABS.map((t) => {
          const on = active === t;
          const countBadge =
            t === "Supporter" ? `(${donors})` : t === "Kabar Terbaru" && feed.length > 0 ? `(${feed.length})` : "";
          return (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`flex-1 py-3.5 text-center text-xs sm:text-sm font-extrabold transition relative ${
                on
                  ? "text-brand-dark"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{t} {countBadge}</span>
              {on && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Konten Tab */}
      <div className="py-2">
        {/* TAB 1: TENTANG KAMPANYE */}
        {active === "Tentang" && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Tentang Kampanye
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed space-y-3 font-normal">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 mt-4">
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Jaminan Transparansi &amp; Keamanan NARASSA
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Setiap rupiah yang terkumpul diverifikasi manual oleh staf administrasi dan disalurkan secara berkala sesuai kebutuhan langsung para penerima manfaat. Laporan penyaluran dapat diakses publik kapan saja.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SUPPORTER / DONATUR */}
        {active === "Supporter" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Para Orang Baik ({txs.length} Riwayat Terkini)
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                Total {donors} Donatur
              </span>
            </div>

            {txs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Jadilah orang baik pertama yang berdonasi untuk program ini!
              </div>
            ) : (
              <div className="space-y-2.5">
                {txs.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl flex items-start gap-3 shadow-2xs transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-light text-brand-dark font-black text-xs flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-slate-900 truncate">{t.name}</p>
                        <p className="text-xs font-black text-brand-dark shrink-0">{t.amount}</p>
                      </div>
                      <p className="text-[10px] text-slate-400">{t.meta}</p>
                      {t.note && (
                        <p className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded-xl mt-1">
                          "{t.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KABAR TERBARU */}
        {active === "Kabar Terbaru" && (
          <div className="space-y-3">
            {feed.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Belum ada pembaruan kabar terbaru untuk kampanye ini.
              </div>
            ) : (
              feed.map((f) => (
                <div key={f.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900">{f.title}</span>
                    <span className="text-[11px] text-slate-400">{f.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.body}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
