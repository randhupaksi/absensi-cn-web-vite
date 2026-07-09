"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadRow,
  DataTablePagination,
  DataTableRow,
  SearchFilterBar,
  usePagination,
} from "@/components/dashboard/admin/sections/section-ui";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { KpiCard } from "@/components/dashboard/admin/widgets/kpi-card";
import {
  AttendanceStatusPill,
  formatCheckInTime,
  formatFriendlyDate,
} from "@/components/dashboard/walas/walas-attendance-modals";
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
import type { StaffAttendanceRecord, StaffHomeroomAttendanceOverview } from "@/types/staff";
import { id as localeID } from "date-fns/locale";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  FileSearch,
  GraduationCap,
  ImageIcon,
  LayoutPanelTop,
  Printer,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, type ComponentProps } from "react";

const attendanceStatusOptions = [
  { value: "Semua", label: "Semua status" },
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

export type AttendanceKpi = ComponentProps<typeof KpiCard>;

type AttendanceHeroProps = {
  overview: StaffHomeroomAttendanceOverview;
  kpiCards: AttendanceKpi[];
  totalAttendance: number;
  pendingReviewCount: number;
};

export function AttendanceHero({
  overview,
  kpiCards,
  totalAttendance,
  pendingReviewCount,
}: AttendanceHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] px-4 pt-4 pb-3 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:px-5 sm:pt-5 sm:pb-4 lg:px-6 lg:pt-6 lg:pb-5">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative"
      >
        <div className="pointer-events-none absolute right-[-70px] top-[-90px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-80px] left-[8%] h-52 w-52 rounded-full bg-amber-100/35 blur-3xl" />

        <div className="relative space-y-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <LayoutPanelTop className="size-3.5" />
                Homeroom Attendance Workspace
              </div>
              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Absensi Kelas
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Rekap absensi harian kelas walas, filter tanggal dan status, lalu review record
                  yang butuh tindak lanjut langsung dari satu tabel operasional yang lebih fokus.
                </p>
              </div>
            </div>

            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <GraduationCap className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {overview.homeroom.class_name || "Belum ada kelas walas"}
                  </p>
                  <p className="text-xs leading-5 text-slate-500">
                    {overview.homeroom.school_year_name || "Tahun ajaran belum tersedia"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: index * 0.04, ease: "easeOut" }}
              >
                <KpiCard {...item} />
              </motion.div>
            ))}
          </div>

          <div className="text-xs font-medium text-slate-400">
            {totalAttendance} record tercatat dengan {pendingReviewCount} item perlu review pada{" "}
            {formatFriendlyDate(overview.date)}
          </div>
        </div>
      </motion.article>
    </section>
  );
}

type AttendanceTableSectionProps = {
  overview: StaffHomeroomAttendanceOverview;
  records: StaffAttendanceRecord[];
  isLoading: boolean;
  error: Error | null;
  query: string;
  statusFilter: string;
  selectedDate?: Date;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (date?: Date) => void;
  onOpenReport: () => void;
  onOpenProof: (record: StaffAttendanceRecord) => void;
  onOpenReview: (record: StaffAttendanceRecord) => void;
};

