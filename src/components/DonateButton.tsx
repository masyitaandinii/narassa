"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Plus,
  QrCode,
  Upload,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Mail,
  User,
  Phone,
  Building2,
  Trash2,
  Download,
} from "lucide-react";
import QRCode from "qrcode";
import { formatRupiah } from "@/lib/format";
import { api, toast } from "@/lib/client";
import { MAX_DONATION, MIN_DONATION } from "@/lib/payment";
import type { Donation, PaymentAccount } from "@/lib/types";

const MODAL_PRESETS = [10000, 25000, 50000, 100000, 250000, 500000];
const PANEL_PRESETS = [20000, 50000, 100000, 250000, 500000];

export default function DonateButton({
  item,
  className = "w-full py-3 bg-brand hover:bg-brand-dark text-white font-extrabold text-sm rounded-full transition shadow-sm",
  label = "Donasi Sekarang",
  variant = "button",
  accounts = [],
}: {
  item: Donation;
  className?: string;
  label?: React.ReactNode;
  variant?: "button" | "panel";
  accounts?: PaymentAccount[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"checkout" | "qris_upload" | "success">("checkout");
  const [selected, setSelected] = useState(50000);
  const [custom, setCustom] = useState("");
  const method = "QRIS";
  const [anon, setAnon] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [proofImage, setProofImage] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [createdTxId, setCreatedTxId] = useState("");
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ambil profil login otomatis saat modal dibuka jika tersedia
  useEffect(() => {
    if (open && !name && !email) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (d.user) {
            setName(d.user.name || "");
            setEmail(d.user.email || "");
            const rawPhone = (d.user.phone || "").replace(/^\+?62/, "").replace(/^0/, "");
            setPhone(rawPhone);
          }
        })
        .catch(() => {});
    }
  }, [open, name, email]);

  const finalAmt = (custom ? parseFloat(custom) : selected) || 0;

  // Akun QRIS Organisasi NARASSA
  const qrisAccount = {
    method: "QRIS",
    number: "9182000123456789",
    owner: "PT NARASSA INDONESIA",
    nmid: "ID1020030040050",
  };

  // Generate QR Code QRIS
  useEffect(() => {
    if (finalAmt > 0) {
      const qrisData = `00020101021226600016ID.CO.NARASSA01189182000123456789520458125303360540${Math.round(
        finalAmt
      )}5802ID5916NARASSA PEDULI6007JAKARTA6304A1B2`;
      QRCode.toDataURL(qrisData, {
        width: 260,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then(setQrCodeUrl)
        .catch(() => {});
    }
  }, [finalAmt]);

  const pickAmount = (amt: number) => {
    setSelected(amt);
    setCustom("");
  };

  const amountError = () =>
    finalAmt < MIN_DONATION
      ? `Minimal donasi ${formatRupiah(MIN_DONATION)}.`
      : finalAmt > MAX_DONATION
      ? `Maksimal donasi ${formatRupiah(MAX_DONATION)}.`
      : "";

  const openModal = async () => {
    const err = amountError();
    if (err) return toast(err, "error");

    setCheckingAuth(true);
    try {
      const res = await fetch("/api/auth/me");
      const d = await res.json();
      if (!d.user) {
        const currentPath = typeof window !== "undefined" ? window.location.pathname : `/donation/${item.id}`;
        router.push(`/auth/login?next=${encodeURIComponent(currentPath)}`);
        return;
      }
      setName(d.user.name || "");
      setEmail(d.user.email || "");
      const rawPhone = (d.user.phone || "").replace(/^\+?62/, "").replace(/^0/, "");
      setPhone(rawPhone);
      setStep("checkout");
      setProofImage("");
      setReference("");
      setOpen(true);
    } catch {
      router.push(`/auth/login?next=/donation/${item.id}`);
    } finally {
      setCheckingAuth(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    if (step === "success") {
      setStep("checkout");
      setCustom("");
      setNote("");
      setReference("");
      setProofImage("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast("Nomor berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast("File bukti transfer harus berupa gambar.", "error");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          setProofImage(compressedDataUrl);
          toast("Bukti transfer berhasil dipilih.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const proceedToQrisUpload = () => {
    const err = amountError();
    if (err) return toast(err, "error");
    if (!name.trim()) return toast("Mohon masukkan nama lengkap.", "error");
    if (!phone.trim()) return toast("Mohon masukkan nomor WhatsApp.", "error");
    if (!email.trim() || !email.includes("@")) {
      return toast("Mohon masukkan email yang valid untuk menerima tanda terima donasi.", "error");
    }
    setStep("qris_upload");
  };

  const submitDonation = async () => {
    if (!proofImage) {
      return toast("Silakan unggah foto/screenshot bukti pembayaran terlebih dahulu.", "error");
    }

    setBusy(true);
    try {
      const formattedPhone = phone.startsWith("0") ? phone : `0${phone}`;
      const res = await api<{ ok: boolean; txId: string; message: string }>(
        `/api/donations/${item.id}/donate`,
        {
          body: {
            amount: finalAmt,
            method: "QRIS",
            anon,
            donorName: anon ? "Donatur Anonim" : name.trim(),
            donorEmail: email.trim(),
            donorPhone: formattedPhone,
            note: note.trim(),
            reference: reference.trim(),
            bukti: proofImage,
          },
        }
      );

      setCreatedTxId(res.txId || "");
      setStep("success");
      toast("Bukti donasi berhasil dikirim! Menunggu verifikasi admin.");
    } catch (e: any) {
      toast(e.message || "Gagal mengirim donasi.", "error");
    } finally {
      setBusy(false);
    }
  };

  const modal =
    open &&
    createPortal(
      <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 border border-slate-100 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
          {/* ============================================================== */}
          {/* STEP 1: CHECKOUT SESUAI REFERENSI PEDULY                        */}
          {/* ============================================================== */}
          {step === "checkout" && (
            <div className="space-y-4">
              {/* Header Navigasi */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-1 text-slate-500 hover:text-slate-800 transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Pembayaran Donasi
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Tutup"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mini Card Preview Program */}
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
                    {item.organizer}
                  </p>
                </div>
              </div>

              {/* Pilihan Nominal Donasi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Pilih Nominal Donasi</span>
                  <span className="text-[10px] text-brand-dark font-bold">Bebas Biaya Admin</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MODAL_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => pickAmount(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                        selected === amt && !custom
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "border-slate-200 text-slate-700 hover:border-brand bg-white"
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={MIN_DONATION}
                    step="any"
                    placeholder="Atau isi nominal bebas lainnya..."
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Formulir Data Diri Donatur */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-extrabold text-slate-900">Data Diri Donatur</p>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Masyita Andini"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    required
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="81234567890"
                      className="w-full px-3 py-2.5 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Alamat Email (untuk Tanda Terima &amp; Ucapan Terima Kasih)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@anda.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                </div>

                {/* Pilihan Donasi Anonim (Hamba Allah) */}
                <label className="flex items-start gap-3 p-3 bg-brand-soft/70 hover:bg-brand-soft border border-brand-light rounded-2xl cursor-pointer transition select-none">
                  <input
                    type="checkbox"
                    checked={anon}
                    onChange={(e) => setAnon(e.target.checked)}
                    className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-900 block">
                      Donasi sebagai Donatur Anonim (Hamba Allah)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Nama Anda akan disamarkan sebagai &quot;Hamba Allah / Donatur Anonim&quot; pada riwayat publik.
                    </span>
                  </div>
                </label>

                {/* Kotak Peringatan / Perhatian Ala Peduly */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    <strong>Perhatian:</strong> Pastikan nomor WhatsApp dan email yang Anda masukkan sudah benar dan aktif agar tanda terima donasi dan konfirmasi verifikasi admin dapat terkirim.
                  </p>
                </div>
              </div>

              {/* Bagian Metode Pembayaran - Khusus 1 QRIS Saja */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-slate-900">Metode Pembayaran</p>
                  <span className="text-[10px] font-bold text-brand-dark bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-light">
                    Bebas Biaya Admin (Rp0)
                  </span>
                </div>
                <div className="p-3.5 border-2 border-brand/20 bg-brand-soft/50 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-brand text-white font-black text-xs flex items-center justify-center shadow-xs">
                      QRIS
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        QRIS (GoPay, OVO, ShopeePay, BCA, Mandiri &amp; Semua Bank)
                      </p>
                      <p className="text-[11px] text-brand-dark font-medium mt-0.5">
                        Scan barcode instan · Otomatis &amp; Real-time
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark bg-brand-light px-2.5 py-1 rounded-full border border-brand-light">
                    1 Pilihan Aktif
                  </span>
                </div>
              </div>

              {/* Ringkasan Biaya Donasi Ala Peduly */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-extrabold text-slate-900">Ringkasan Donasi</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Nominal Donasi</span>
                    <span className="font-bold text-slate-900">{formatRupiah(finalAmt)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Transaksi (QRIS Pribadi)</span>
                    <span className="font-bold text-emerald-600">Rp0</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-200 text-slate-900">
                    <span>Total Donasi</span>
                    <span className="text-brand-dark text-base">{formatRupiah(finalAmt)}</span>
                  </div>
                </div>
              </div>

              {/* Tombol Bayar Sekarang Ala Peduly */}
              <button
                type="button"
                onClick={proceedToQrisUpload}
                className="w-full py-3.5 bg-brand hover:bg-brand-dark text-white font-extrabold text-sm rounded-full transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Bayar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: SCAN QRIS PRIBADI & UPLOAD BUKTI TRANSFER              */}
          {/* ============================================================== */}
          {step === "qris_upload" && (
            <div className="space-y-4">
              {/* Header Kembali */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("checkout")}
                    className="p-1 text-slate-500 hover:text-slate-800 transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Instruksi &amp; Bukti Transfer
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Tutup"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info Nominal Transfer */}
              <div className="p-3 bg-brand-soft border border-brand-light rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Total Nominal Transfer:</p>
                  <p className="text-base font-black text-brand-dark">{formatRupiah(finalAmt)}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-brand text-white px-2.5 py-1 rounded-full">
                  Pas Sesuai Nominal
                </span>
              </div>

              {/* Tampilan Khusus 1 QRIS Pribadi NARASSA Saja */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 text-center space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-left">
                  <div>
                    <p className="text-xs font-black text-slate-900">QRIS Resmi NARASSA</p>
                    <p className="text-[10px] text-slate-500">NMID: {qrisAccount.nmid}</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-dark bg-brand-light px-2 py-0.5 rounded-md border border-brand-light">
                    Bebas Biaya Admin
                  </span>
                </div>

                {qrCodeUrl ? (
                  <div className="inline-block p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <img
                      src={qrCodeUrl}
                      alt="QRIS Donasi"
                      className="w-48 h-48 mx-auto rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-white rounded-2xl flex items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12 animate-pulse" />
                  </div>
                )}

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!qrCodeUrl) return;
                      const a = document.createElement("a");
                      a.href = qrCodeUrl;
                      a.download = `QRIS-NARASSA-${item.id}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      toast("QRIS berhasil diunduh.");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-xs font-bold text-slate-700 transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-brand" /> Unduh QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(finalAmt))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-xs font-bold text-slate-700 transition shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Nominal Tersalin" : "Salin Nominal"}
                  </button>
                </div>

                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Buka m-Banking (<strong>BCA, Livin Mandiri, BRImo, BNI, BSI</strong>) atau E-Wallet (<strong>GoPay, OVO, Dana, ShopeePay</strong>), lalu scan QRIS di atas.
                </p>
              </div>

              {/* Unggah Bukti Transfer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Unggah Bukti Transfer (Screenshot/Struk) *</span>
                  <span className="text-[10px] text-slate-400">Wajib diisi</span>
                </label>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {proofImage ? (
                  <div className="relative border-2 border-dashed border-brand-accent bg-brand-soft rounded-2xl p-3 text-center space-y-2">
                    <img
                      src={proofImage}
                      alt="Pratinjau Bukti"
                      className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200 shadow-xs"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-brand-dark bg-white border border-brand-light px-3 py-1.5 rounded-lg hover:bg-brand-soft transition"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setProofImage("")}
                        className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-brand bg-slate-50/60 rounded-2xl p-5 text-center cursor-pointer transition space-y-1.5"
                  >
                    <div className="w-10 h-10 mx-auto rounded-full bg-brand-light text-brand-dark flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Klik untuk memilih tangkapan layar bukti transfer
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Format JPG / PNG (kompresi otomatis)
                    </p>
                  </div>
                )}
              </div>

              {/* No Ref & Doa */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">
                    Nomor Referensi Struk Transfer (opsional)
                  </label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Contoh: 20261124192348"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700">
                    Pesan / Doa Donatur (opsional)
                  </label>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tuliskan doa atau pesan kebaikan..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={anon}
                    onChange={(e) => setAnon(e.target.checked)}
                    className="w-4 h-4 rounded accent-brand"
                  />
                  <span>Sembunyikan nama saya dari daftar publik (Donatur Anonim)</span>
                </label>
              </div>

              {/* Tombol Kirim Bukti */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("checkout")}
                  className="w-1/3 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full transition"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={submitDonation}
                  disabled={busy || !proofImage}
                  className="w-2/3 py-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {busy ? "Mengirim Bukti..." : "Kirim Bukti Pembayaran"}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: SUKSES / TERKIRIM                                      */}
          {/* ============================================================== */}
          {step === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">
                  Bukti Donasi Berhasil Dikirim!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Terima kasih banyak atas ketulusan hati Anda. Donasi sebesar{" "}
                  <strong className="text-slate-900">{formatRupiah(finalAmt)}</strong> telah tercatat dan saat ini sedang dalam proses verifikasi tim admin.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Transaksi:</span>
                  <span className="font-mono font-bold text-slate-800">{createdTxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Menunggu Verifikasi Admin
                  </span>
                </div>
                {email && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Email Feedback:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                      Terkirim ke {email}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-full transition shadow-sm"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    );

  const trigger = (
    <button
      onClick={openModal}
      disabled={checkingAuth}
      className={`${className} ${checkingAuth ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {checkingAuth ? "Memeriksa Sesi..." : label}
    </button>
  );

  if (variant === "panel") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-slate-900">Pilih Nominal Donasi Cepat</p>
        <div className="grid grid-cols-3 gap-2">
          {PANEL_PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => pickAmount(amt)}
              className={`py-2.5 rounded-xl text-[11px] font-bold border transition ${
                selected === amt && !custom
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "border-slate-200 text-slate-700 bg-white hover:border-brand hover:text-brand-dark"
              }`}
            >
              {formatRupiah(amt)}
            </button>
          ))}
          <button
            onClick={() => document.getElementById("nominal-lainnya")?.focus()}
            className="py-2.5 rounded-xl text-[11px] font-bold border border-dashed border-slate-300 text-slate-500 hover:border-brand hover:text-brand-dark transition inline-flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> Lainnya...
          </button>
        </div>
        <input
          id="nominal-lainnya"
          type="number"
          inputMode="decimal"
          min={MIN_DONATION}
          step="any"
          placeholder="Nominal bebas (Rp)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {trigger}
        {modal}
      </div>
    );
  }

  return (
    <>
      {trigger}
      {modal}
    </>
  );
}
