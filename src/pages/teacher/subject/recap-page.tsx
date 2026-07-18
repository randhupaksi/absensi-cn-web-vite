"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import {
  MobileDataCard,
  MobileDataHeader,
  MobileDataList,
} from "@/features/admin/management/shared/section-ui";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import { getTeacherSubjectAssignments, getTeacherSubjectRecap } from "@/services/staff.service";
import dynamic from "@/lib/dynamic";
import type { StaffSubjectRecapStudentRow } from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { motion } from "motion/react";
import { BookOpenCheck, CalendarDays, ChartColumnBig, Printer } from "lucide-react";
import { useState } from "react";
import { HistoryPageSkeleton } from "@/components/loading/loading-system";

const SubjectRecapReportModal = dynamic(
  () => import("@/features/reports/subject/subject-recap-report-modal").then((module) => module.SubjectRecapReportModal),
  { ssr: false },
);

type DateFilterMode = "single" | "range";

export function MapelRecapPage() {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
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

  const recapQuery = useQuery({
    queryKey: ["subject-recap", selectedAssignmentId, dateFromStr, dateToStr],
    queryFn: () =>
      getTeacherSubjectRecap({
        assignment_id: selectedAssignmentId,
        date_from: dateFromStr || undefined,
        date_to: dateToStr || undefined,
      }),
    enabled: !!selectedAssignmentId,
    placeholderData: (previousData) => previousData,
    staleTime: 0,
  });

  const assignments = assignmentsQuery.data ?? [];
  const recap = recapQuery.data;
  const periodeLabel = buildPeriodLabel(dateFromStr, dateToStr, recap?.period_start, recap?.period_end);

  const assignmentOptions = assignments.map((a) => ({
    value: a.id,
    label: `${a.subject_name} — ${a.class_name} (${a.school_year_name})`,
  }));

  return (
    <WalasShell>
      {() => (
        (assignmentsQuery.isLoading && !assignmentsQuery.data) ||
        (Boolean(selectedAssignmentId) && recapQuery.isLoading && !recapQuery.data)
      ) ? (
        <HistoryPageSkeleton />
      ) : (
        <>
          {/* Filter */}
          <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-semibold text-slate-950">Filter Rekap</p>
              <Button
                type="button"
                disabled={!recap || recap.students.length === 0 || recapQuery.isLoading}
                onClick={() => setReportModalOpen(true)}
                className="h-11 rounded-[1rem] bg-emerald-700 px-4 text-white shadow-[0_14px_28px_rgba(5,150,105,0.18)] hover:bg-emerald-800"
              >
                <Printer className="size-4" />
                Export Laporan
              </Button>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_2fr]">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mata Pelajaran</label>
                <RadixSelectField
                  value={selectedAssignmentId}
                  onValueChange={setSelectedAssignmentId}
                  placeholder="Pilih mata pelajaran"
                  options={assignmentOptions}
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

          {/* Recap table */}
          {!selectedAssignmentId ? (
            <section>
              <EmptyState icon={ChartColumnBig} title="Pilih mata pelajaran" description="Pilih mata pelajaran untuk melihat rekap kehadiran siswa." />
            </section>
          ) : recapQuery.error ? (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <EmptyState icon={ChartColumnBig} title="Rekap belum bisa dimuat" description={recapQuery.error.message} />
            </section>
          ) : recap ? (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-slate-950">
                    {recap.assignment.subject_name} — {recap.assignment.class_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {recap.assignment.school_year_name} ·{" "}
                    <span className="font-medium text-emerald-700">{recap.total_pertemuan} pertemuan</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Periode: <span className="font-medium text-emerald-700">{periodeLabel}</span>
                  </p>
                </div>
              </div>

              {recap.students.length === 0 ? (
                <EmptyState icon={BookOpenCheck} title="Belum ada data pertemuan" description="Belum ada sesi yang divalidasi dalam rentang tanggal ini." />
              ) : (
                <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <th className="pb-3 pr-4">Siswa</th>
                        <th className="pb-3 pr-4">NIS</th>
                        <th className="pb-3 pr-4 text-center text-emerald-600">Hadir</th>
                        <th className="pb-3 pr-4 text-center text-sky-600">Izin</th>
                        <th className="pb-3 pr-4 text-center text-violet-600">Sakit</th>
                        <th className="pb-3 text-center text-rose-600">Alfa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recap.students.map((s, i) => (
                        <motion.tr
                          key={s.student_id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                        >
                          <td className="py-3 pr-4 font-medium text-slate-900">{s.student_name}</td>
                          <td className="py-3 pr-4 text-slate-500">{s.nis}</td>
                          <RecapCell value={s.hadir} cls="text-emerald-700 bg-emerald-50" />
                          <RecapCell value={s.izin} cls="text-sky-700 bg-sky-50" />
                          <RecapCell value={s.sakit} cls="text-violet-700 bg-violet-50" />
                          <RecapCell value={s.alfa} cls="text-rose-700 bg-rose-50" />
                        </motion.tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-100">
                        <td colSpan={2} className="py-3 text-xs font-semibold text-slate-500">
                          Total ({recap.students.length} siswa)
                        </td>
                        <SumCell rows={recap.students} field="hadir" cls="text-emerald-700" />
                        <SumCell rows={recap.students} field="izin" cls="text-sky-700" />
                        <SumCell rows={recap.students} field="sakit" cls="text-violet-700" />
                        <SumCell rows={recap.students} field="alfa" cls="text-rose-700" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <MobileDataList>
                  {recap.students.map((s) => (
                    <MobileDataCard key={s.student_id}>
                      <MobileDataHeader title={s.student_name} subtitle={s.nis} />
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                        <RecapMetric label="Hadir" value={s.hadir} cls="text-emerald-700 bg-emerald-50" />
                        <RecapMetric label="Izin" value={s.izin} cls="text-sky-700 bg-sky-50" />
                        <RecapMetric label="Sakit" value={s.sakit} cls="text-violet-700 bg-violet-50" />
                        <RecapMetric label="Alfa" value={s.alfa} cls="text-rose-700 bg-rose-50" />
                      </div>
                    </MobileDataCard>
                  ))}
                </MobileDataList>
                </>
              )}
            </section>
          ) : (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <EmptyState icon={BookOpenCheck} title="Belum ada data rekap" description="Pilih filter lain atau pastikan seed sesi mapel sudah berjalan." />
            </section>
          )}

          {reportModalOpen ? (
            <SubjectRecapReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              recap={recap}
              periodeLabel={periodeLabel}
            />
          ) : null}
        </>
      )}
    </WalasShell>
  );
}

function buildPeriodLabel(from: string, to: string, periodStart?: string, periodEnd?: string) {
  if (from && to && from === to) return `Tanggal ${formatReportDate(from)}`;
  if (from && to) return `${formatReportDate(from)} - ${formatReportDate(to)}`;
  if (from) return `Mulai ${formatReportDate(from)}`;
  if (to) return `Sampai ${formatReportDate(to)}`;

  if (periodStart && periodEnd && periodStart === periodEnd) return `Tanggal ${formatReportDate(periodStart)}`;
  if (periodStart && periodEnd) return `${formatReportDate(periodStart)} - ${formatReportDate(periodEnd)}`;
  return "Belum ada tanggal tercatat";
}

function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
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
        className="h-14 w-full justify-start rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
          <span className={`truncate text-sm font-medium ${value ? "text-slate-700" : "text-slate-400"}`}>
            {value ? format(value, "d MMM yyyy", { locale: localeID }) : placeholder}
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

function RecapCell({ value, cls }: { value: number; cls: string }) {
  return (
    <td className="py-3 pr-4 text-center">
      {value > 0 ? (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{value}</span>
      ) : (
        <span className="text-xs text-slate-300">—</span>
      )}
    </td>
  );
}

function RecapMetric({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <span className={`mt-2 inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}>
        {value}
      </span>
    </div>
  );
}

function SumCell({ rows, field, cls }: { rows: StaffSubjectRecapStudentRow[]; field: keyof StaffSubjectRecapStudentRow; cls: string }) {
  const total = rows.reduce((sum, r) => sum + (r[field] as number), 0);
  return <td className={`py-3 pr-4 text-center text-xs font-bold ${cls}`}>{total}</td>;
}
