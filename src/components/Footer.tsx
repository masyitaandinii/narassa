import Link from "next/link";
import { Phone, Mail, Instagram, Facebook, Youtube, ArrowUpRight } from "lucide-react";

const NAV_LINKS: [string, string][] = [
  ["/about", "Tentang Kami"],
  ["/about", "Kemitraan Komunitas"],
  ["/impact", "Transparansi & Dampak"],
];

const CATEGORY_LINKS: [string, string][] = [
  ["/donation", "NARASSA Berbagi"],
  ["/activity", "NARASSA Mengabdi"],
  ["/activity?category=Lingkungan", "NARASSA Hijau"],
  ["/activity?category=Pendidikan", "NARASSA Mengajar"],
  ["/calendar", "NARASSA Ekspedisi"],
];

export default function Footer() {
  return (
    <footer className="bg-white text-slate-500 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Column 1 — Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-narassa-icon.svg"
                alt=""
                width={46}
                height={40}
                loading="lazy"
                className="h-10 w-auto"
              />
              <span className="font-black text-slate-900 text-lg">NARASSA</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Ruang bagi siapa pun yang ingin peduli, berkolaborasi, dan mewujudkan perubahan
              nyata melalui aksi sosial di seluruh Indonesia.
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-sage flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-xl bg-sage flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-9 h-9 rounded-xl bg-sage flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2 — Quick Navigation */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-4">Navigasi Cepat</h4>
            <ul className="space-y-3">
              {NAV_LINKS.map(([href, label]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-brand transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Action Categories */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-4">Kategori Aksi</h4>
            <ul className="space-y-3">
              {CATEGORY_LINKS.map(([href, label]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-brand transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:narassaindonesia@gmail.com"
                  className="text-sm text-slate-500 hover:text-brand transition-colors inline-flex items-center gap-2 break-all"
                >
                  <Mail className="w-4 h-4 shrink-0" /> narassaindonesia@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+622150889421"
                  className="text-sm text-slate-500 hover:text-brand transition-colors inline-flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 shrink-0" /> +62 21 5088 9421
                </a>
              </li>
              <li className="text-xs text-slate-400 pt-1">Senin–Sabtu · 08.00–17.00 WIB</li>
              <li>
                <Link
                  href="/impact"
                  className="text-sm text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1.5 font-semibold"
                >
                  Laporan Dampak <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
          <p>© 2026 NARASSA — Platform Social Community. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-brand transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms-of-service" className="hover:text-brand transition-colors">
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
