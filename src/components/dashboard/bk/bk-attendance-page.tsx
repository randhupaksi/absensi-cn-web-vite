"use client";

import dynamic from "@/lib/dynamic";
import { BkPageHero } from "@/components/dashboard/bk/bk-page-hero";
import {
  AttendanceStatusPill,
  classFilterOptions,
  formatCheckInTime,
  formatFriendlyDate,
  ReviewStatusPill,
  TableSkeleton,
} from "@/components/dashboard/bk/bk-common";
import {
  AttendanceDateButton,
  AttendanceReviewModal,
  AttendanceProofModal,
} from "@/components/dashboard/bk/bk-attendance-modals";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadRow,
  DataTableRow,
  SearchFilterBar,
} from "@/components/dashboard/admin/sections/section-ui";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";
import { bkSidebarItems } from "@/components/dashboard/staff/staff-sidebar";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { getBKAttendanceOverview, reviewBKAttendance } from "@/services/staff.service";
import type { StaffAttendanceRecord, StaffAttendanceReviewPayload } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BadgeCheck,
  CalendarClock,
  CheckCheck,
  FileImage,
  FileSearch,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BKAbsensiReportModal = dynamic(
  () => import("@/components/reports/bk/bk-absensi-report-modal").then((module) => module.BKAbsensiReportModal),
  { ssr: false },
);

