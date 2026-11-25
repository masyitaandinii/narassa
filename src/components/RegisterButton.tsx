"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowLeft, AlertTriangle, Building2, CheckCircle2 } from "lucide-react";
import { api, toast } from "@/lib/client";
import type { Activity } from "@/lib/types";

export default function RegisterButton({
  item,
  className = "w-full py-3 bg-brand hover:bg-brand-dark text-white font-extrabold text-sm rounded-full transition shadow-sm",
  label = "Daftar Sekarang",
}: {
  item: Activity;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [motivation, setMotivation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const router = useRouter();

  const handleRegisterClick = async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch("/api/auth/me");
      const d = await res.json();
      if (!d.user) {
        router.push(`/auth/login?next=/activity/${item.id}`);
        return;
      }
      setName(d.user.name || "");
      const rawPhone = (d.user.phone || "").replace(/^\+?62/, "").replace(/^0/, "");
      setPhone(rawPhone);
      setDone(false);
      setOpen(true);
    } catch {
      router.push(`/auth/login?next=/activity/${item.id}`);
    } finally {
      setCheckingAuth(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivation.trim()) {
      return toast("Mohon isi motivasi keikutsertaan Anda.", "error");
    }

    setBusy(true);
    try {
      const formattedPhone = phone.startsWith("0") ? phone : `0${phone}`;
      await api(`/api/activities/${item.id}/register`, {
        body: { phone: formattedPhone, motivation },
      });

      try {
        const raw = localStorage.getItem("narassa_my_activities");
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(item.id)) {
          ids.push(item.id);
          localStorage.setItem("narassa_my_activities", JSON.stringify(ids));
        }
      } catch {}

      setDone(true);
      toast("Pendaftaran relawan berhasil dikirim! Cek email Anda untuk konfirmasi.");
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes("login")) {
        setOpen(false);
        router.push(`/auth/login?next=/activity/${item.id}`);
      }
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const full = item.registered >= item.quota;

  return (
    <>
      <button
        onClick={handleRegisterClick}
        disabled={full || checkingAuth}
        className={`${className} ${full || checkingAuth ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {checkingAuth ? "Memeriksa Sesi..." : full ? "Kuota Penuh" : label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-slate-100 shadow-2xl my-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-800 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pendaftaran Kegiatan Relawan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Pendaftaran Berhasil Terkirim!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Terima kasih telah bergabung. Pendaftaran Anda untuk kegiatan{" "}
                    <strong className="text-slate-800">"{item.title}"</strong> telah kami terima. Detail informasi dan tiket kegiatan telah dikirimkan ke email Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-full transition shadow-sm"
                >
                  Tutup &amp; Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {/* Mini Card Kegiatan */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900 line-clamp-1 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      {item.organizer} · {item.location}
                    </p>
                  </div>
                </div>

                {/* Data Diri Peserta */}
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-slate-900">Data Diri Peserta Relawan</p>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Lengkap Anda"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Nomor WhatsApp
                    </label>
                    <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand bg-white">
                      <span className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-600 flex items-center">
                        +62
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="81234567890"
                        className="w-full px-3 py-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Motivasi &amp; Alasan Bergabung
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      placeholder="Ceritakan alasan dan keahlian yang ingin Anda kontribusikan..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Warning Box Ala Peduly */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      <strong>Perhatian:</strong> Pastikan nomor WhatsApp yang Anda masukkan sudah benar dan aktif agar panitia kegiatan dapat menghubungi Anda untuk koordinasi grup.
                    </p>
                  </div>
                </div>

                {/* Ringkasan Biaya */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Pendaftaran Relawan</span>
                    <span className="font-bold text-emerald-600">Gratis (Rp0)</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold pt-1">
                    <span>Total Biaya Partisipasi</span>
                    <span className="text-brand-dark text-sm">Rp0</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-extrabold text-sm rounded-full transition shadow-md cursor-pointer"
                >
                  {busy ? "Memproses Pendaftaran..." : "Daftar Sekarang"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