export function AttendanceTableSection({
  overview,
  records,
  isLoading,
  error,
  query,
  statusFilter,
  selectedDate,
  onQueryChange,
  onStatusChange,
  onDateChange,
  onOpenReport,
  onOpenProof,
  onOpenReview,
}: AttendanceTableSectionProps) {
  const { pageItems: pageRecords, pagination: recordsPagination } = usePagination(records);

  return (
    <section className="space-y-5">
      <article className="h-fit self-start rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,252,250,0.94)_100%)] p-4 shadow-[0_20px_48px_rgba(28,77,61,0.08)] sm:p-5">
        <div className="border-b border-slate-200/80 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
                Tabel Absensi Harian
              </h3>
              <p className="text-sm text-slate-500">
                Snapshot record absensi {overview.homeroom.class_name || "kelas walas"} pada{" "}
                {formatFriendlyDate(overview.date)}.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {overview.records.length} record
            </span>
          </div>
        </div>

        <AttendanceFilterToolbar
          query={query}
          statusFilter={statusFilter}
          selectedDate={selectedDate}
          onQueryChange={onQueryChange}
          onStatusChange={onStatusChange}
          onDateChange={onDateChange}
          onOpenReport={onOpenReport}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
          className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/70 bg-white/88"
        >
          {error ? (
            <div className="p-5">
              <EmptyState icon={ShieldAlert} title="Data absensi belum bisa dimuat" description={error.message} />
            </div>
          ) : isLoading ? (
            <AttendanceTableSkeleton />
          ) : records.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={FileSearch}
                title="Belum ada record untuk filter ini"
                description="Coba ganti tanggal atau filter status untuk melihat daftar absensi kelas walas."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable>
                <DataTableHeadRow labels={["Siswa", "Check-in", "Status", "Review", "Catatan", "Aksi"]} />
                <DataTableBody>
                  {pageRecords.map((record) => (
                    <DataTableRow
                      key={record.id}
                      className={!record.verified_at && statusFilter === "Semua" ? "bg-amber-50/45 hover:bg-amber-50/70" : ""}
                    >
                      <DataTableCell>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{record.student_name}</p>
                          <p className="text-xs text-slate-500">{record.nis} • {record.class_name}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-800">{formatFriendlyDate(record.attendance_date)}</p>
                          <p className="text-xs text-slate-500">{formatCheckInTime(record.check_in_at)}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="text-center"><AttendanceStatusPill status={record.status} /></DataTableCell>
                      <DataTableCell className="text-center"><ReviewStatusPill reviewed={Boolean(record.verified_at)} /></DataTableCell>
                      <DataTableCell>
                        <p className="line-clamp-2 max-w-[280px] text-sm leading-6 text-slate-500">
                          {record.verification_note || record.notes || "Belum ada catatan"}
                        </p>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                            onClick={() => onOpenProof(record)}
                            disabled={!record.photo_url}
                            aria-label="Lihat bukti absensi"
                          >
                            <ImageIcon className="size-4.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                            onClick={() => onOpenReview(record)}
                            aria-label="Verifikasi absensi"
                          >
                            <BadgeCheck className="size-4.5" />
                          </Button>
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
          {!error && !isLoading && records.length > 0 ? (
            <DataTablePagination {...recordsPagination} />
          ) : null}
        </motion.div>
      </article>
    </section>
  );
}

type FilterToolbarProps = Pick<
  AttendanceTableSectionProps,
  | "query"
  | "statusFilter"
  | "selectedDate"
  | "onQueryChange"
  | "onStatusChange"
  | "onDateChange"
  | "onOpenReport"
>;

export function AttendanceFilterToolbar({
  query,
  statusFilter,
  selectedDate,
  onQueryChange,
  onStatusChange,
  onDateChange,
  onOpenReport,
}: FilterToolbarProps) {
  return (
    <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <AttendanceDateButton selectedDate={selectedDate} onSelectDate={onDateChange} />
        <div className="w-full sm:w-[210px]">
          <RadixSelectField
            value={statusFilter}
            onValueChange={onStatusChange}
            options={attendanceStatusOptions}
            placeholder="Pilih status"
            triggerClassName="h-14 rounded-[22px] pl-4"
          />
        </div>
        <Button
          variant="outline"
          className="h-14 rounded-[22px] border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,255,0.98)_100%)] px-5 text-sm font-semibold text-violet-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-violet-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(237,233,254,1)_100%)] hover:text-violet-950"
          onClick={onOpenReport}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_10px_20px_rgba(124,58,237,0.2)]">
            <Printer className="size-4" />
          </span>
          Cetak Laporan
        </Button>
      </div>
      <SearchFilterBar value={query} onChange={onQueryChange} placeholder="Cari siswa, NIS, status, catatan" />
    </div>
  );
}

export function AttentionMonitoringPanel({
  items,
}: {
  items: Array<StaffHomeroomAttendanceOverview["summary"]["repeated_alpha"][number] & { tone: "ALFA" | "TELAT" }>;
}) {
  return (
    <article className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,252,250,0.94)_100%)] p-5 shadow-[0_20px_48px_rgba(28,77,61,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-slate-950">Fokus Monitoring</h3>
          <p className="mt-1 text-sm text-slate-500">Sorotan siswa berulang telat atau alfa pada tanggal terpilih.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Prioritas</span>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Belum ada fokus monitoring"
            description="Siswa dengan telat berulang atau alfa berulang akan muncul di panel ini."
            compact
          />
        ) : (
          items.map((item, index) => (
            <motion.article
              key={`${item.student_id}-${item.tone}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-[22px] border border-slate-100 bg-slate-50/92 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-slate-900">{item.student_name}</p>
                  <p className="text-sm text-slate-500">{item.nis} • {item.class_name}</p>
                  <p className="text-sm leading-6 text-slate-500">
                    Tercatat {item.occurrences} kali dengan pola yang perlu ditinjau wali kelas.
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${item.tone === "ALFA" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.tone}
                </span>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </article>
  );
}

function AttendanceDateButton({ selectedDate, onSelectDate }: { selectedDate?: Date; onSelectDate: (date?: Date) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className="h-14 rounded-[22px] border-slate-300/80 bg-white/84 px-4 text-left text-slate-700 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tanggal</p>
            <p className="truncate text-sm font-medium text-slate-700">{selectedDate ? formatFriendlyDate(selectedDate) : "Pilih tanggal"}</p>
          </div>
          <ArrowUpRight className="ml-1 size-4 text-emerald-700" />
        </div>
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
        <PopoverHeader className="px-2 pt-1 pb-2"><PopoverTitle className="text-sm font-semibold text-slate-900">Pilih tanggal absensi</PopoverTitle></PopoverHeader>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => { onSelectDate(date); setOpen(false); }}
          locale={localeID}
          buttonVariant="ghost"
        />
      </PopoverContent>
    </Popover>
  );
}

function ReviewStatusPill({ reviewed }: { reviewed: boolean }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${reviewed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
      {reviewed ? "Direview" : "Belum"}
    </span>
  );
}

function AttendanceTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div key={`attendance-skeleton-${rowIndex}`} className="grid gap-3 rounded-[18px] border border-slate-100 bg-slate-50/75 px-4 py-4 md:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_1.2fr_0.7fr]">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <div key={`attendance-skeleton-cell-${rowIndex}-${cellIndex}`} className="h-4 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  );
}
