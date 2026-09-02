"use client";

import { PremiumModal } from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportFormatQuestion,
  ReportRadio,
  type ReportFormat,
} from "@/features/reports/shared/report-question-ui";
import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import {
  getTeacherSubjectAttendance,
  getTeacherSubjectRecap,
  getTeacherSubjectSessions,
} from "@/services/staff.service";
import type {
  StaffSubjectAssignment,
  StaffSubjectAttendanceRecord,
  StaffSubjectRecap,
  StaffSubjectRecapStudentRow,
  StaffSubjectSessionListItem,
} from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  CalendarClock,
  Columns3,
  Database,
  Layers3,
  Printer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { id as localeID } from "date-fns/locale";
import { toast } from "sonner";

type SortBy = "name" | "nis" | "h" | "a";
type HisaRow = StaffSubjectRecapStudentRow & {
  h: number;
  i: number;
  s: number;
  a: number;
};
type ExportScope = "selected" | "all";
type Columns = { nis: boolean };
type DateMode = "today" | "specific" | "range" | "all";
type ClassScope = "all" | "selected";
type SessionReport = {
  assignment: StaffSubjectAssignment;
  sessions: StaffSubjectSessionListItem[];
  sessionDetails: Array<{
    session: StaffSubjectSessionListItem;
    records: StaffSubjectAttendanceRecord[];
  }>;
};

function getLastTableY(doc: unknown, fallback: number) {
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    ?.finalY;
  return typeof finalY === "number" ? finalY : fallback;
}

