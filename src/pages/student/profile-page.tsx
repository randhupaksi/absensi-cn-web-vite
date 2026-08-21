"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { StudentShell } from "@/features/student/components/shell";
import { getStudentProfile } from "@/services/student.service";
import { formatDisplayLabel } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  CircleUserRound,
  Copy,
  GraduationCap,
  Hash,
  IdCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ProfilePageSkeleton } from "@/components/loading/loading-system";
import { formatPersonName } from "@/lib/format-person-name";

export function StudentProfilePage() {
  const profileQuery = useQuery({
    queryKey: ["student-profile"],
    queryFn: getStudentProfile,
  });

  const profile = profileQuery.data;

  return (
    <StudentShell>
      {() =>
        profileQuery.isLoading && !profile ? (
          <ProfilePageSkeleton />
        ) : (
          <div className="space-y-5">
            <section className="relative overflow-hidden rounded-[2.25rem] border border-white/90 bg-[radial-gradient(circle_at_100%_0%,rgba(167,243,208,0.52),transparent_31%),linear-gradient(135deg,#ffffff_0%,#f8fbf8_58%,#edf9f3_100%)] p-3 shadow-[0_26px_76px_rgba(15,23,42,0.09)] dark:border-slate-800 dark:bg-slate-950 dark:bg-none dark:shadow-none sm:p-5">
              <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-emerald-200/28 blur-3xl dark:hidden" />
              <div className="relative grid items-stretch gap-5 lg:grid-cols-[0.86fr_1.14fr]">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-300/40 bg-[linear-gradient(155deg,#064e42_0%,#087b63_48%,#10b981_100%)] p-4 text-white shadow-[0_24px_56px_rgba(5,120,91,0.26)] dark:border-emerald-700/60 dark:bg-slate-900 dark:bg-none dark:shadow-none min-[380px]:p-5 sm:rounded-[1.9rem] sm:p-7">
                  <div className="pointer-events-none absolute -right-14 -top-20 size-52 rounded-full border-[24px] border-white/10" />
                  <div className="pointer-events-none absolute -bottom-24 -left-14 size-56 rounded-full bg-white/12 blur-2xl dark:hidden" />
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="flex size-16 items-center justify-center rounded-[1.2rem] border border-white/25 bg-white/15 text-xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_14px_30px_rgba(0,0,0,0.1)] sm:size-[4.75rem] sm:rounded-[1.45rem] sm:text-2xl">
                      {getInitials(profile?.name ?? "Siswa")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-50/90">
                      <span className="size-1.5 rounded-full bg-emerald-200" />
                      {profile?.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="relative mt-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-50/70">
                      Profil siswa
                    </p>
                    <h1 className="mt-2 w-full max-w-full break-words text-[clamp(1.75rem,9vw,2rem)] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[2.45rem]">
                      {formatPersonName(profile?.name) || "Memuat profil"}
                    </h1>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-emerald-50/80">
                      <GraduationCap className="size-4" />
                      {profile?.class_name ?? "-"}
                      <span className="size-1 rounded-full bg-emerald-200/70" />
                      {profile?.school_year_name ?? "-"}
                    </p>
                  </div>

                  <div className="relative mt-8 grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2">
                    <ProfileChip
                      icon={IdCard}
                      label="NIS"
                      value={profile?.nis ?? "-"}
                    />
                    <ProfileChip
                      icon={Hash}
                      label="NISN"
                      value={profile?.nisn ?? "-"}
                    />
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

                <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none sm:p-6">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200/75 pb-5 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <BookOpen className="size-4" />
                        <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                          Data akademik
                        </p>
                      </div>
                      <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-100">
                        Identitas Akademik
                      </h2>
                      <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Identitas yang dipakai untuk absensi, wali kelas, BK,
                        dan administrasi sekolah.
                      </p>
                    </div>
                    <span className="hidden size-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-300 sm:flex">
                      <CircleUserRound className="size-5" />
                    </span>
                  </div>

                  {profile ? (
                    <>
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                        Data profil tersinkron dengan Citra Negara Attendence System
                      </div>
                      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                        <InfoRow
                          icon={UserRound}
                          label="Nama lengkap"
                          value={formatPersonName(profile.name)}
                        />
                        <InfoRow
                          icon={CircleUserRound}
                          label="Jenis kelamin"
                          value={formatGender(profile.gender)}
                        />
                        <InfoRow
                          icon={IdCard}
                          label="NIS"
                          value={profile.nis}
                          copyable
                        />
                        <InfoRow
                          icon={Hash}
                          label="NISN"
                          value={profile.nisn || "-"}
                          copyable={Boolean(profile.nisn)}
                        />
                        <InfoRow
                          icon={BookOpen}
                          label="Jurusan"
                          value={profile.major_code || "-"}
                        />
                        <InfoRow
                          icon={GraduationCap}
                          label="Kelas aktif"
                          value={profile.class_name || "-"}
                        />
                        <InfoRow
                          icon={CalendarDays}
                          label="Tahun ajaran"
                          value={profile.school_year_name || "-"}
                        />
                        <InfoRow
                          icon={ShieldCheck}
                          label="Status kelas"
                          value={
                            profile.membership_status
                              ? formatDisplayLabel(profile.membership_status)
                              : "-"
                          }
                        />
                      </div>
                    </>
                  ) : profileQuery.isLoading ? (
                    <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                      Memuat profil siswa...
                    </div>
                  ) : (
                    <EmptyState
                      icon={UserRound}
                      title="Profil belum tersedia"
                      description={
                        profileQuery.error?.message ??
                        "Data siswa tidak ditemukan."
                      }
                    />
                  )}
                </div>
              </div>
            </section>
          </div>
        )
      }
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
    <div className="group rounded-[1.25rem] border border-white/16 bg-white/[0.11] px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.16]">
      <div className="flex items-center gap-2 text-emerald-50/80">
        <Icon className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <p className="mt-2 truncate font-semibold text-white transition group-hover:translate-x-0.5">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  copyable = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === "-") return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-[1.2rem] border border-slate-200/75 bg-slate-50/65 px-3.5 py-3.5 transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/45 hover:shadow-[0_12px_24px_rgba(15,118,85,0.07)] dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/45 dark:hover:shadow-none">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-[0_5px_12px_rgba(15,23,42,0.05)] dark:bg-slate-900 dark:text-emerald-300 dark:shadow-none">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-1 truncate font-semibold leading-6 text-slate-800 dark:text-slate-100">
          {value}
        </p>
      </div>
      {copyable ? (
        <button
          type="button"
          onClick={handleCopy}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 opacity-100 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 sm:opacity-0 sm:group-hover:opacity-100"
          title={copied ? "Tersalin" : `Salin ${label}`}
          aria-label={copied ? `${label} tersalin` : `Salin ${label}`}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      ) : null}
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
