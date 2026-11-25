import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDB, getPaymentAccounts } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { isPending } from "@/lib/payment";
import AdminPanel from "@/components/AdminPanel";
import {
  Wallet,
  CalendarDays,
  Users,
  Clock,
  ShieldCheck,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel Admin NARASSA" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/admin");
  if (user.role !== "admin") redirect("/");

  const db = await getDB();
  const totalCollected = db.donations.reduce((s, d) => s + d.collected, 0);
  const userMap = new Map(db.users.map((u) => [u.id, u]));

  const stats = [
    {
      label: "Total Terkumpul",
      value: formatRupiah(totalCollected),
      icon: Wallet,
      color: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      label: "Program Donasi",
      value: String(db.donations.length),
      icon: ShieldCheck,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Kegiatan Relawan",
      value: String(db.activities.length),
      icon: CalendarDays,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      label: "Kandidat Menunggu",
      value: String(db.applications.filter((a) => a.status === "Menunggu").length),
      icon: Users,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      label: "Verifikasi Donasi",
      value: String(db.txs.filter(isPending).length),
      icon: Clock,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      alert: db.txs.filter(isPending).length > 0,
    },
    {
      label: "Pengguna Terdaftar",
      value: String(db.users.length),
      icon: Award,
      color: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Panel Pengelola NARASSA
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Pusat kendali donasi QRIS pribadi, verifikasi dana, kegiatan relawan, grafik analitik harian, dan e-sertifikat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
            Admin: {user.name}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`bg-white border rounded-2xl p-4 space-y-2 shadow-2xs hover:shadow-xs transition ${
                s.alert ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                {s.alert && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.2 rounded-md">
                    Perlu Cek
                  </span>
                )}
              </div>
              <div>
                <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {s.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight mt-0.5">
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <AdminPanel
        initial={{
          applications: db.applications,
          txs: db.txs,
          certificates: db.certificates,
          users: db.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            volunteerId: u.volunteerId,
          })),
          activities: db.activities.map((a) => ({
            id: a.id,
            title: a.title,
            category: a.category,
            type: a.type,
            location: a.location,
            date: a.date,
            deadline: a.deadline,
            quota: a.quota,
            registered: a.registered,
            description: a.description,
            absenCode: a.absenCode,
            image: a.image,
          })),
          donations: db.donations.map((d) => ({
            id: d.id,
            title: d.title,
            category: d.category,
            organizer: d.organizer,
            target: d.target,
            collected: d.collected,
            donorsCount: d.donorsCount,
            endDate: d.endDate,
            urgent: d.urgent,
            verified: d.verified,
            description: d.description,
            image: d.image,
          })),
          attendance: db.attendance.map((a) => {
            const u = userMap.get(a.userId);
            return {
              id: a.id,
              activityId: a.activityId,
              name: u?.name || "Relawan",
              volunteerId: u?.volunteerId || "-",
              checkInAt: a.checkInAt,
            };
          }),
          paymentAccounts: getPaymentAccounts(db),
        }}
      />
    </div>
  );
}
