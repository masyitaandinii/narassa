"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Users,
  TrendingUp,
  FileText,
  Newspaper,
} from "lucide-react";
import { api, toast } from "@/lib/client";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  volunteerId?: string;
}

const MAIN_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/activity", label: "Kegiatan" },
  { href: "/calendar", label: "Kalender" },
  { href: "/donation", label: "Donasi" },
  { href: "/blog", label: "Berita & Isu" },
];

const MORE_LINKS = [
  { href: "/impact", label: "Dampak Sosial", icon: TrendingUp },
  { href: "/attendance", label: "Absensi QR", icon: Users },
  { href: "/certificates", label: "E-Sertifikat", icon: FileText },
  { href: "/feed", label: "Kabar Terbaru", icon: Newspaper },
  { href: "/about", label: "Tentang Kami", icon: Newspaper },
];

export default function Header() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const u = d.user || null;
        setUser(u);
        if (u) {
          fetch("/api/notifications")
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((res) => {
              if (active) setNotifs(res.items || []);
            })
            .catch(() => { });
        } else {
          setNotifs([]);
        }
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, [pathname]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setMoreOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setNotifOpen(false);
    setUserMenuOpen(false);
    toast("Anda telah keluar dari sesi.");
    router.push("/");
  };

  const markRead = async () => {
    if (!user) return;
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200/50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* --- Brand Logo --- */}
          <Link href="/" className="shrink-0 flex items-center gap-2.5" aria-label="NARASSA — Beranda">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-narassa-icon.svg"
              alt=""
              width={46}
              height={40}
              fetchPriority="high"
              className="h-10 w-auto"
            />
            <span className="font-black text-xl tracking-tight text-brand leading-none">
              NARASSA
            </span>
          </Link>

          {/* --- Desktop Navigation --- */}
          <nav className="hidden md:flex items-center gap-1">
            {MAIN_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(l.href)
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:bg-sage hover:text-brand"
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => { e.stopPropagation(); setMoreOpen(!moreOpen); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 transition-all duration-200 ${
                  moreOpen
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:bg-sage hover:text-brand"
                }`}
              >
                Lainnya
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              {moreOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {MORE_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-sage hover:text-brand transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <l.icon className="w-4 h-4 text-slate-400" /> {l.label}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* --- Right: bell + profile --- */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification bell */}
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) markRead();
                }}
                className="p-2.5 rounded-xl hover:bg-sage text-slate-500 hover:text-brand relative transition-colors"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 text-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-900">Notifikasi</span>
                    {unread > 0 && (
                      <span className="text-xs bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-semibold">
                        {unread} Baru
                      </span>
                    )}
                  </div>
                  {user ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifs.length === 0 && (
                        <p className="text-slate-400 py-6 text-center text-sm">Belum ada notifikasi.</p>
                      )}
                      {notifs.slice(0, 6).map((n) => (
                        <div key={n.id} className={`p-3 rounded-xl space-y-1 ${n.read ? "bg-slate-50" : "bg-brand-soft border border-brand-light"}`}>
                          <p className="font-semibold text-slate-900 text-sm">{n.title}</p>
                          <p className="text-xs text-slate-500">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center space-y-3">
                      <p className="text-slate-500 text-sm">Login untuk melihat notifikasi.</p>
                      <Link
                        href="/auth/login"
                        className="inline-block px-5 py-2 bg-brand text-white font-semibold rounded-xl text-sm hover:bg-brand-dark transition"
                      >
                        Masuk
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative" data-dropdown>
                <button
                  onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                  className="flex items-center gap-2 bg-sage border border-sage-dark rounded-xl pl-1.5 pr-3.5 py-1.5 hover:border-brand/30 transition-all"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand text-white font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-sm font-semibold text-slate-700">{user.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 text-sm font-medium text-slate-700">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-sage hover:text-brand transition-colors"
                    >
                      <User className="w-4 h-4" /> Profil Saya
                    </Link>
                    <Link
                      href="/notification"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-sage hover:text-brand transition-colors"
                    >
                      <Bell className="w-4 h-4" /> Notifikasi
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" /> Panel Admin
                      </Link>
                    )}
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-block text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-sage hover:text-brand transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-semibold px-5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white shadow-sm transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 text-slate-600 rounded-xl hover:bg-sage transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* --- Mobile Menu Overlay --- */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-2">
            {[...MAIN_LINKS, ...MORE_LINKS].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? "bg-brand text-white"
                    : "text-slate-700 hover:bg-sage hover:text-brand"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
