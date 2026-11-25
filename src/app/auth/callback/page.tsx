"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, toast } from "@/lib/client";

function CallbackInner() {
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    async function handleAuth() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase URL / Anon Key tidak ditemukan.");
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!data.session?.user) {
          throw new Error("Tidak ada sesi login Google yang terdeteksi.");
        }

        const user = data.session.user;
        const email = user.email;
        if (!email) throw new Error("Email akun Google tidak ditemukan.");

        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split("@")[0];
        const avatar =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

        // Sinkronisasi ke database NARASSA dan set session cookie
        const res = await api<{ ok: boolean; user: any }>("/api/auth/google", {
          body: {
            email,
            name: fullName,
            avatar,
            googleId: user.id,
          },
        });

        toast(`Selamat datang, ${res.user.name}!`);
        router.push(next);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal menyelesaikan proses login Google.");
      }
    }

    handleAuth();
  }, [next, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-sm text-center">
        {errorMsg ? (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto font-black text-lg">
              !
            </div>
            <h1 className="font-extrabold text-slate-900 text-base">Otentikasi Gagal</h1>
            <p className="text-xs text-rose-600 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl transition"
            >
              Kembali ke Login
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="font-extrabold text-slate-900 text-base">Menghubungkan Akun Google...</h1>
            <p className="text-xs text-slate-500">Mohon tunggu sebentar, sesi Anda sedang diproses.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
