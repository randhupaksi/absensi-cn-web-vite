"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import {
  actionIconButtonClass,
  MobileDataCard,
  MobileDataField,
  MobileDataFooter,
  MobileDataHeader,
  MobileDataList,
  MobileDataSection,
  SearchFilterBar,
} from "@/features/admin/management/shared/section-ui";
import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { StudentShell } from "@/features/student/components/shell";
import { AttendanceEvidenceModal } from "@/features/attendance/components/attendance-evidence-modal";
import { StudentSubmissionEvidenceModal } from "@/features/student/components/submission-evidence-modal";
import {
  formatStudentDate,
  formatStudentDateTime,
  formatStudentTime,
  StudentStatusPill,
  StudentSubmissionPill,
} from "@/features/student/components/common";
import { RadixSelectField } from "@/components/ui/radix-select";
import { getStudentHistory } from "@/services/student.service";
import type { StaffAttendanceRecord } from "@/types/staff";
import type { StudentSubmission } from "@/types/student";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CheckCircle2,
  FileImage,
  FileText,
  History,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { HistoryPageSkeleton } from "@/components/loading/loading-system";

const statusOptions = [
  { value: "Semua", label: "Semua status" },
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

export function StudentHistoryPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [attendanceEvidence, setAttendanceEvidence] = useState<StaffAttendanceRecord | null>(null);
  const [submissionEvidence, setSubmissionEvidence] = useState<StudentSubmission | null>(null);

  const historyQuery = useQuery({
    queryKey: ["student-history"],
    queryFn: getStudentHistory,
    staleTime: 0,
  });

  const history = historyQuery.data;
  const stats = history?.stats;
  const records = useMemo(() => {
    const attendanceItems = (history?.attendance ?? []).map((item) => ({
      kind: "attendance" as const,
      id: `attendance-${item.id}`,
      date: item.attendance_date,
      status: item.status,
      title: formatStudentDate(item.attendance_date),
      description: item.notes || item.verification_note || "Data absensi siswa",
      record: item,
    }));

    const submissionItems = (history?.submissions ?? []).map((item) => ({
      kind: "submission" as const,
      id: `submission-${item.id}`,
      date: item.created_at ?? "",
      status: item.type.toLowerCase(),
      title: item.type,
      description: item.reason,
      submission: item,
    }));

    const normalizedQuery = query.trim().toLowerCase();
    return [...attendanceItems, ...submissionItems]
      .filter((item) => {
        const statusMatch =
          statusFilter === "Semua" || item.status.toLowerCase() === statusFilter;
        const queryMatch =
          normalizedQuery === "" ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery) ||
          item.status.toLowerCase().includes(normalizedQuery);
        return statusMatch && queryMatch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [history?.attendance, history?.submissions, query, statusFilter]);

  return (
    <StudentShell>
      {() => historyQuery.isLoading && !history ? (
        <HistoryPageSkeleton />
      ) : (
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-white/82 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbf8_58%,#eaf8f1_100%)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/78 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 shadow-[0_12px_28px_rgba(16,185,129,0.08)]">
                  <History className="size-4" />
                  Riwayat Absensi Siswa
                </span>
                <h1 className="mt-7 text-[2.45rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
                  Histori Absen
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                  Riwayat absensi, izin, sakit, bukti foto, dan hasil validasi walas
                  dalam satu tempat.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-white/82 px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Kelas Aktif
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {history?.profile.class_name ?? "-"}
                </p>
                <p className="text-sm text-slate-500">
                  {history?.profile.school_year_name ?? "-"}
                </p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 items-start gap-4 xl:grid-cols-4">
              <KpiCard
                label="Total Absensi"
                value={String(stats?.total_attendance ?? 0)}
                icon={CalendarCheck}
                accentClass="bg-emerald-100 text-emerald-700"
              />
              <KpiCard
                label="Hadir"
                value={String(stats?.present ?? 0)}
                icon={CheckCircle2}
                accentClass="bg-sky-100 text-sky-700"
              />
              <KpiCard
                label="Alfa"
                value={String(stats?.alpha ?? 0)}
                icon={ShieldAlert}
                accentClass="bg-amber-100 text-amber-700"
              />
              <KpiCard
                label="Izin Sakit"
                value={String((stats?.permission ?? 0) + (stats?.sick ?? 0))}
                icon={FileText}
                accentClass="bg-rose-100 text-rose-700"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/82 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Daftar Aktivitas</p>
                <p className="mt-1 text-xs text-slate-500">Cari dan filter riwayat absensi kamu.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="w-full shrink-0 sm:w-[220px]">
                  <RadixSelectField
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="Semua status"
                    options={statusOptions}
                    triggerClassName="min-w-0"
                  />
                </div>
                <SearchFilterBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Cari status, catatan, tanggal"
                  className="sm:min-w-[360px] xl:min-w-[430px]"
                />
              </div>
            </div>

            {records.length > 0 ? (
              <>
              <div className="mt-5 hidden overflow-x-auto rounded-[1.45rem] border border-emerald-100 md:block">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[1fr_0.72fr_0.62fr_0.84fr_0.4fr] gap-4 bg-emerald-50 px-5 py-4 text-sm font-semibold text-slate-700">
                    <span>Aktivitas</span>
                    <span>Waktu</span>
                    <span>Status</span>
                    <span>Validasi</span>
                    <span className="text-center">Bukti</span>
                  </div>
                  {records.map((item) =>
                    item.kind === "attendance" ? (
                      <AttendanceRow key={item.id} record={item.record} onOpen={setAttendanceEvidence} />
                    ) : (
                      <SubmissionRow key={item.id} submission={item.submission} onOpen={setSubmissionEvidence} />
                    ),
                  )}
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-[1.45rem] border border-emerald-100">
                <MobileDataList>
                  {records.map((item) =>
                    item.kind === "attendance" ? (
                      <MobileAttendanceCard key={item.id} record={item.record} onOpen={setAttendanceEvidence} />
                    ) : (
                      <MobileSubmissionCard key={item.id} submission={item.submission} onOpen={setSubmissionEvidence} />
                    ),
                  )}
                </MobileDataList>
              </div>
              </>
            ) : (
              <div className="mt-5 rounded-[1.45rem] border border-emerald-100 p-5">
                <EmptyState
                  icon={History}
                  title="Histori belum ditemukan"
                  description="Coba ubah filter atau lakukan absensi terlebih dahulu."
                />
              </div>
            )}
          </section>

          <AttendanceEvidenceModal
            record={attendanceEvidence}
            onOpenChange={(open) => !open && setAttendanceEvidence(null)}
          />
          <StudentSubmissionEvidenceModal
            submission={submissionEvidence}
            onOpenChange={(open) => !open && setSubmissionEvidence(null)}
          />
        </div>
      )}
    </StudentShell>
  );
}

function AttendanceRow({ record, onOpen }: { record: StaffAttendanceRecord; onOpen: (record: StaffAttendanceRecord) => void }) {
  return (
    <div className="grid grid-cols-[1fr_0.72fr_0.62fr_0.84fr_0.4fr] gap-4 border-t border-slate-100 px-5 py-4 text-sm">
      <div>
        <p className="font-semibold text-slate-950">Absensi Harian</p>
        <p className="mt-1 line-clamp-2 text-slate-500">
          {record.notes || record.verification_note || "Data absensi siswa"}
        </p>
      </div>
      <div>
        <p className="font-medium text-slate-800">
          {formatStudentDate(record.attendance_date)}
        </p>
        <p className="mt-1 text-slate-500">{formatStudentTime(record.check_in_at, "Tidak ada waktu")}</p>
      </div>
      <div className="flex items-center">
        <StudentStatusPill status={record.status} />
      </div>
      <div>
        <p className="font-medium text-slate-800">
          {record.verified_at
            ? "Sudah direview"
            : record.status.toLowerCase() === "hadir"
              ? "Terkirim"
              : "Menunggu"}
        </p>
        <p className="mt-1 line-clamp-1 text-slate-500">
          {record.verification_note || record.verified_by || "-"}
        </p>
      </div>
      <div className="flex justify-center">
        {record.photo_url ? (
          <button
            type="button"
            onClick={() => onOpen(record)}
            className={`inline-flex items-center justify-center ${actionIconButtonClass("emerald")}`}
            aria-label="Buka bukti absensi"
          >
            <FileImage className="size-4.5" />
          </button>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </div>
    </div>
  );
}

function MobileAttendanceCard({ record, onOpen }: { record: StaffAttendanceRecord; onOpen: (record: StaffAttendanceRecord) => void }) {
  return (
    <MobileDataCard>
      <MobileDataHeader
        title="Absensi Harian"
        subtitle={formatStudentDate(record.attendance_date)}
        badge={<StudentStatusPill status={record.status} />}
      />
      <div className="mt-4 grid gap-3">
        <MobileDataField label="Waktu" value={formatStudentTime(record.check_in_at, "Tidak ada waktu")} />
        <MobileDataField
          label="Validasi"
          value={
            record.verified_at
              ? "Sudah direview"
              : record.status.toLowerCase() === "hadir"
                ? "Terkirim"
                : "Menunggu"
          }
        />
      </div>
      <MobileDataSection label="Catatan">
        <p className="text-sm leading-6 text-slate-600">
          {record.notes || record.verification_note || "Data absensi siswa"}
        </p>
      </MobileDataSection>
      {record.photo_url ? (
        <MobileDataFooter>
          <button
            type="button"
            onClick={() => onOpen(record)}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            aria-label="Buka bukti absensi"
          >
            <FileImage className="size-4.5" />
            Bukti
          </button>
        </MobileDataFooter>
      ) : null}
    </MobileDataCard>
  );
}

function SubmissionRow({ submission, onOpen }: { submission: StudentSubmission; onOpen: (submission: StudentSubmission) => void }) {
  return (
    <div className="grid grid-cols-[1fr_0.72fr_0.62fr_0.84fr_0.4fr] gap-4 border-t border-slate-100 px-5 py-4 text-sm">
      <div>
        <div className="flex items-center gap-2">
          <StudentSubmissionPill value={submission.type} />
          <p className="font-semibold text-slate-950">Pengajuan</p>
        </div>
        <p className="mt-2 line-clamp-2 text-slate-500">{submission.reason}</p>
      </div>
      <div>
        <p className="font-medium text-slate-800">
          {formatStudentDateTime(submission.created_at)}
        </p>
      </div>
      <div>
        <StudentSubmissionPill value={submission.type} />
      </div>
      <div>
        <StudentSubmissionPill value={submission.status} />
        <p className="mt-1 line-clamp-1 text-slate-500">
          {submission.review_note || submission.reviewed_by_name || "-"}
        </p>
      </div>
      <div className="flex justify-center">
        {submission.attachment ? (
          <button
            type="button"
            onClick={() => onOpen(submission)}
            className={`inline-flex items-center justify-center ${actionIconButtonClass("emerald")}`}
            aria-label="Buka lampiran pengajuan"
          >
            <FileImage className="size-4.5" />
          </button>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </div>
    </div>
  );
}

function MobileSubmissionCard({ submission, onOpen }: { submission: StudentSubmission; onOpen: (submission: StudentSubmission) => void }) {
  return (
    <MobileDataCard>
      <MobileDataHeader
        title="Pengajuan"
        subtitle={formatStudentDateTime(submission.created_at)}
        badge={<StudentSubmissionPill value={submission.status} />}
      />
      <div className="mt-4 grid gap-3">
        <MobileDataField label="Tipe" value={<StudentSubmissionPill value={submission.type} />} />
        <MobileDataField label="Validasi" value={submission.review_note || submission.reviewed_by_name || "-"} />
      </div>
      <MobileDataSection label="Alasan">
        <p className="text-sm leading-6 text-slate-600">{submission.reason}</p>
      </MobileDataSection>
      {submission.attachment ? (
        <MobileDataFooter>
          <button
            type="button"
            onClick={() => onOpen(submission)}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            aria-label="Buka lampiran pengajuan"
          >
            <FileImage className="size-4.5" />
            Lampiran
          </button>
        </MobileDataFooter>
      ) : null}
    </MobileDataCard>
  );
}
