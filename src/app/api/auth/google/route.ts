import { error, json, readBody } from "@/lib/api";
import { getDB, mutate, uid } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await readBody<{
      email: string;
      name?: string;
      avatar?: string;
      googleId?: string;
    }>(req);

    const email = (body.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error("Email Google tidak valid.", 400);
    }

    const name = (body.name || "").trim() || email.split("@")[0];
    const avatar = (body.avatar || "").trim();

    const db = await getDB();
    let existingUser = db.users.find((u) => u.email.toLowerCase() === email);

    if (existingUser) {
      // Perbarui avatar jika ada yang baru
      if (avatar && !existingUser.avatar) {
        await mutate((m) => {
          const u = m.users.find((x) => x.id === existingUser!.id);
          if (u) u.avatar = avatar;
        });
      }
      await setSessionCookie(existingUser.id);
      return json({
        ok: true,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Buat akun baru berbasis Google SSO
    const newUser = await mutate((m) => {
      const u = {
        id: uid("u-"),
        name,
        email,
        phone: "",
        passwordHash: "oauth-google-authenticated",
        role: "user" as const,
        avatar,
        city: "",
        bio: "Akun terhubung melalui Google SSO",
        volunteerId: "NRS-VOL-" + Math.floor(10000 + Math.random() * 89999),
        createdAt: new Date().toISOString().split("T")[0],
      };
      m.users.push(u);
      m.notifications.push({
        id: uid("nt-"),
        userId: u.id,
        title: "Selamat datang di NARASSA!",
        body: "Akun Anda berhasil terhubung melalui Google SSO. Silakan lengkapi profil dan mulailah berbagi kebaikan.",
        type: "sistem",
        read: false,
        createdAt: new Date().toISOString().split("T")[0],
      });
      return u;
    });

    await setSessionCookie(newUser.id);
    return json({
      ok: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return error(err.message || "Gagal memproses otentikasi Google SSO.", 500);
  }
}
