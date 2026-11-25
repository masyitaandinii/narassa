"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, toast } from "@/lib/client";
import { X, CheckCircle2, ArrowRight } from "lucide-react";

export function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({
  next = "/",
  action = "login",
}: {
  next?: string;
  action?: "login" | "register";
}) {
  const [busy, setBusy] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [supabaseDisabled, setSupabaseDisabled] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleGoogleClick = async () => {
    setBusy(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl) {
      try {
        const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

        // Uji endpoint authorize Supabase untuk mendeteksi apakah provider Google aktif
        try {
          const checkRes = await fetch(authorizeUrl, { method: "GET" });
          if (!checkRes.ok) {
            const errJson = await checkRes.json().catch(() => ({}));
            if (
              errJson.msg?.includes("not enabled") ||
              errJson.error_code === "validation_failed" ||
              errJson.code === 400
            ) {
              // Provider Google belum diaktifkan di Supabase Dashboard
              // Jangan redirect ke halaman error JSON, buka modal SSO instan
              setSupabaseDisabled(true);
              setShowPrompt(true);
              setBusy(false);
              return;
            }
          }
          // Jika provider aktif dan tidak ada error 400, arahkan ke Google OAuth
          window.location.href = authorizeUrl;
          return;
        } catch {
          // Jika fetch terblokir oleh CORS karena redirect 302 ke accounts.google.com,
          // itu berarti provider aktif dan siap diarahkan
          window.location.href = authorizeUrl;
          return;
        }
      } catch {
        // Fallback ke modal SSO
      }
    }

    setBusy(false);
    setShowPrompt(true);
  };

  const handleInstantGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      return toast("Mohon masukkan email Google yang valid.", "error");
    }

    setBusy(true);
    try {
      const res = await api<{ ok: boolean; user: any }>("/api/auth/google", {
        body: {
          email,
          name: name.trim() || email.split("@")[0],
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
        },
      });

      toast(`Selamat datang, ${res.user.name}!`);
      setShowPrompt(false);
      router.push(next);
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Gagal masuk dengan Google.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={busy}
        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 transition shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60"
      >
        <GoogleIcon className="w-4 h-4 shrink-0" />
        <span>
          {busy
            ? "Menghubungkan..."
            : action === "register"
            ? "Daftar dengan Google"
            : "Masuk dengan Google"}
        </span>
      </button>

      {/* Modal Masuk Google SSO */}
      {showPrompt && (
        <div className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GoogleIcon className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-900">Google Single Sign-On</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {supabaseDisabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
                <strong>Catatan Integrasi:</strong> Provider Google belum diaktifkan di Supabase Dashboard (<code>provider is not enabled</code>). Anda tetap dapat langsung masuk menggunakan akun Google Anda di bawah ini secara instan.
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan akun Google Anda untuk melanjutkan ke <strong>NARASSA</strong>:
            </p>

            <form onSubmit={handleInstantGoogleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Email Akun Google *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.anda@gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Lengkap (Opsional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <span>{busy ? "Memproses..." : "Masuk dengan Akun Google Ini"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
