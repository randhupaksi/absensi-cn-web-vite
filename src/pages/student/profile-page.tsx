"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { StudentShell } from "@/features/student/components/shell";
import { getStudentProfile } from "@/services/student.service";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  GraduationCap,
  IdCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";

export function StudentProfilePage() {
  const profileQuery = useQuery({
    queryKey: ["student-profile"],
    queryFn: getStudentProfile,
  });

  const profile = profileQuery.data;

  return (
    <StudentShell>
      {() => (
        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[2rem] border border-white/82 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbf8_58%,#eaf8f1_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-5"
          >
            <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="relative grid items-stretch gap-5 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="relative overflow-hidden rounded-[1.7rem] border border-emerald-200/70 bg-[linear-gradient(145deg,#075e4d_0%,#0b8669_55%,#22b879_100%)] p-6 text-white shadow-[0_22px_52px_rgba(15,118,85,0.23)] sm:p-7">
                <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full border-[22px] border-white/10" />
                <div className="pointer-events-none absolute -bottom-24 -left-14 size-56 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="flex size-[4.5rem] items-center justify-center rounded-[1.35rem] border border-white/20 bg-white/15 text-2xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
                    {getInitials(profile?.name ?? "Siswa")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-50/90">
                    <span className="size-1.5 rounded-full bg-emerald-200" />
                    {profile?.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <div className="relative mt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-50/70">
                    Profile siswa
                  </p>
                  <h1 className="mt-2 max-w-[18rem] text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[2.35rem]">
                    {profile?.name ?? "Memuat profile"}
                  </h1>
                  <p className="mt-3 flex items-center gap-2 text-sm text-emerald-50/80">
                    <GraduationCap className="size-4" />
                    {profile?.class_name ?? "-"}
                    <span className="size-1 rounded-full bg-emerald-200/70" />
                    {profile?.school_year_name ?? "-"}
                  </p>
                </div>

                <div className="relative mt-9 grid gap-2.5 sm:grid-cols-2">
                  {/* identity chips */}
                  <div className="hidden">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/80">
                      Profile Siswa
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.03em]">
                      {profile?.name ?? "Memuat profile"}
                    </h1>
                    <p className="mt-2 text-emerald-50/80">
                      {profile?.class_name ?? "-"} • {profile?.school_year_name ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <ProfileChip icon={IdCard} label="NIS" value={profile?.nis ?? "-"} />
                  <ProfileChip icon={BadgeCheck} label="NISN" value={profile?.nisn ?? "-"} />
                  <ProfileChip
                    icon={GraduationCap}
                    label="Jurusan"
                    value={profile?.major_code ?? "-"}
                  />
                  <ProfileChip
                    icon={ShieldCheck}
                    label="Status"
                    value={profile?.is_active ? "Aktif" : "Nonaktif"}
                  />
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200/75 pb-5">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-700">
                      <BookOpen className="size-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Data akademik</p>
                    </div>
                    <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-950">
                      Identitas Akademik
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Data ini tersambung ke kelas, walas, BK, dan admin.
                    </p>
                  </div>
                  <span className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex">
                    <CircleUserRound className="size-5" />
                  </span>
                </div>

                {profile ? (
                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    <InfoRow icon={UserRound} label="Nama lengkap" value={profile.name} />
                    <InfoRow icon={CircleUserRound} label="Jenis kelamin" value={formatGender(profile.gender)} />
                    <InfoRow icon={IdCard} label="NIS" value={profile.nis} />
                    <InfoRow icon={BadgeCheck} label="NISN" value={profile.nisn || "-"} />
                    <InfoRow icon={ShieldCheck} label="Status kelas" value={profile.membership_status || "-"} />
                    <InfoRow icon={GraduationCap} label="Kelas aktif" value={profile.class_name || "-"} />
                    <InfoRow icon={CalendarDays} label="Tahun ajaran" value={profile.school_year_name || "-"} />
                  </div>
                ) : profileQuery.isLoading ? (
                  <div className="mt-5 text-sm text-slate-500">Memuat profile siswa...</div>
                ) : (
                  <EmptyState
                    icon={UserRound}
                    title="Profile belum tersedia"
                    description={profileQuery.error?.message ?? "Data siswa tidak ditemukan."}
                  />
                )}
              </div>
            </div>
          </motion.section>

        </div>
      )}
    </StudentShell>
  );
}

function ProfileChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IdCard;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/16 bg-white/12 px-4 py-3">
      <div className="flex items-center gap-2 text-emerald-50/80">
        <Icon className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <p className="mt-2 truncate font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[1.15rem] border border-slate-200/75 bg-slate-50/65 px-3.5 py-3.5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/35">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-[0_5px_12px_rgba(15,23,42,0.05)]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate leading-6 text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "S";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function formatGender(gender?: string) {
  switch ((gender ?? "").toUpperCase()) {
    case "MALE":
    case "L":
      return "Laki-laki";
    case "FEMALE":
    case "P":
      return "Perempuan";
    default:
      return "-";
  }
}
