import { error, json, readBody } from "@/lib/api";
import { mutate, uid } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sendVolunteerRegisteredEmail } from "@/lib/email";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return error("Silakan login untuk mendaftar relawan.", 401);
  const body = await readBody<{ phone: string; motivation: string }>(req);
  if (!body.motivation?.trim()) return error("Motivasi wajib diisi.");

  let activityDetails: {
    title: string;
    category: string;
    date: string;
    location: string;
  } | null = null;

  const result = await mutate((m) => {
    const act = m.activities.find((a) => a.id === id);
    if (!act) return { fail: "Kegiatan tidak ditemukan." } as const;
    if (act.registered >= act.quota) return { fail: "Kuota relawan sudah penuh." } as const;
    if (m.applications.some((a) => a.activityId === id && a.userId === user.id))
      return { fail: "Anda sudah terdaftar di kegiatan ini." } as const;

    activityDetails = {
      title: act.title,
      category: act.category,
      date: act.date,
      location: act.location,
    };

    m.applications.unshift({
      id: uid("ap-"),
      activityId: act.id,
      activityTitle: act.title,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: body.phone || user.phone,
      motivation: body.motivation.trim(),
      status: "Menunggu",
      appliedDate: new Date().toISOString().split("T")[0],
    });
    act.registered += 1;
    m.notifications.unshift({
      id: uid("nt-"),
      userId: user.id,
      title: "Pendaftaran relawan terkirim",
      body: `Pendaftaran Anda untuk "${act.title}" sedang menunggu seleksi panitia. Cek email Anda untuk konfirmasi pendaftaran.`,
      type: "relawan",
      read: false,
      createdAt: new Date().toISOString().split("T")[0],
    });
    return { ok: true as const, registered: act.registered };
  });

  if ("fail" in result) return error(result.fail as string);

  // Kirim email konfirmasi & terima kasih ke pendaftar volunteer
  if (user.email && activityDetails) {
    const act = activityDetails as { title: string; category: string; date: string; location: string };
    sendVolunteerRegisteredEmail({
      to: user.email,
      volunteerName: user.name,
      activityTitle: act.title,
      category: act.category,
      date: act.date,
      location: act.location,
      volunteerId: user.volunteerId || "NRS-VOL",
    }).catch((err) => console.error("Gagal mengirim email pendaftaran relawan:", err));
  }

  return json(result);
}
