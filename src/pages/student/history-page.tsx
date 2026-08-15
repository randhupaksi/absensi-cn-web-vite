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
  SectionTabSwitch,
} from "@/features/admin/management/shared/section-ui";
import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { StudentShell } from "@/features/student/components/shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import dynamic from "@/lib/dynamic";
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
import type {
  StudentProfile,
  StudentStats,
  StudentSubmission,
} from "@/types/student";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  ChartLine,
  CheckCircle2,
  FileImage,
  FileText,
  History,
  LayoutPanelTop,
  List,
  Printer,
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

const StudentHistoryReportModal = dynamic(() =>
  import("@/features/reports/student/student-history-report-modal").then(
    (module) => module.StudentHistoryReportModal,
  ),
);

type StudentHistoryTab = "overview" | "history";

type MonthlyAttendanceSummary = {
  key: string;
  label: string;
  total: number;
  present: number;
  permission: number;
  sick: number;
  alpha: number;
  attendanceRate: number;
};

export function StudentHistoryPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [activeTab, setActiveTab] = useState<StudentHistoryTab>("overview");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [attendanceEvidence, setAttendanceEvidence] =
    useState<StaffAttendanceRecord | null>(null);
  const [submissionEvidence, setSubmissionEvidence] =
    useState<StudentSubmission | null>(null);

  const historyQuery = useQuery({
    queryKey: ["student-history"],
    queryFn: getStudentHistory,
    staleTime: 0,
  });

  const history = historyQuery.data;
  const stats = history?.stats;
  const attendanceRate = stats?.total_attendance
    ? Math.round((stats.present / stats.total_attendance) * 100)
    : 0;
  const monthlySummary = useMemo(
    () => getMonthlyAttendanceSummary(history?.attendance ?? []),
    [history?.attendance],
  );
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
          statusFilter === "Semua" ||
          item.status.toLowerCase() === statusFilter;
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
      {() =>
        historyQuery.isLoading && !history ? (
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
                    Riwayat absensi, izin, sakit, bukti foto, dan hasil validasi
                    walas dalam satu tempat.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                  <div className="w-full rounded-[1.4rem] border border-slate-200 bg-white/82 px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:w-auto sm:min-w-[220px]">
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReportModalOpen(true)}
                    disabled={(history?.attendance.length ?? 0) === 0}
                    className="h-14 min-w-0 w-full gap-1.5 rounded-[22px] border-emerald-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] px-3 text-xs font-semibold text-emerald-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(220,252,231,1)_100%)] hover:text-emerald-950 sm:w-auto sm:gap-2 sm:px-5 sm:text-sm"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(5,150,105,0.2)] sm:size-8">
                      <Printer className="size-4" />
                    </span>
                    Export Laporan
                  </Button>
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

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as StudentHistoryTab)
              }
              className="gap-0"
            >
              <SectionTabSwitch
                hugContent
                tabs={[
                  {
                    value: "overview",
                    label: "Ringkasan",
                    icon: LayoutPanelTop,
                  },
                  { value: "history", label: "Histori Absensi", icon: List },
                ]}
              />

              <TabsContent value="overview" className="mt-5">
                <StudentHistoryOverview
                  profile={history?.profile}
                  stats={stats}
                  attendanceRate={attendanceRate}
                  monthlySummary={monthlySummary}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-5">
                <section className="rounded-[2rem] border border-white/82 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Daftar Aktivitas
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Cari dan filter riwayat absensi kamu.
                      </p>
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
                              <AttendanceRow
                                key={item.id}
                                record={item.record}
                                onOpen={setAttendanceEvidence}
                              />
                            ) : (
                              <SubmissionRow
                                key={item.id}
                                submission={item.submission}
                                onOpen={setSubmissionEvidence}
                              />
                            ),
                          )}
                        </div>
                      </div>
                      <div className="mt-5 overflow-hidden rounded-[1.45rem] border border-emerald-100">
                        <MobileDataList>
                          {records.map((item) =>
                            item.kind === "attendance" ? (
                              <MobileAttendanceCard
                                key={item.id}
                                record={item.record}
                                onOpen={setAttendanceEvidence}
                              />
                            ) : (
                              <MobileSubmissionCard
                                key={item.id}
                                submission={item.submission}
                                onOpen={setSubmissionEvidence}
                              />
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
              </TabsContent>
            </Tabs>

            <AttendanceEvidenceModal
              record={attendanceEvidence}
              onOpenChange={(open) => !open && setAttendanceEvidence(null)}
            />
            <StudentSubmissionEvidenceModal
              submission={submissionEvidence}
              onOpenChange={(open) => !open && setSubmissionEvidence(null)}
            />
            <StudentHistoryReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              profile={history?.profile}
              stats={stats}
              attendance={history?.attendance ?? []}
            />
          </div>
        )
      }
    </StudentShell>
  );
}

