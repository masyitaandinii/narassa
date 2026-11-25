"use client";

import { useState } from "react";
import {
  Users,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Gift,
  FileText,
  ShieldCheck,
  Award,
  Sparkles,
} from "lucide-react";

export interface VolunteerItem {
  id: string;
  name: string;
  appliedDate: string;
  status: string;
}

export default function ActivityTabs({
  description,
  organizer,
  location,
  date,
  quota,
  registered,
  requirements,
  perks,
  volunteers,
}: {
  description: string;
  organizer: string;
  location: string;
  date: string;
  quota: number;
  registered: number;
  requirements: string[];
  perks: string[];
  volunteers: VolunteerItem[];
}) {
  const [active, setActive] = useState<"Tentang" | "Supporter">("Tentang");

  const paragraphs = description.split(/\n+/).filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Tab Navigasi Ala Peduly Screenshot 2 */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActive("Tentang")}
          className={`flex-1 py-3.5 text-center text-xs sm:text-sm font-extrabold transition relative ${
            active === "Tentang" ? "text-brand-dark" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Tentang</span>
          {active === "Tentang" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActive("Supporter")}
          className={`flex-1 py-3.5 text-center text-xs sm:text-sm font-extrabold transition relative ${
            active === "Supporter" ? "text-brand-dark" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Supporter ({registered})</span>
          {active === "Supporter" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full" />
          )}
        </button>
      </div>

      {/* Konten Tab */}
      {active === "Tentang" && (
        <div className="space-y-6">
          {/* Deskripsi Kegiatan */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Tentang Kegiatan
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed space-y-3 font-normal">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          {/* Kotak Info Sertifikat / Member Ala Peduly */}
          <div className="bg-brand-soft border border-brand-light rounded-2xl p-4 flex items-start gap-3">
            <Award className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div className="text-xs text-slate-800 leading-relaxed">
              <strong className="font-extrabold text-brand-dark">Tersedia E-Sertifikat Resmi: </strong>
              Selesaikan kegiatan relawan (tercatat hadir via absensi QR code saat acara) untuk otomatis mendapatkan e-sertifikat ber-barcode resmi NARASSA dan jam kontribusi sosial.
            </div>
          </div>

          {/* Kotak Detail Kegiatan Ala Peduly */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-sm font-extrabold text-slate-900">Detail Kegiatan</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Penyelenggara</span>
                <span className="font-bold text-slate-900">{organizer}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Alamat / Lokasi</span>
                <span className="font-bold text-slate-900">{location}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tanggal Pelaksanaan</span>
                <span className="font-bold text-slate-900">{date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Kuota Relawan</span>
                <span className="font-extrabold text-slate-900">
                  {registered} / {quota} peserta ({Math.max(0, quota - registered)} slot tersisa)
                </span>
              </div>
            </div>

            {/* Tombol Lihat Guidebook Ala Peduly */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert("Guidebook teknis dan rincian rundown akan dibagikan via grup WhatsApp relawan resmi.")}
                className="w-full py-2.5 rounded-full border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" /> Lihat Guidebook Kegiatan
              </button>
            </div>
          </div>

          {/* Syarat Keikutsertaan */}
          {requirements.length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Syarat Keikutsertaan
              </h3>
              <ul className="space-y-2">
                {requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Perks Relawan */}
          {perks.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-brand" /> Fasilitas &amp; Perks Relawan
              </h3>
              <div className="flex flex-wrap gap-2">
                {perks.map((p) => (
                  <span
                    key={p}
                    className="text-[11px] font-bold bg-white border border-slate-200 text-slate-800 px-3 py-1.5 rounded-xl shadow-2xs"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPORTER / RELAWAN TERDAFTAR */}
      {active === "Supporter" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Relawan Terdaftar ({volunteers.length})
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              Kuota {quota} Peserta
            </span>
          </div>

          {volunteers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              Belum ada relawan yang terdaftar. Jadilah yang pertama bergabung!
            </div>
          ) : (
            <div className="space-y-2.5">
              {volunteers.map((v, i) => (
                <div
                  key={v.id || i}
                  className="p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {v.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{v.name}</p>
                      <p className="text-[10px] text-slate-400">Mendaftar pada {v.appliedDate}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      v.status === "Diterima"
                        ? "bg-emerald-100 text-emerald-800"
                        : v.status === "Ditolak"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