function parseDateValue(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReportDate(value: string) {
  const date = parseDateValue(value);
  return date
    ? date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

function DatePickerField({
  label,
  value,
  open,
  onOpenChange,
  onSelect,
}: {
  label: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[0.74rem] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={<Button type="button" variant="outline" />}
          className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-3 text-left text-sm text-slate-700"
        >
          <CalendarClock className="mr-1.5 size-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">
            {value ? formatReportDate(value) : "Pilih tanggal"}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-[22px] border border-emerald-200/80 bg-white p-4 shadow-xl">
          <PopoverHeader className="px-2 pb-2">
            <PopoverTitle className="text-sm font-semibold text-slate-900">
              {label}
            </PopoverTitle>
          </PopoverHeader>
          <Calendar
            mode="single"
            selected={parseDateValue(value)}
            onSelect={(date) => {
              onSelect(date ? toDateInputValue(date) : "");
              onOpenChange(false);
            }}
            locale={localeID}
            buttonVariant="ghost"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: StaffSubjectAssignment[];
  selectedAssignmentId: string;
  dateFrom?: string;
  dateTo?: string;
  periodeLabel: string;
};

export function SubjectSessionHistoryReportModal({
  open,
  onOpenChange,
  assignments,
  selectedAssignmentId,
  dateFrom,
  dateTo,
  periodeLabel: _periodeLabel,
}: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [scope, setScope] = useState<ExportScope | null>(null);
  const [reportAssignmentId, setReportAssignmentId] = useState("");
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [specificDate, setSpecificDate] = useState("");
  const [rangeFrom, setRangeFrom] = useState(dateFrom ?? "");
  const [rangeTo, setRangeTo] = useState(dateTo ?? "");
  const [classScope, setClassScope] = useState<ClassScope | null>(null);
  const [reportClassId, setReportClassId] = useState("");
  const [specificDateOpen, setSpecificDateOpen] = useState(false);
  const [rangeFromOpen, setRangeFromOpen] = useState(false);
  const [rangeToOpen, setRangeToOpen] = useState(false);
  const [columns, setColumns] = useState<Columns>({ nis: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScope(null);
    setReportAssignmentId("");
    setDateMode(null);
    setSpecificDate("");
    setRangeFrom(dateFrom ?? "");
    setRangeTo(dateTo ?? "");
    setClassScope(null);
    setReportClassId("");
    setFormat(null);
    setColumns({ nis: false });
    setSortBy(null);
  }, [dateFrom, dateTo, open]);

  const periodAnswered =
    dateMode === "all" ||
    dateMode === "today" ||
    (dateMode === "specific" && specificDate !== "") ||
    (dateMode === "range" && rangeFrom !== "" && rangeTo !== "" && rangeFrom <= rangeTo);

  const dateParams = useMemo(() => {
    if (dateMode === "today") {
      const today = new Date().toISOString().slice(0, 10);
      return { date_from: today, date_to: today };
    }
    if (dateMode === "specific") {
      return { date_from: specificDate, date_to: specificDate };
    }
    if (dateMode === "range") {
      return { date_from: rangeFrom, date_to: rangeTo };
    }
    return { date_from: undefined, date_to: undefined };
  }, [dateMode, rangeFrom, rangeTo, specificDate]);

  const targetAssignments = useMemo(() => {
    if (classScope === null) return [];
    const scopedAssignments =
      scope === "all"
        ? assignments
        : scope === "selected" && reportAssignmentId
          ? assignments.filter((item) => item.id === reportAssignmentId)
          : [];
    if (classScope === "all" || !reportClassId) return scopedAssignments;
    return scopedAssignments.filter((item) =>
      item.classes.some((classItem) => classItem.id === reportClassId),
    );
  }, [assignments, classScope, reportAssignmentId, reportClassId, scope]);

  const classOptions = useMemo(() => {
    const unique = new Map<string, string>();
    assignments.forEach((assignment) =>
      assignment.classes.forEach((classItem) => unique.set(classItem.id, classItem.name)),
    );
    return Array.from(unique, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "id"),
    );
  }, [assignments]);

  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assignments
            .map((assignment) => assignment.subject_name.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [assignments],
  );

  const recapsQuery = useQuery({
    queryKey: [
      "subject-session-report-recaps",
      scope,
      targetAssignments.map((item) => item.id),
      dateFrom,
      dateTo,
    ],
    queryFn: async () =>
      Promise.all(
        targetAssignments.map(async (item) => ({
          assignmentId: item.id,
          recap: await getTeacherSubjectRecap({
            assignment_id: item.id,
            date_from: dateParams.date_from,
            date_to: dateParams.date_to,
          }),
        })),
      ),
    enabled:
      open &&
      scope !== null &&
      periodAnswered &&
      targetAssignments.length > 0,
    staleTime: 30_000,
  });

  const sessionsQuery = useQuery({
    queryKey: [
      "subject-session-report-sessions",
      scope,
      targetAssignments.map((item) => item.id),
      dateParams.date_from,
      dateParams.date_to,
    ],
    queryFn: async () =>
      mapWithConcurrency(targetAssignments, 4, async (item) => {
        const sessions = (
          await getTeacherSubjectSessions({
            assignment_id: item.id,
            date_from: dateParams.date_from,
            date_to: dateParams.date_to,
          })
        ).sessions;
        const exportableSessions = sessions.filter((session) =>
          session.session_id?.trim(),
        );
        const sessionDetails = await mapWithConcurrency(
          exportableSessions,
          6,
          async (session) => ({
            session,
            records: (await getTeacherSubjectAttendance(session.session_id)).records,
          }),
        );
        return {
          assignment: item,
          sessions: exportableSessions,
          sessionDetails,
        };
      }),
    enabled:
      open &&
      scope !== null &&
      periodAnswered &&
      targetAssignments.length > 0,
    staleTime: 30_000,
  });

  const sortOptions = useMemo(
    () => [
      { value: "name" as const, label: "Nama (A-Z)" },
      ...(columns.nis ? [{ value: "nis" as const, label: "NIS" }] : []),
      { value: "h" as const, label: "Hadir terbanyak" },
      { value: "a" as const, label: "Alfa terbanyak" },
    ],
    [columns.nis],
  );

  useEffect(() => {
    if (sortBy && !sortOptions.some((option) => option.value === sortBy))
      setSortBy(null);
  }, [sortBy, sortOptions]);

  const recaps = recapsQuery.data ?? [];
  const sessionReports = sessionsQuery.data ?? [];
  const totalStudents = recaps.reduce(
    (total, item) => total + item.recap.students.length,
    0,
  );
  const hasData = recaps.some((item) => item.recap.students.length > 0);
  const hasSessionData = sessionReports.some((item) => item.sessions.length > 0);
  const reportPeriodLabel = useMemo(() => {
    if (dateMode === null) return "Pilih periode";
    if (dateMode === "all") return "Sepanjang periode";
    if (dateMode === "today") {
      const today = toDateInputValue(new Date());
      return `Hari ini (${formatReportDate(today)})`;
    }
    if (dateMode === "specific") return formatReportDate(specificDate);
    const availableDates = (sessionsQuery.data ?? [])
      .flatMap((item) => item.sessions.map((session) => session.tanggal))
      .filter(Boolean)
      .sort();
    const effectiveFrom = availableDates[0] || rangeFrom;
    const effectiveTo = availableDates.at(-1) || rangeTo;
    return `${formatReportDate(effectiveFrom)} - ${formatReportDate(effectiveTo)}`;
  }, [dateMode, rangeFrom, rangeTo, sessionsQuery.data, specificDate]);
  const selectedReportAssignment = assignments.find(
    (item) => item.id === reportAssignmentId,
  );

  function handleClose(isOpen: boolean) {
    if (!isOpen) setFormat(null);
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!scope || !sortBy || !format || !periodAnswered) return;
    setGenerating(true);
    try {
      const prepared = recaps
        .map(({ recap }) => ({
          recap,
          rows: sortRows(recap.students.map(toHisaRow), sortBy),
        }))
        .filter((item) => item.rows.length > 0);

      if (format === "excel") {
        if (!hasData) {
          toast.warning("Tidak ada rekap siswa yang sesuai filter.");
          return;
        }
        await generateSubjectRecapWorkbook(
          prepared,
          reportPeriodLabel,
          scope,
          columns,
        );
      } else {
        if (!hasSessionData) {
          toast.warning("Tidak ada sesi mapel yang sesuai filter.");
          return;
        }
        await generateSubjectSessionPdf(
          sessionReports,
          reportPeriodLabel,
          scope,
          classScope === "all"
            ? "Semua kelas"
            : (classOptions.find((item) => item.value === reportClassId)?.label ?? "Kelas terpilih"),
          sortBy,
        );
      }
    } catch {
      toast.error(
        `Gagal membuat ${format === "excel" ? "Excel" : "PDF"} rekap mapel. Silakan coba lagi.`,
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Export Laporan Sesi Mapel"
      description="Pilih cakupan mapel, periode, dan kelas. PDF sesi akan dipisah berdasarkan mapel, tanggal, lalu kelas."
      icon={Printer}
      className="sm:!max-w-[680px]"
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />

        <QuestionBlock
          icon={Layers3}
          label="Cakupan mata pelajaran"
          answered={Boolean(scope)}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={scope === "selected"}
              label="Mapel yang sedang dipilih"
              onClick={() => {
                setScope("selected");
                setReportAssignmentId(selectedAssignmentId);
              }}
            />
            <ReportRadio
              selected={scope === "all"}
              label={`Semua mapel (${assignments.length})`}
              onClick={() => setScope("all")}
            />
          </div>
          {scope === "all" ? (
            <div className="mt-3 rounded-[0.9rem] border border-slate-300/80 bg-white/55 px-3 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mapel yang termasuk
              </p>
              <div className="grid max-h-36 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {subjectOptions.map((subject, index) => (
                  <div
                    key={subject}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[0.68rem] font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <span className="truncate" title={subject}>
                      {subject}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {scope === "selected" ? (
            <div className="mt-3">
              <RadixSelectField
                value={reportAssignmentId}
                onValueChange={setReportAssignmentId}
                placeholder="Pilih mata pelajaran"
                options={assignments.map((item) => ({
                  value: item.id,
                  label: item.subject_name,
                }))}
              />
            </div>
          ) : null}
        </QuestionBlock>

        <QuestionBlock
          icon={CalendarClock}
          label="Pilih periode sesi"
          answered={periodAnswered}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={dateMode === "today"}
              label="Hari ini"
              badge={formatReportDate(toDateInputValue(new Date()))}
              onClick={() => {
                setDateMode("today");
                setSpecificDate("");
              }}
            />
            <ReportRadio
              selected={dateMode === "specific"}
              label="Tanggal tertentu"
              onClick={() => setDateMode("specific")}
            />
            <ReportRadio
              selected={dateMode === "range"}
              label="Rentang tanggal"
              onClick={() => setDateMode("range")}
            />
            <ReportRadio
              selected={dateMode === "all"}
              label="Sepanjang periode"
              badge="Semua data"
              onClick={() => {
                setDateMode("all");
                setSpecificDate("");
                setRangeFrom("");
                setRangeTo("");
              }}
            />
          </div>

          {dateMode === "specific" ? (
            <div className="mt-3">
              <Popover open={specificDateOpen} onOpenChange={setSpecificDateOpen}>
                <PopoverTrigger
                  render={<Button type="button" variant="outline" />}
                  className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-4 text-left text-slate-700"
                >
                  <CalendarClock className="mr-2 size-4 text-emerald-600" />
                  {specificDate ? formatReportDate(specificDate) : "Pilih tanggal"}
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-[22px] border border-emerald-200/80 bg-white p-4 shadow-xl">
                  <PopoverHeader className="px-2 pb-2">
                    <PopoverTitle className="text-sm font-semibold text-slate-900">
                      Pilih tanggal sesi
                    </PopoverTitle>
                  </PopoverHeader>
                  <Calendar
                    mode="single"
                    selected={parseDateValue(specificDate)}
                    onSelect={(date) => {
                      setSpecificDate(date ? toDateInputValue(date) : "");
                      setSpecificDateOpen(false);
                    }}
                    locale={localeID}
                    buttonVariant="ghost"
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : null}

          {dateMode === "range" ? (
            <div className="mt-3 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
              <DatePickerField
                label="Tanggal dari"
                value={rangeFrom}
                open={rangeFromOpen}
                onOpenChange={setRangeFromOpen}
                onSelect={setRangeFrom}
              />
              <DatePickerField
                label="Tanggal sampai"
                value={rangeTo}
                open={rangeToOpen}
                onOpenChange={setRangeToOpen}
                onSelect={setRangeTo}
              />
            </div>
          ) : null}
        </QuestionBlock>

        <QuestionBlock
          icon={Layers3}
          label="Cakupan kelas"
          answered={classScope === "all" || reportClassId !== ""}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={classScope === "all"}
              label="Semua kelas"
              onClick={() => {
                setClassScope("all");
                setReportClassId("");
              }}
            />
            <ReportRadio
              selected={classScope === "selected"}
              label="Kelas tertentu"
              onClick={() => setClassScope("selected")}
            />
          </div>
          {classScope === "selected" ? (
            <div className="mt-3">
              <RadixSelectField
                value={reportClassId}
                onValueChange={setReportClassId}
                placeholder="Pilih kelas"
                options={classOptions}
              />
            </div>
          ) : null}
        </QuestionBlock>

        <QuestionBlock
          icon={Columns3}
          label={format === "pdf" ? "Isi tabel PDF" : "Kolom rekap Excel"}
          answered
        >
          {format === "pdf" ? (
            <p className="rounded-[0.9rem] border border-slate-200 bg-white/70 px-4 py-3 text-sm leading-relaxed text-slate-600">
              PDF menampilkan sesi per mapel, tanggal, dan kelas, lengkap
              dengan jam serta rincian H-I-S-A.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <ReportCheckbox
                checked
                disabled
                label="Nama Siswa"
                badge="wajib"
              />
              <ReportCheckbox
                checked={columns.nis}
                onChange={(value) =>
                  setColumns((current) => ({ ...current, nis: value }))
                }
                label="NIS"
              />
              <ReportCheckbox
                checked
                disabled
                label="Rekap H I S A"
                badge="wajib"
              />
            </div>
          )}
        </QuestionBlock>

        <QuestionBlock
          icon={ArrowUpDown}
          label="Urutkan data berdasarkan"
          answered={sortBy !== null}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {sortOptions.map((option) => (
              <ReportRadio
                key={option.value}
                selected={sortBy === option.value}
                label={option.label}
                onClick={() => setSortBy(option.value)}
              />
            ))}
          </div>
        </QuestionBlock>

        <QuestionBlock
          icon={Database}
          label="Data laporan"
          answered={
            (recapsQuery.isSuccess && hasData) ||
            (sessionsQuery.isSuccess && hasSessionData)
          }
        >
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm text-slate-600">
            {recapsQuery.isLoading || sessionsQuery.isLoading ? (
              <p>Menyiapkan data sesi mapel...</p>
            ) : recapsQuery.error || sessionsQuery.error ? (
              <p className="text-rose-600">
                {(recapsQuery.error || sessionsQuery.error)?.message}
              </p>
            ) : (
              <>
                <p className="font-semibold text-slate-900">
                  {scope === "all"
                    ? `${recaps.length} mapel siap diekspor`
                    : (selectedReportAssignment?.subject_name ??
                      "Mapel belum dipilih")}
                </p>
                <p className="mt-1">Periode: {reportPeriodLabel}</p>
                <p>
                  {scope === "all"
                    ? `${sessionReports.reduce((total, item) => total + item.sessions.length, 0)} sesi`
                    : `${totalStudents} baris siswa`} {" · "}
                  {classScope === "all" ? "Semua kelas" : "Kelas terpilih"}
                </p>
              </>
            )}
          </div>
        </QuestionBlock>

        <ReportModalFooter
          canDownload={Boolean(
            format &&
            sortBy &&
            periodAnswered &&
            ((format === "excel" && hasData) ||
              (format === "pdf" && hasSessionData)) &&
            !recapsQuery.isLoading &&
            !sessionsQuery.isLoading,
          )}
          generating={generating}
          onCancel={() => handleClose(false)}
          onDownload={handleDownload}
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={
            format
              ? `Unduh ${format === "excel" ? "Excel" : "PDF"}`
              : "Pilih format laporan"
          }
        />
      </div>
    </PremiumModal>
  );
}

function sortRows(rows: HisaRow[], sortBy: SortBy) {
  return [...rows].sort((first, second) => {
    if (sortBy === "nis") return first.nis.localeCompare(second.nis, "id");
    if (sortBy === "h") return second.h - first.h;
    if (sortBy === "a") return second.a - first.a;
    return first.student_name.localeCompare(second.student_name, "id");
  });
}

function toHisaRow(row: StaffSubjectRecapStudentRow): HisaRow {
  return { ...row, h: row.hadir, i: row.izin, s: row.sakit, a: row.alfa };
}

function formatSessionStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

async function generateSubjectSessionPdf(
  reports: SessionReport[],
  periodeLabel: string,
  scope: ExportScope,
  classLabel: string,
  sortBy: SortBy,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const mx = REPORT_PDF_MARGIN_X;

  const subjectGroups = new Map<string, SessionReport[]>();
  reports.forEach((report) => {
    const subject = report.assignment.subject_name;
    subjectGroups.set(subject, [...(subjectGroups.get(subject) ?? []), report]);
  });

  for (const [subjectIndex, [subjectName, subjectReports]] of Array.from(
    subjectGroups.entries(),
  ).entries()) {
    if (subjectIndex > 0) doc.addPage();
    const { metaY } = await drawReportPdfHeader(doc, {
      title: "LAPORAN SESI MAPEL",
      subtitle: "Riwayat sesi guru mata pelajaran",
    });
    const pillsBottomY = drawReportPdfPills(
      doc,
      [
        `Mapel: ${subjectName}`,
        `Cakupan kelas: ${classLabel}`,
        `Periode: ${periodeLabel}`,
        `Urutan: ${getSortLabel(sortBy)}`,
        `Sesi: ${subjectReports.reduce((total, report) => total + report.sessions.length, 0)}`,
      ],
      metaY,
    );

    const dateGroups = new Map<
      string,
      Array<{
        report: SessionReport;
        session: StaffSubjectSessionListItem;
        records: StaffSubjectAttendanceRecord[];
      }>
    >();
    subjectReports.forEach((report) => {
      report.sessionDetails.forEach(({ session, records }) => {
        const date = session.tanggal || "-";
        dateGroups.set(date, [
          ...(dateGroups.get(date) ?? []),
          { report, session, records },
        ]);
      });
    });

    let startY = pillsBottomY + 5;
    Array.from(dateGroups.entries())
      .sort(([first], [second]) => first.localeCompare(second))
      .forEach(([date, dateSessions]) => {
        const classGroups = new Map<
          string,
          Array<{
            report: SessionReport;
            session: StaffSubjectSessionListItem;
            records: StaffSubjectAttendanceRecord[];
          }>
        >();
        dateSessions.forEach((entry) => {
          const className = entry.session.class_name || entry.report.assignment.class_name || "Kelas tidak tersedia";
          const classKey = entry.session.class_id || className;
          classGroups.set(classKey, [...(classGroups.get(classKey) ?? []), entry]);
        });

        Array.from(classGroups.entries())
          .sort(([, first], [, second]) =>
            (first[0]?.session.class_name || "").localeCompare(
              second[0]?.session.class_name || "",
              "id",
            ),
          )
          .forEach(([, classSessions]) => {
            classSessions.sort((first, second) =>
              `${first.session.jam_mulai}-${first.session.jam_selesai}`.localeCompare(
                `${second.session.jam_mulai}-${second.session.jam_selesai}`,
              ),
            );

            classSessions.forEach(({ session, records }) => {
              const className = session.class_name || "Kelas tidak tersedia";
              const sessionHeadingHeight = 9;
              if (startY > 272 - sessionHeadingHeight) {
                doc.addPage();
                startY = 18;
              }

              doc.setFont("helvetica", "bold");
              doc.setFontSize(8.5);
              doc.setTextColor(71, 85, 105);
              doc.text(
                `Tanggal: ${date === "-" ? "Tidak tersedia" : formatReportDate(date)} · ${session.jam_mulai}–${session.jam_selesai}`,
                mx,
                startY,
              );
              doc.text(`Kelas: ${className}`, mx, startY + 4.5);
              startY += sessionHeadingHeight;

              const sortedRecords = [...records].sort((first, second) => {
                if (sortBy === "nis") return first.nis.localeCompare(second.nis, "id");
                return first.student_name.localeCompare(second.student_name, "id");
              });
              const body = sortedRecords.length
                ? sortedRecords.map((record, index) => [
                    String(index + 1),
                    record.student_name,
                    record.nis,
                    formatSessionStatus(record.status_mapel),
                  ])
                : [["-", "Belum ada data siswa", "-", "-"]];

              autoTable(doc, {
                head: [["No", "Nama Siswa", "NIS", "Status Kehadiran"]],
                body,
                startY,
                margin: { left: mx, right: mx },
                tableWidth: doc.internal.pageSize.getWidth() - mx * 2,
                ...REPORT_TABLE_STYLE,
                styles: {
                  ...REPORT_TABLE_STYLE.styles,
                  fontSize: 8,
                  cellPadding: { horizontal: 3, vertical: 2.8 },
                },
                columnStyles: {
                  0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
                  1: { cellWidth: 92 },
                  2: { cellWidth: 40, halign: "center" },
                  3: { cellWidth: 36, halign: "center" },
                },
              });
              startY = getLastTableY(doc, startY) + 5;
            });
          });
      });

    drawReportPdfFooter(
      doc,
      `Sesi Mapel - ${subjectName} - CITRA NEGARA ATTENDANCE SYSTEM`,
    );
  }

  doc.save(
    `Laporan-Sesi-Mapel-${scope === "all" ? "Semua-Mapel" : "Mapel-Terpilih"}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

async function generateSubjectRecapWorkbook(
  reports: Array<{ recap: StaffSubjectRecap; rows: HisaRow[] }>,
  periodeLabel: string,
  scope: ExportScope,
  columns: Columns,
) {
  const summaryRows = reports.flatMap((report) => report.rows);
  const totals = sumRows(summaryRows);
  const primary = reports[0].recap;
  const usedNames = new Set<string>();
  const additionalSheets = reports.map((report, index) => ({
    name: uniqueSheetName(
      `Mapel ${report.recap.assignment.subject_name} - ${report.recap.assignment.class_name}`,
      usedNames,
      index,
    ),
    rows: report.rows,
    showColumnFilters: false,
    columns: recapColumns(columns),
  }));

  await exportStyledExcelReport({
    filename: `Laporan-Rekap-Sesi-Mapel-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN REKAP SESI MAPEL",
    subtitle: "Sekolah Citra Negara - Rekap Kehadiran Guru Mata Pelajaran",
    metadata: [
      {
        label: "Cakupan",
        value:
          scope === "all" ? "Semua mapel" : primary.assignment.subject_name,
      },
      { label: "Periode", value: periodeLabel },
      { label: "Jumlah mapel", value: reports.length },
      { label: "Jumlah siswa", value: summaryRows.length },
    ],
    rows: summaryRows,
    columns: recapColumns(columns),
    metrics: [
      { label: "Total Mapel", value: reports.length, tone: "emerald" },
      { label: "Total Siswa", value: summaryRows.length, tone: "sky" },
      { label: "Total Hadir", value: totals.h, tone: "emerald" },
      { label: "Total Izin", value: totals.i, tone: "sky" },
      { label: "Total Sakit", value: totals.s, tone: "violet" },
      { label: "Total Alfa", value: totals.a, tone: "rose" },
    ],
    includeDataSheet: false,
    includeStatisticsSheet: false,
    additionalSheets,
  });
}

function recapColumns(columns: Columns) {
  return [
    {
      header: "No",
      value: (_row: HisaRow, index: number) => index + 1,
      width: 7,
      kind: "number" as const,
    },
    {
      header: "Nama Siswa",
      value: (row: HisaRow) => row.student_name,
      width: 28,
    },
    ...(columns.nis
      ? [{ header: "NIS", value: (row: HisaRow) => row.nis, width: 17 }]
      : []),
    {
      header: "H",
      value: (row: HisaRow) => row.h,
      width: 8,
      kind: "attendance" as const,
    },
    {
      header: "I",
      value: (row: HisaRow) => row.i,
      width: 8,
      kind: "attendance" as const,
    },
    {
      header: "S",
      value: (row: HisaRow) => row.s,
      width: 8,
      kind: "attendance" as const,
    },
    {
      header: "A",
      value: (row: HisaRow) => row.a,
      width: 8,
      kind: "attendance" as const,
    },
  ];
}

function sumRows(rows: HisaRow[]) {
  return rows.reduce(
    (total, row) => ({
      h: total.h + row.h,
      i: total.i + row.i,
      s: total.s + row.s,
      a: total.a + row.a,
    }),
    { h: 0, i: 0, s: 0, a: 0 },
  );
}

function uniqueSheetName(value: string, usedNames: Set<string>, index: number) {
  const base =
    value
      .replace(/[\\/*?:[\]]/g, " ")
      .trim()
      .slice(0, 27) || `Mapel ${index + 1}`;
  let name = base;
  let suffix = 2;
  while (usedNames.has(name) || name === "Ringkasan") {
    name = `${base.slice(0, 31 - String(suffix).length - 1)} ${suffix}`;
    suffix += 1;
  }
  usedNames.add(name);
  return name;
}

function getSortLabel(sortBy: SortBy) {
  if (sortBy === "nis") return "NIS";
  if (sortBy === "h") return "Hadir terbanyak";
  if (sortBy === "a") return "Alfa terbanyak";
  return "Nama (A-Z)";
}