function StudentHistoryOverview({
  profile,
  stats,
  attendanceRate,
  monthlySummary,
}: {
  profile?: StudentProfile;
  stats?: StudentStats;
  attendanceRate: number;
  monthlySummary: MonthlyAttendanceSummary[];
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[1.06fr_0.94fr]">
        <article className="rounded-[2rem] border border-emerald-100 bg-[linear-gradient(135deg,#f7fffb_0%,#ecfdf5_58%,#ffffff_100%)] p-5 shadow-[0_18px_48px_rgba(5,120,91,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_22px_rgba(5,150,105,0.22)]">
              <LayoutPanelTop className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Profil laporan
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                Data Siswa
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2">
            <OverviewField label="Nama lengkap" value={profile?.name ?? "-"} />
            <OverviewField label="NIS" value={profile?.nis ?? "-"} />
            <OverviewField
              label="Kelas aktif"
              value={profile?.class_name ?? "-"}
            />
            <OverviewField
              label="Tahun ajaran"
              value={profile?.school_year_name ?? "-"}
            />
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Kehadiran
              </p>
              <p className="mt-3 text-5xl font-semibold tracking-[-0.06em] text-slate-950">
                {attendanceRate}%
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Persentase hadir dari seluruh data absensi yang tercatat.
              </p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ChartLine className="size-5" />
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#059669,#34d399)] transition-[width] duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            <OverviewStat
              label="Hadir"
              value={stats?.present ?? 0}
              tone="text-emerald-700"
            />
            <OverviewStat
              label="Izin"
              value={stats?.permission ?? 0}
              tone="text-sky-700"
            />
            <OverviewStat
              label="Sakit"
              value={stats?.sick ?? 0}
              tone="text-violet-700"
            />
            <OverviewStat
              label="Alfa"
              value={stats?.alpha ?? 0}
              tone="text-rose-700"
            />
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/82 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Ringkasan per bulan
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Pantau pola kehadiran dari bulan ke bulan sebelum membuka histori
              lengkap.
            </p>
          </div>
          <p className="text-xs font-medium text-emerald-700">
            {monthlySummary.length} periode tercatat
          </p>
        </div>

        {monthlySummary.length > 0 ? (
          <div className="mt-5 grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-3">
            {monthlySummary.map((month) => (
              <article
                key={month.key}
                className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/72 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {month.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {month.total} data absensi
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {month.attendanceRate}% hadir
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <OverviewStat
                    label="H"
                    value={month.present}
                    tone="text-emerald-700"
                    compact
                  />
                  <OverviewStat
                    label="I"
                    value={month.permission}
                    tone="text-sky-700"
                    compact
                  />
                  <OverviewStat
                    label="S"
                    value={month.sick}
                    tone="text-violet-700"
                    compact
                  />
                  <OverviewStat
                    label="A"
                    value={month.alpha}
                    tone="text-rose-700"
                    compact
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={CalendarCheck}
              title="Belum ada ringkasan bulanan"
              description="Ringkasan akan terbentuk setelah histori absensi tersedia."
              compact
            />
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1.1rem] border border-white bg-white/84 px-3.5 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.035)]">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string;
  value: number;
  tone: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[0.9rem] bg-white px-2 shadow-[0_6px_14px_rgba(15,23,42,0.03)] ${compact ? "py-2.5" : "py-3"}`}
    >
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function AttendanceRow({
  record,
  onOpen,
}: {
  record: StaffAttendanceRecord;
  onOpen: (record: StaffAttendanceRecord) => void;
}) {
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
        <p className="mt-1 text-slate-500">
          {formatStudentTime(record.check_in_at, "Tidak ada waktu")}
        </p>
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

function MobileAttendanceCard({
  record,
  onOpen,
}: {
  record: StaffAttendanceRecord;
  onOpen: (record: StaffAttendanceRecord) => void;
}) {
  return (
    <MobileDataCard>
      <MobileDataHeader
        title="Absensi Harian"
        subtitle={formatStudentDate(record.attendance_date)}
        badge={<StudentStatusPill status={record.status} />}
      />
      <div className="mt-4 grid gap-3">
        <MobileDataField
          label="Waktu"
          value={formatStudentTime(record.check_in_at, "Tidak ada waktu")}
        />
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

function SubmissionRow({
  submission,
  onOpen,
}: {
  submission: StudentSubmission;
  onOpen: (submission: StudentSubmission) => void;
}) {
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

function MobileSubmissionCard({
  submission,
  onOpen,
}: {
  submission: StudentSubmission;
  onOpen: (submission: StudentSubmission) => void;
}) {
  return (
    <MobileDataCard>
      <MobileDataHeader
        title="Pengajuan"
        subtitle={formatStudentDateTime(submission.created_at)}
        badge={<StudentSubmissionPill value={submission.status} />}
      />
      <div className="mt-4 grid gap-3">
        <MobileDataField
          label="Tipe"
          value={<StudentSubmissionPill value={submission.type} />}
        />
        <MobileDataField
          label="Validasi"
          value={submission.review_note || submission.reviewed_by_name || "-"}
        />
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

function getMonthlyAttendanceSummary(
  attendance: StaffAttendanceRecord[],
): MonthlyAttendanceSummary[] {
  const summaries = new Map<
    string,
    Omit<MonthlyAttendanceSummary, "label" | "attendanceRate">
  >();

  attendance.forEach((record) => {
    const key = record.attendance_date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) return;
    const current = summaries.get(key) ?? {
      key,
      total: 0,
      present: 0,
      permission: 0,
      sick: 0,
      alpha: 0,
    };
    current.total += 1;
    const status = record.status.toLowerCase();
    if (status === "hadir") current.present += 1;
    if (status === "izin") current.permission += 1;
    if (status === "sakit") current.sick += 1;
    if (status === "alfa") current.alpha += 1;
    summaries.set(key, current);
  });

  return [...summaries.values()]
    .sort((first, second) => second.key.localeCompare(first.key))
    .map((item) => ({
      ...item,
      label: new Date(`${item.key}-01T00:00:00`).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
      attendanceRate: item.total
        ? Math.round((item.present / item.total) * 100)
        : 0,
    }));
}