const statusOptions = [
  { value: "Semua", label: "Semua status" },
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

export function BKAttendancePage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [classFilter, setClassFilter] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reviewTarget, setReviewTarget] = useState<StaffAttendanceRecord | null>(null);
  const [proofTarget, setProofTarget] = useState<StaffAttendanceRecord | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const dateValue = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const overviewQuery = useQuery({
    queryKey: ["bk-attendance-overview", dateValue, statusFilter, classFilter, debouncedQuery],
    queryFn: () =>
      getBKAttendanceOverview({
        date: dateValue,
        status: statusFilter === "Semua" ? "" : statusFilter,
        class_id: classFilter === "Semua" ? "" : classFilter,
        query: debouncedQuery.trim(),
      }),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: StaffAttendanceReviewPayload) => {
      if (!reviewTarget) throw new Error("Record absensi tidak ditemukan.");
      return reviewBKAttendance(reviewTarget.id, payload);
    },
    onSuccess: () => {
      toast.success("Review absensi berhasil disimpan.");
      void queryClient.invalidateQueries({ queryKey: ["bk-attendance-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["bk-dashboard"] });
      setReviewTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const overview = overviewQuery.data;
  const summary = overview?.summary ?? {
    present: 0,
    late: 0,
    permission: 0,
    sick: 0,
    alpha: 0,
    repeated_late: [],
    repeated_alpha: [],
  };
  const records = overview?.records ?? [];
  const classes = overview?.classes ?? [];
  const reviewedCount = records.filter((record) => Boolean(record.verified_at)).length;
  const pendingReviewCount = records.filter(
    (record) => ["telat", "alfa"].includes(record.status.toLowerCase()) && !record.verified_at,
  ).length;

  const kpiCards = [
    {
      label: "Total Record",
      value: String(records.length),
      subtitle: "Absensi tanggal ini",
      icon: FileSearch,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Terlambat",
      value: String(summary.late),
      subtitle: "Perlu perhatian BK",
      icon: CalendarClock,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Alfa",
      value: String(summary.alpha),
      subtitle: "Butuh tindak lanjut",
      icon: TriangleAlert,
      accentClass: "bg-rose-100 text-rose-700",
    },
    {
      label: "Diverifikasi",
      value: String(reviewedCount),
      subtitle: "Sudah direview",
      icon: CheckCheck,
      accentClass: "bg-sky-100 text-sky-700",
    },
  ];

  const focusItems = [
    ...(summary.repeated_alpha ?? []).map((item) => ({ ...item, tone: "ALFA" as const })),
    ...(summary.repeated_late ?? []).map((item) => ({ ...item, tone: "TELAT" as const })),
  ].slice(0, 8);

  return (
    <StaffShell
      expectedRole="bk"
      sidebarItems={bkSidebarItems}
      userLabel="Guru BK"
      resolveTitle={getBKAttendanceTitle}
    >
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <BkPageHero
              badge="BK Attendance Workspace"
              title="Absensi Lintas Kelas"
              description={<>Pantau telat dan alfa lintas kelas, buka bukti foto, dan review record yang perlu tindak lanjut BK.</>}
              kpiCards={kpiCards}
              onOpenReport={() => setReportModalOpen(true)}
              topClassName="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"
              contentClassName="max-w-3xl space-y-3"
              actionClassName="flex justify-start xl:justify-end"
              footer={(
                <div className="text-xs font-medium text-slate-400">
                  {records.length} record tercatat dengan {pendingReviewCount} item menunggu review BK.
                </div>
              )}
            />

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <AttendanceDateButton selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                <div className="w-full sm:w-[220px]">
                  <RadixSelectField
                    value={classFilter}
                    onValueChange={setClassFilter}
                    options={classFilterOptions(classes)}
                    placeholder="Pilih kelas"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
                <div className="w-full sm:w-[210px]">
                  <RadixSelectField
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    options={statusOptions}
                    placeholder="Pilih status"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari siswa, NIS, status, catatan" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80 bg-white/92"
            >
              {overviewQuery.isLoading ? (
                <TableSkeleton columns={7} />
              ) : overviewQuery.error ? (
                <div className="p-5">
                  <EmptyState icon={ShieldAlert} title="Absensi BK belum bisa dimuat" description={overviewQuery.error.message} />
                </div>
              ) : records.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={FileSearch} title="Belum ada record absensi" description="Ubah tanggal, kelas, status, atau pencarian untuk melihat data absensi." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DataTable>
                    <DataTableHeadRow labels={["Siswa", "Kelas", "Check-in", "Status", "Review", "Catatan", "Aksi"]} />
                    <DataTableBody>
                      {records.map((record) => (
                        <DataTableRow key={record.id}>
                          <DataTableCell>
                            <p className="font-semibold text-slate-900">{record.student_name}</p>
                            <p className="text-xs text-slate-500">{record.nis}</p>
                          </DataTableCell>
                          <DataTableCell>{record.class_name}</DataTableCell>
                          <DataTableCell>
                            <p className="font-medium text-slate-800">{formatFriendlyDate(record.attendance_date)}</p>
                            <p className="text-xs">{formatCheckInTime(record.check_in_at)}</p>
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <AttendanceStatusPill status={record.status} />
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <ReviewStatusPill reviewed={Boolean(record.verified_at)} />
                          </DataTableCell>
                          <DataTableCell>
                            <p className="line-clamp-2 max-w-[280px] text-sm leading-6 text-slate-500">
                              {record.verification_note || record.notes || "-"}
                            </p>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                                disabled={!record.photo_url}
                                onClick={() => setProofTarget(record)}
                              >
                                <FileImage className="size-4.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                onClick={() => setReviewTarget(record)}
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
            </motion.div>
          </section>

          <section className="rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_20px_48px_rgba(28,77,61,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Fokus Monitoring BK</h3>
                <p className="mt-1 text-sm text-slate-500">Siswa dengan pola telat atau alfa berulang.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Prioritas</span>
            </div>
            <div className="mt-5 grid gap-3 grid-cols-2 xl:grid-cols-4">
              {focusItems.length === 0 ? (
                <EmptyState icon={BadgeCheck} title="Belum ada fokus monitoring" description="Pola telat atau alfa berulang akan tampil di sini." compact />
              ) : (
                focusItems.map((item, index) => (
                  <motion.article
                    key={`${item.student_id}-${item.tone}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className="rounded-[22px] border border-slate-100 bg-slate-50/92 p-4"
                  >
                    <p className="font-semibold text-slate-900">{item.student_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.nis} - {item.class_name}</p>
                    <p className="mt-3 text-xs font-semibold text-rose-700">{item.occurrences} catatan {item.tone}</p>
                  </motion.article>
                ))
              )}
            </div>
          </section>

          {reportModalOpen && (
            <BKAbsensiReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              classes={classes}
            />
          )}

          {reviewTarget ? (
            <AttendanceReviewModal
              key={reviewTarget.id}
              record={reviewTarget}
              onOpenChange={(open) => {
                if (!open) setReviewTarget(null);
              }}
              isPending={reviewMutation.isPending}
              onSubmit={(payload) => reviewMutation.mutate(payload)}
            />
          ) : null}
          <AttendanceProofModal
            record={proofTarget}
            onOpenChange={(open) => {
              if (!open) setProofTarget(null);
            }}
          />
        </>
      )}
    </StaffShell>
  );
}

function getBKAttendanceTitle() {
  return "Attendance Review Dashboard";
}
