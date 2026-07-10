"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { PremiumModal } from "@/components/modals/premium-modal";
import { Badge } from "@/components/ui/badge";
import { formatDisplayLabel } from "@/lib/utils";
import type { StaffHomeroomStudentDetail } from "@/types/staff";
import { BookOpenCheck, FileClock, TriangleAlert, UserRound } from "lucide-react";

export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "S";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export function formatGender(gender?: string) {
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

export function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }
    >
      {isActive ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}

export function LoadingTable({ columnCount }: { columnCount: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div
          key={`walas-student-loading-${rowIndex}`}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(120px, 1fr))` }}
        >
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <div
              key={`walas-student-loading-cell-${rowIndex}-${cellIndex}`}
              className="h-4 animate-pulse rounded-full bg-slate-100"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AttendanceStatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();
  let className = "border-slate-200 bg-slate-100 text-slate-600";

  if (normalizedStatus === "HADIR") className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  else if (normalizedStatus === "TELAT") className = "border-amber-200 bg-amber-50 text-amber-700";
  else if (normalizedStatus === "ALFA") className = "border-rose-200 bg-rose-50 text-rose-700";
  else if (normalizedStatus === "SAKIT" || normalizedStatus === "IZIN") className = "border-sky-200 bg-sky-50 text-sky-700";

  return <Badge className={className}>{formatDisplayLabel(status)}</Badge>;
}

function SubmissionStatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  let className = "border-amber-200 bg-amber-50 text-amber-700";

  if (normalizedStatus === "approved") className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  else if (normalizedStatus === "rejected") className = "border-rose-200 bg-rose-50 text-rose-700";

  return <Badge className={className}>{formatDisplayLabel(status)}</Badge>;
}

function MiniStatCard({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" }) {
  return (
    <div
      className={`rounded-[20px] border px-4 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${
        tone === "success"
          ? "border-emerald-200 bg-[linear-gradient(180deg,rgba(220,252,231,0.95)_0%,rgba(187,247,208,0.82)_100%)]"
          : tone === "warning"
            ? "border-amber-200 bg-[linear-gradient(180deg,rgba(254,243,199,0.95)_0%,rgba(253,230,138,0.82)_100%)]"
            : "border-rose-200 bg-[linear-gradient(180deg,rgba(255,228,230,0.95)_0%,rgba(254,205,211,0.84)_100%)]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

export function StudentDetailModal({
  open,
  onOpenChange,
  studentDetail,
  isLoading,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentDetail: StaffHomeroomStudentDetail | null;
  isLoading: boolean;
  errorMessage?: string;
}) {
  const student = studentDetail?.student;

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title={student ? `Detail ${student.name}` : "Detail Siswa Kelas"}
      description="Lihat identitas siswa, ringkasan kehadiran, dan histori terbaru langsung dari data walas."
      icon={UserRound}
      className="sm:!max-w-[980px]"
    >
      <div className="grid gap-5">
        {errorMessage ? (
          <EmptyState
            icon={TriangleAlert}
            title="Detail siswa belum bisa dimuat"
            description={errorMessage}
            compact
          />
        ) : isLoading || !studentDetail || !student ? (
          <LoadingTable columnCount={3} />
        ) : (
          <>
            <div className="grid items-start gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="h-fit rounded-[24px] border border-emerald-100/70 bg-white/94 p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-4">
                  <span className="flex size-14 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-base font-semibold text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                    {getInitials(student.name)}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                      {student.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill isActive={student.is_active} />
                      <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                        {student.class_name || "-"}
                      </Badge>
                    </div>
                    <div className="grid gap-2 pt-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>NIS: {student.nis}</p>
                      <p>NISN: {student.nisn || "-"}</p>
                      <p>Gender: {formatGender(student.gender)}</p>
                      <p>Tahun ajaran: {student.school_year_name || "-"}</p>
                      <p>NISN: {student.nisn || "-"}</p>
                      <p>Status kelas: {student.membership_status || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 self-start sm:grid-cols-2 md:grid-cols-1">
                <MiniStatCard label="Hadir" value={studentDetail.attendance_summary.present} tone="success" />
                <MiniStatCard label="Telat" value={studentDetail.attendance_summary.late} tone="warning" />
                <MiniStatCard label="Alfa" value={studentDetail.attendance_summary.alpha} tone="danger" />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[24px] border border-emerald-100/70 bg-white/94 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Riwayat Kehadiran Terbaru</p>
                    <p className="text-sm text-slate-500">Ringkasan absensi terakhir siswa di kelas walas</p>
                  </div>
                  <BookOpenCheck className="size-4.5 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {studentDetail.recent_attendance.length === 0 ? (
                    <EmptyState
                      icon={BookOpenCheck}
                      title="Belum ada riwayat kehadiran"
                      description="Absensi siswa akan tampil di sini setelah mulai tercatat."
                      compact
                    />
                  ) : (
                    studentDetail.recent_attendance.slice(0, 6).map((record) => (
                      <div
                        key={record.id}
                        className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDate(record.attendance_date)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Check-in: {formatDateTime(record.check_in_at)}
                            </p>
                          </div>
                          <AttendanceStatusPill status={record.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-100/70 bg-white/94 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Pengajuan Terbaru</p>
                    <p className="text-sm text-slate-500">Izin dan sakit yang pernah diajukan siswa</p>
                  </div>
                  <FileClock className="size-4.5 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {studentDetail.recent_submissions.length === 0 ? (
                    <EmptyState
                      icon={FileClock}
                      title="Belum ada pengajuan"
                      description="Riwayat izin atau sakit siswa akan tampil di sini."
                      compact
                    />
                  ) : (
                    studentDetail.recent_submissions.slice(0, 6).map((submission) => (
                      <div
                        key={submission.id}
                        className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {submission.type}
                            </p>
                            <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                              {submission.reason}
                            </p>
                          </div>
                          <SubmissionStatusPill status={submission.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PremiumModal>
  );
}
