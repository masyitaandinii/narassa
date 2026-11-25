import Link from "next/link";
import { Users, BadgeCheck } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { Donation } from "@/lib/types";
import DonateButton from "./DonateButton";

export default function DonationCard({
  item,
}: {
  item: Donation;
  showDays?: boolean;
}) {
  const pct = Math.min(100, Math.round((item.collected / item.target) * 100));
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3 flex flex-col justify-between hover:shadow-md transition">
      <div className="space-y-3">
        <Link href={`/donation/${item.id}`} className="relative block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="w-full h-40 object-cover rounded-lg" />
        </Link>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600">{item.category}</span>
          {item.verified && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-brand">
              <BadgeCheck className="w-3.5 h-3.5" /> Terverifikasi
            </span>
          )}
        </div>

        <Link href={`/donation/${item.id}`}>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug hover:text-brand-dark">
            {item.title}
          </h3>
        </Link>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-brand-dark">{formatRupiah(item.collected)}</span>
            <span className="text-slate-400 font-normal">Target {formatRupiah(item.target)}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-brand h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {item.donorsCount} Donatur
          </span>
          <span>{pct}% tercapai</span>
        </div>
      </div>

      <DonateButton item={item} />
    </div>
  );
}
