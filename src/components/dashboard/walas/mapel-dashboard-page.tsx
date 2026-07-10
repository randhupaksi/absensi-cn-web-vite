"use client";

import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { WalasShell } from "@/components/dashboard/staff/walas-shell";
import {
  getTeacherSubjectAssignments,
  getTeacherSubjectCurrentSession,
} from "@/services/staff.service";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  BookOpenCheck,
  CalendarClock,
  ChartColumnBig,
  Clock3,
  History,
  Loader2,
} from "lucide-react";
import { AppLink as Link } from "@/components/router/app-link";

function getDayIndonesian(date: Date): string {
  return ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"][date.getDay()];
}

function getTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const HARI_LABEL: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis",
  jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

export function MapelDashboardPage() {
  const now = new Date();
  const hari = getDayIndonesian(now);
  const jam = getTimeString(now);

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: getTeacherSubjectAssignments,
    staleTime: 60_000,
  });

  const sessionQuery = useQuery({
    queryKey: ["subject-current-session", hari, jam.slice(0, 5)],
    queryFn: () => getTeacherSubjectCurrentSession(hari, jam),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const assignments = assignmentsQuery.data ?? [];
  const session = sessionQuery.data ?? null;

  return (
    <WalasShell>
      {() => (
        <>
          {/* Active session banner */}
          {sessionQuery.isLoading ? (
            <section className="flex items-center gap-3 rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-sm">
              <Loader2 className="size-5 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-500">Mendeteksi kelas aktif saat ini...</p>
            </section>
          ) : session ? (
            <motion.section
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100">
                    <CalendarClock className="size-5 text-emerald-700" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Kelas aktif: {session.assignment.subject_name} —{" "}
                      {session.assignment.class_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {HARI_LABEL[session.hari] ?? session.hari} ·{" "}
                      {session.jam_mulai}–{session.jam_selesai} · {session.tanggal}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/teacher/subject/session?session_id=${session.session_id}`}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
                >
                  Buka Daftar Hadir
                </Link>
              </div>
            </motion.section>
          ) : (
            <section className="flex items-center gap-3 rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-sm">
              <Clock3 className="size-5 text-slate-400" />
              <p className="text-sm text-slate-500">
                Tidak ada kelas aktif saat ini ·{" "}
                {HARI_LABEL[hari] ?? hari} {jam}
              </p>
            </section>
          )}

          {/* Quick links */}
          <section className="grid items-start gap-4 sm:grid-cols-3">
            {[
              {
                href: "/dashboard/teacher/subject/session",
                icon: BookOpenCheck,
                label: "Sesi Aktif",
                desc: "Buka daftar hadir kelas yang sedang berjalan",
                color: "bg-emerald-50 text-emerald-700",
              },
              {
                href: "/dashboard/teacher/subject/history",
                icon: History,
                label: "Riwayat Sesi",
                desc: "Lihat semua sesi yang sudah divalidasi",
                color: "bg-sky-50 text-sky-700",
              },
              {
                href: "/dashboard/teacher/subject/recap",
                icon: ChartColumnBig,
                label: "Rekap Mapel",
                desc: "Lihat rekap kehadiran per siswa",
                color: "bg-violet-50 text-violet-700",
              },
            ].map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={item.href}
                  className="flex items-start gap-4 rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-sm transition hover:shadow-md"
                >
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </section>

          {/* Assignment list */}
          <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
            <p className="mb-4 text-lg font-semibold text-slate-950">Mata Pelajaran Saya</p>

            {assignmentsQuery.isLoading ? (
              <EmptyState icon={Loader2} title="Memuat data..." description="Mengambil daftar mata pelajaran." />
            ) : assignments.length === 0 ? (
              <EmptyState
                icon={BookOpenCheck}
                title="Belum ada mata pelajaran"
                description="Hubungi admin untuk mendapatkan assignment mata pelajaran."
              />
            ) : (
              <div className="divide-y divide-slate-50">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-900">{a.subject_name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {a.class_name} · {a.school_year_name}
                      </p>
                      {a.schedules.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {a.schedules.map((sch) => (
                            <span
                              key={sch.id}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                            >
                              {HARI_LABEL[sch.hari] ?? sch.hari} {sch.jam_mulai}–{sch.jam_selesai}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/teacher/subject/history?assignment_id=${a.id}`}
                      className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      Riwayat
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </WalasShell>
  );
}
