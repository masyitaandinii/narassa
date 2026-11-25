"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HandHeart, Users, CalendarDays, QrCode } from "lucide-react";

const items = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/donation", label: "Donasi", icon: HandHeart },
  { href: "/activity", label: "Relawan", icon: Users },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/attendance", label: "QR Absen", icon: QrCode },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/50 px-2 py-2.5 flex justify-around text-[10px] font-semibold text-slate-500 shadow-lg">
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors ${
              active ? "text-brand" : "hover:text-brand"
            }`}
          >
            <it.icon className={`w-5 h-5 ${active ? "text-brand" : ""}`} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
