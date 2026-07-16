"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import { getTeacherSubjectAssignments, getTeacherSubjectSessions } from "@/services/staff.service";
import dynamic from "@/lib/dynamic";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { motion } from "motion/react";
import { BookOpenCheck, CalendarDays, Eye, History, Printer } from "lucide-react";
import { AppLink as Link } from "@/components/router/app-link";
import { useSearchParams } from "@/lib/router";
import { useState } from "react";

const SubjectSessionHistoryReportModal = dynamic(
  () =>
    import("@/features/reports/subject/session-history-report-modal").then(
      (module) => module.SubjectSessionHistoryReportModal,
    ),
  { ssr: false },
);

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  belum_divalidasi: { label: "Belum Divalidasi", cls: "bg-amber-100 text-amber-700" },
  sudah_divalidasi: { label: "Sudah Divalidasi", cls: "bg-emerald-100 text-emerald-700" },
  diedit: { label: "Diedit", cls: "bg-violet-100 text-violet-700" },
};

const HARI_LABEL: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis",
  jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "belum_divalidasi", label: "Belum Divalidasi" },
  { value: "sudah_divalidasi", label: "Sudah Divalidasi" },
  { value: "diedit", label: "Diedit" },
];

type DateFilterMode = "single" | "range";

export function MapelHistoryPage() {
  const searchParams = useSearchParams();
  const defaultAssignment = searchParams.get("assignment_id") ?? "";

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(defaultAssignment);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("range");
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [rangeDateFrom, setRangeDateFrom] = useState<Date | undefined>(undefined);
  const [rangeDateTo, setRangeDateTo] = useState<Date | undefined>(undefined);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const dateFromStr = dateFilterMode === "single"
    ? singleDate ? format(singleDate, "yyyy-MM-dd") : ""
    : rangeDateFrom ? format(rangeDateFrom, "yyyy-MM-dd") : "";
  const dateToStr = dateFilterMode === "single"
    ? singleDate ? format(singleDate, "yyyy-MM-dd") : ""
    : rangeDateTo ? format(rangeDateTo, "yyyy-MM-dd") : "";

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: getTeacherSubjectAssignments,
    staleTime: 60_000,
  });

  const sessionsQuery = useQuery({
    queryKey: ["subject-sessions", selectedAssignmentId, statusFilter, dateFromStr, dateToStr],
    queryFn: () =>
      getTeacherSubjectSessions({
        assignment_id: selectedAssignmentId,
        status: statusFilter !== "all" ? statusFilter : undefined,
        date_from: dateFromStr || undefined,
        date_to: dateToStr || undefined,
      }),
    enabled: !!selectedAssignmentId,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const assignments = assignmentsQuery.data ?? [];
  const sessionList = sessionsQuery.data;
  const sessions = sessionsQuery.data?.sessions ?? [];
  const selectedAssignment = sessionList?.assignment ?? assignments.find((a) => a.id === selectedAssignmentId);
  const periodeLabel = buildPeriodLabel(dateFromStr, dateToStr, sessions.map((session) => session.tanggal));
  const statusLabel = STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label ?? "Semua status";

  const assignmentOptions = assignments.map((a) => ({
    value: a.id,
    label: `${a.subject_name} — ${a.class_name}`,
  }));

  return (
    <WalasShell>
      {() => (
        <>
          {/* Filter */}
          <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-semibold text-slate-950">Filter Sesi Mapel</p>
              <Button
                type="button"
                disabled={!selectedAssignmentId || sessions.length === 0 || sessionsQuery.isLoading}
                onClick={() => setReportModalOpen(true)}
                className="h-11 rounded-[1rem] bg-emerald-700 px-4 text-white shadow-[0_14px_28px_rgba(5,150,105,0.18)] hover:bg-emerald-800"
              >
                <Printer className="size-4" />
                Cetak Laporan
              </Button>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr]">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mata Pelajaran</label>
                <RadixSelectField
                  value={selectedAssignmentId}
                  onValueChange={setSelectedAssignmentId}
                  placeholder="Pilih mata pelajaran"
                  options={assignmentOptions}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Semua status"
                  options={STATUS_OPTIONS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mode Tanggal</label>
                <DateFilterModeSwitch value={dateFilterMode} onChange={setDateFilterMode} />
              </div>

              {dateFilterMode === "single" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tanggal Tertentu</label>
                  <DatePickerButton
                    value={singleDate}
                    onChange={setSingleDate}
                    placeholder="Pilih tanggal"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Dari</label>
                    <DatePickerButton
                      value={rangeDateFrom}
                      onChange={setRangeDateFrom}
                      placeholder="Dari"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Sampai</label>
                    <DatePickerButton
                      value={rangeDateTo}
                      onChange={setRangeDateTo}
                      placeholder="Sampai"
                    />
                  </div>
                </div>
              )}
            </div>
            {dateFilterMode === "range" && !dateFromStr && !dateToStr ? (
              <p className="mt-3 text-sm text-slate-500">
                Tanpa tanggal terpilih, sistem menampilkan semua data pada periode{" "}
                <span className="font-medium text-emerald-700">{periodeLabel}</span>.
              </p>
            ) : null}
          </section>

          {/* Sessions list */}
          {!selectedAssignmentId ? (
            <section>
              <EmptyState
                icon={History}
                title="Pilih mata pelajaran"
                description="Pilih mata pelajaran di atas untuk melihat sesi mapel."
              />
            </section>
          ) : sessionsQuery.error ? (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <EmptyState icon={History} title="Riwayat belum bisa dimuat" description={sessionsQuery.error.message} />
            </section>
          ) : sessions.length === 0 ? (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <EmptyState
                icon={BookOpenCheck}
                title="Belum ada sesi tercatat"
                description="Belum ada sesi yang tersimpan untuk mata pelajaran ini."
              />
            </section>
          ) : (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <p className="mb-4 text-lg font-semibold text-slate-950">
                Sesi Mapel
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({sessions.length} sesi)
                </span>
              </p>
              <p className="-mt-2 mb-4 text-sm text-slate-500">
                Periode: <span className="font-medium text-emerald-700">{periodeLabel}</span>
                <span className="mx-2 text-slate-300">/</span>
                Status: <span className="font-medium text-slate-700">{statusLabel}</span>
              </p>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="pb-3 pr-4">Tanggal</th>
                      <th className="pb-3 pr-4">Hari / Jam</th>
                      <th className="pb-3 pr-4">Konteks Mapel</th>
                      <th className="pb-3 pr-4">Topik</th>
                      <th className="pb-3 pr-4 text-center text-emerald-600">H</th>
                      <th className="pb-3 pr-4 text-center text-slate-600">I</th>
                      <th className="pb-3 pr-4 text-center text-sky-600">S</th>
                      <th className="pb-3 pr-4 text-center text-rose-600">A</th>
                      <th className="pb-3 pr-4 text-center text-violet-600">D</th>
                      <th className="pb-3 pr-4 text-center">Status</th>
                      <th className="pb-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sessions.map((sess, i) => {
                      const statusInfo = STATUS_MAP[sess.status] ?? {
                        label: sess.status,
                        cls: "bg-slate-100 text-slate-600",
                      };
                      return (
                        <motion.tr
                          key={sess.session_id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                        >
                          <td className="py-3 pr-4 font-semibold text-slate-950">{formatDisplayDate(sess.tanggal)}</td>
                          <td className="py-3 pr-4 text-slate-600">
                            <span className="font-medium text-slate-800">{HARI_LABEL[sess.hari] ?? sess.hari}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{sess.jam_mulai}-{sess.jam_selesai}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900">{selectedAssignment?.subject_name ?? "Mapel"}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{selectedAssignment?.class_name ?? "Kelas belum dipilih"}</p>
                          </td>
                          <td className="max-w-[240px] py-3 pr-4 text-slate-600">
                            <span className="line-clamp-2">{sess.topic || "Belum ada topik"}</span>
                          </td>
                          <HistoryMetric value={sess.hadir} cls="text-emerald-700 bg-emerald-50" />
                          <HistoryMetric value={sess.izin} cls="text-slate-600 bg-slate-50" />
                          <HistoryMetric value={sess.sakit} cls="text-sky-700 bg-sky-50" />
                          <HistoryMetric value={sess.alfa} cls="text-rose-700 bg-rose-50" />
                          <HistoryMetric value={sess.dispensasi} cls="text-violet-700 bg-violet-50" />
                          <td className="py-3 pr-4 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.cls}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <Link
                              href={`/dashboard/teacher/subject/session?session_id=${sess.session_id}`}
                              aria-label={`Lihat sesi ${formatDisplayDate(sess.tanggal)}`}
                              title="Lihat sesi"
                              className="inline-flex size-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100"
                            >
                              <Eye className="size-4" />
                            </Link>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {sessions.map((sess, i) => {
                  const statusInfo = STATUS_MAP[sess.status] ?? {
                    label: sess.status,
                    cls: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <motion.div
                      key={sess.session_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.03 }}
                      className="rounded-[1.35rem] border border-emerald-100/70 bg-white/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDisplayDate(sess.tanggal)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {HARI_LABEL[sess.hari] ?? sess.hari} · {sess.jam_mulai}–{sess.jam_selesai}
                        </p>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-900">{selectedAssignment?.subject_name ?? "Mapel"}</p>
                        <p className="text-xs text-slate-500">{selectedAssignment?.class_name ?? "Kelas belum dipilih"}</p>
                        <p className="mt-2 text-sm text-slate-600">{sess.topic || "Belum ada topik"}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="grid flex-1 grid-cols-5 gap-1 text-center text-xs">
                          <HistoryMiniMetric label="H" value={sess.hadir} cls="text-emerald-700 bg-emerald-50" />
                          <HistoryMiniMetric label="I" value={sess.izin} cls="text-slate-600 bg-slate-50" />
                          <HistoryMiniMetric label="S" value={sess.sakit} cls="text-sky-700 bg-sky-50" />
                          <HistoryMiniMetric label="A" value={sess.alfa} cls="text-rose-700 bg-rose-50" />
                          <HistoryMiniMetric label="D" value={sess.dispensasi} cls="text-violet-700 bg-violet-50" />
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                        <Link
                          href={`/dashboard/teacher/subject/session?session_id=${sess.session_id}`}
                          aria-label={`Lihat sesi ${formatDisplayDate(sess.tanggal)}`}
                          title="Lihat sesi"
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100"
                        >
                          <Eye className="size-4" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {reportModalOpen ? (
            <SubjectSessionHistoryReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              assignment={selectedAssignment}
              sessions={sessions}
              periodeLabel={periodeLabel}
              statusLabel={statusLabel}
            />
          ) : null}
        </>
      )}
    </WalasShell>
  );
}

function buildPeriodLabel(from: string, to: string, availableDates: string[]) {
  if (from && to && from === to) return `Tanggal ${formatReportDate(from)}`;
  if (from && to) return `${formatReportDate(from)} - ${formatReportDate(to)}`;
  if (from) return `Mulai ${formatReportDate(from)}`;
  if (to) return `Sampai ${formatReportDate(to)}`;

  const sortedDates = [...new Set(availableDates)].filter(Boolean).sort((a, b) => a.localeCompare(b));
  if (sortedDates.length === 1) return `Tanggal ${formatReportDate(sortedDates[0])}`;
  if (sortedDates.length > 1) {
    return `${formatReportDate(sortedDates[0])} - ${formatReportDate(sortedDates[sortedDates.length - 1])}`;
  }
  return "Belum ada tanggal tercatat";
}

function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function HistoryMetric({ value, cls }: { value: number; cls: string }) {
  return (
    <td className="py-3 pr-4 text-center">
      <span className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}>
        {value || "-"}
      </span>
    </td>
  );
}

function HistoryMiniMetric({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 px-2 py-2">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className={`mt-1 rounded-full px-1.5 py-0.5 font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}>
        {value || "-"}
      </p>
    </div>
  );
}

function DatePickerButton({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className="h-14 w-full justify-start rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
          <span className={`truncate text-sm font-medium ${value ? "text-slate-700" : "text-slate-400"}`}>
            {value ? format(value, "d MMM yy", { locale: localeID }) : placeholder}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => { onChange(date); setOpen(false); }}
          locale={localeID}
          buttonVariant="ghost"
        />
      </PopoverContent>
    </Popover>
  );
}

function DateFilterModeSwitch({
  value,
  onChange,
}: {
  value: DateFilterMode;
  onChange: (value: DateFilterMode) => void;
}) {
  return (
    <div className="grid h-14 grid-cols-2 rounded-[1.25rem] border border-slate-300/80 bg-white/70 p-1 shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]">
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange("single")}
        className={`h-full rounded-[1rem] px-2 text-xs font-semibold ${
          value === "single" ? "bg-emerald-600 !text-white hover:bg-emerald-700 hover:!text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        Tanggal
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange("range")}
        className={`h-full rounded-[1rem] px-2 text-xs font-semibold ${
          value === "range" ? "bg-emerald-600 !text-white hover:bg-emerald-700 hover:!text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        Rentang
      </Button>
    </div>
  );
}
