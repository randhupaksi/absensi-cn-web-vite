"use client";

import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { StudentShell } from "@/components/dashboard/student/student-shell";
import { getStudentProfile } from "@/services/student.service";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpen,
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
            className="rounded-[2rem] border border-white/82 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbf8_58%,#eaf8f1_100%)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
          >
            <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.7rem] border border-emerald-200/70 bg-[linear-gradient(135deg,#0f6b58_0%,#0d8a6c_58%,#20ba81_100%)] p-6 text-white shadow-[0_22px_52px_rgba(15,118,85,0.23)]">
                <div className="flex items-center gap-4">
                  <span className="flex size-20 items-center justify-center rounded-[1.45rem] bg-white/16 text-2xl font-semibold shadow-inner">
                    {getInitials(profile?.name ?? "Siswa")}
                  </span>
                  <div>
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

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
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

              <div className="rounded-[1.7rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <BookOpen className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Identitas Akademik
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Data ini tersambung ke kelas, walas, BK, dan admin.
                    </p>
                  </div>
                </div>

                {profile ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Nama lengkap" value={profile.name} />
                    <InfoRow label="Jenis kelamin" value={formatGender(profile.gender)} />
                    <InfoRow label="NIS" value={profile.nis} />
                    <InfoRow label="NISN" value={profile.nisn || "-"} />
                    <InfoRow label="Status kelas" value={profile.membership_status || "-"} />
                    <InfoRow label="Kelas aktif" value={profile.class_name || "-"} />
                    <InfoRow label="Tahun ajaran" value={profile.school_year_name || "-"} />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 leading-6 text-slate-800">{value}</p>
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
