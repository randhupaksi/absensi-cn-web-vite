"use client";

import dynamic from "@/lib/dynamic";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import {
  ActionIconButton,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadRow,
  DataTablePagination,
  DataTableRow,
  MobileDataCard,
  MobileDataField,
  MobileDataFooter,
  MobileDataHeader,
  MobileDataList,
  MobileDataSection,
  SearchFilterBar,
  usePagination,
} from "@/features/admin/management/shared/section-ui";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import {
  formatDate,
  formatDateTime,
  openSubmissionAttachment,
  SubmissionDetailModal,
  SubmissionReviewModal,
  SubmissionStatusPill,
  SubmissionTypePill,
} from "@/features/teacher/homeroom/components/submissions-modals";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  getTeacherHomeroomSubmissionsOverview,
  reviewTeacherHomeroomSubmission,
} from "@/services/staff.service";
import type { StaffHomeroomSubmissionOverview, StaffSubmission } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Eye,
  FileClock,
  FileImage,
  FileSearch,
  GraduationCap,
  LayoutPanelTop,
  PencilLine,
  Printer,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const WalasPengajuanReportModal = dynamic(
  () => import("@/features/reports/homeroom/submissions-report-modal").then((module) => module.WalasPengajuanReportModal),
  { ssr: false },
);

const submissionStatusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "menunggu", label: "Menunggu" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

const submissionTypeOptions = [
  { value: "Semua", label: "Semua tipe" },
  { value: "IZIN", label: "Izin" },
  { value: "SAKIT", label: "Sakit" },
  { value: "DISPENSASI", label: "Dispensasi" },
];

const emptyOverview: StaffHomeroomSubmissionOverview = {
  homeroom: {
    assignment_id: "",
    teacher_id: "",
    class_id: "",
    class_name: "Belum ada kelas walas",
    school_year_id: "",
    school_year_name: "Tahun ajaran belum tersedia",
    is_active: false,
  },
  counts: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    with_attachment: 0,
  },
  records: [],
};

export function WalasSubmissionsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [typeFilter, setTypeFilter] = useState("Semua");
  const [detailTarget, setDetailTarget] = useState<StaffSubmission | null>(null);
  const [reviewTarget, setReviewTarget] = useState<StaffSubmission | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["teacher-homeroom-submissions-overview", statusFilter, typeFilter, debouncedQuery],
    queryFn: () =>
      getTeacherHomeroomSubmissionsOverview({
        status: statusFilter === "Semua" ? "" : statusFilter,
        type: typeFilter === "Semua" ? "" : typeFilter,
        query: debouncedQuery.trim(),
      }),
    placeholderData: (previousData) => previousData,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { status: string; review_note: string }) => {
      if (!reviewTarget) {
        throw new Error("Pengajuan tidak ditemukan.");
      }
      return reviewTeacherHomeroomSubmission(reviewTarget.id, payload);
    },
    onSuccess: () => {
      toast.success("Pengajuan berhasil diperbarui.");
      void queryClient.invalidateQueries({
        queryKey: ["teacher-homeroom-submissions-overview"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teacher-homeroom-dashboard"],
      });
      setReviewTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const overview = overviewQuery.data ?? emptyOverview;
  const counts = overview.counts;
  const records = overview.records ?? [];
  const { pageItems: pageRecords, pagination: recordsPagination } = usePagination(records);

  const kpiCards = [
    {
      label: "Total Pengajuan",
      value: String(counts.total),
      subtitle: "Pengajuan kelas ini",
      icon: FileClock,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Menunggu Review",
      value: String(counts.pending),
      subtitle: "Butuh tanggapan walas",
      icon: ShieldAlert,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Sudah Diterima",
      value: String(counts.approved),
      subtitle: "Disetujui wali kelas",
      icon: BadgeCheck,
      accentClass: "bg-teal-100 text-teal-700",
    },
    {
      label: "Ada Lampiran",
      value: String(counts.with_attachment),
      subtitle: "Bukti terunggah siswa",
      icon: Upload,
      accentClass: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <WalasShell>
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-emerald-100/30 blur-3xl" />

            <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                    <LayoutPanelTop className="size-3.5" />
                    Homeroom Submissions Workspace
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                      Pengajuan
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Review izin, sakit, dan dispensasi dari siswa kelas walas,
                      baca alasan serta lampiran, lalu beri tanggapan langsung
                      dari satu meja kerja yang fokus.
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

              <div className="grid grid-cols-2 items-start gap-3 xl:grid-cols-4">
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
                {counts.pending} pengajuan masih menunggu review dan {counts.with_attachment} pengajuan membawa lampiran siswa
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="w-full sm:w-[210px]">
                  <RadixSelectField
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    options={submissionStatusOptions}
                    placeholder="Pilih status"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>

                <div className="w-full sm:w-[220px]">
                  <RadixSelectField
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                    options={submissionTypeOptions}
                    placeholder="Pilih tipe"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>

                <Button
                  variant="outline"
                  className="h-14 rounded-[22px] border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,255,0.98)_100%)] px-5 text-sm font-semibold text-violet-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-violet-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(237,233,254,1)_100%)] hover:text-violet-950"
                  onClick={() => setReportModalOpen(true)}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_10px_20px_rgba(124,58,237,0.2)]">
                    <Printer className="size-4" />
                  </span>
                  Export Laporan
                </Button>
              </div>

              <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari siswa, NIS, alasan, tipe" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80"
            >
              <div className="overflow-x-auto bg-white/92">
                {overviewQuery.isLoading ? (
                  <SubmissionTableSkeleton />
                ) : overviewQuery.error ? (
                  <div className="p-5">
                    <EmptyState
                      icon={ShieldAlert}
                      title="Data pengajuan belum bisa dimuat"
                      description={overviewQuery.error.message}
                    />
                  </div>
                ) : records.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={FileSearch}
                      title="Belum ada pengajuan untuk filter ini"
                      description="Coba ubah filter status atau tipe untuk melihat pengajuan siswa kelas walas."
                    />
                  </div>
                ) : (
                  <>
                  <div className="hidden md:block">
                  <DataTable>
                    <DataTableHeadRow
                      labels={["Siswa", "Pengajuan", "Waktu", "Status", "Lampiran", "Catatan", "Aksi"]}
                      centerLabels={["Status"]}
                    />
                    <DataTableBody>
                      {pageRecords.map((record) => (
                        <DataTableRow key={record.id}>
                          <DataTableCell>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{record.student_name}</p>
                              <p className="text-xs text-slate-500">
                                {record.nis} • {record.class_name || "Kelas belum tersambung"}
                              </p>
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="space-y-2">
                              <SubmissionTypePill type={record.type} />
                              <p className="line-clamp-2 max-w-[280px] text-xs leading-5 text-slate-500">
                                {record.reason}
                              </p>
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-slate-800">
                                {formatDate(record.created_at)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDateTime(record.updated_at)}
                              </p>
                            </div>
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <SubmissionStatusPill status={record.status} />
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            {record.attachment ? (
                              <button
                                type="button"
                                onClick={() => openSubmissionAttachment(record.attachment)}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                              >
                                <FileImage className="size-3.5" />
                                Buka
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Tidak ada</span>
                            )}
                          </DataTableCell>
                          <DataTableCell>
                            <p className="line-clamp-2 max-w-[260px] text-sm leading-6 text-slate-500">
                              {record.review_note || "Belum ada tanggapan walas"}
                            </p>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center justify-center gap-2">
                              <ActionIconButton
                                tone="emerald"
                                onClick={() => setDetailTarget(record)}
                                ariaLabel={`Lihat detail pengajuan ${record.student_name}`}
                              >
                                <Eye className="size-4.5" />
                              </ActionIconButton>
                              <ActionIconButton
                                tone="sky"
                                onClick={() => setReviewTarget(record)}
                                ariaLabel={`Review pengajuan ${record.student_name}`}
                              >
                                <PencilLine className="size-4.5" />
                              </ActionIconButton>
                            </div>
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                  </div>
                  <MobileDataList>
                    {pageRecords.map((record) => (
                      <MobileDataCard key={record.id}>
                        <MobileDataHeader
                          title={record.student_name}
                          subtitle={`${record.nis} - ${record.class_name || "Kelas belum tersambung"}`}
                          badge={<SubmissionStatusPill status={record.status} />}
                        />
                        <div className="mt-4 grid gap-3">
                          <MobileDataField label="Tipe" value={<SubmissionTypePill type={record.type} />} />
                          <MobileDataField label="Tanggal" value={formatDate(record.created_at)} />
                          <MobileDataField label="Update" value={formatDateTime(record.updated_at)} />
                        </div>
                        <MobileDataSection label="Alasan">
                          <p className="text-sm leading-6 text-slate-600">{record.reason}</p>
                        </MobileDataSection>
                        <MobileDataSection label="Catatan Walas">
                          <p className="text-sm leading-6 text-slate-600">{record.review_note || "Belum ada tanggapan walas"}</p>
                        </MobileDataSection>
                        <MobileDataFooter>
                          {record.attachment ? (
                            <button
                              type="button"
                              onClick={() => openSubmissionAttachment(record.attachment)}
                              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                            >
                              <FileImage className="size-3.5" />
                              Buka
                            </button>
                          ) : null}
                          <ActionIconButton
                            tone="emerald"
                            onClick={() => setDetailTarget(record)}
                            ariaLabel={`Lihat detail pengajuan ${record.student_name}`}
                          >
                            <Eye className="size-4.5" />
                          </ActionIconButton>
                          <ActionIconButton
                            tone="sky"
                            onClick={() => setReviewTarget(record)}
                            ariaLabel={`Review pengajuan ${record.student_name}`}
                          >
                            <PencilLine className="size-4.5" />
                          </ActionIconButton>
                        </MobileDataFooter>
                      </MobileDataCard>
                    ))}
                  </MobileDataList>
                  </>
                )}
              </div>
              {!overviewQuery.isLoading && !overviewQuery.error && records.length > 0 ? (
                <DataTablePagination {...recordsPagination} />
              ) : null}
            </motion.div>
          </section>

          <SubmissionDetailModal
            submission={detailTarget}
            onOpenChange={(open) => {
              if (!open) {
                setDetailTarget(null);
              }
            }}
          />

          <SubmissionReviewModal
            key={reviewTarget?.id ?? "submission-review-closed"}
            submission={reviewTarget}
            onOpenChange={(open) => {
              if (!open) {
                setReviewTarget(null);
              }
            }}
            onSubmit={(payload) => reviewMutation.mutate(payload)}
            isPending={reviewMutation.isPending}
          />
          {reportModalOpen && (
            <WalasPengajuanReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              homeroom={overview.homeroom}
            />
          )}
        </>
      )}
    </WalasShell>
  );
}
function SubmissionTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div
          key={`submission-skeleton-${rowIndex}`}
          className="grid gap-3 rounded-[18px] border border-slate-100 bg-slate-50/75 px-4 py-4 md:grid-cols-[1.1fr_1.3fr_0.9fr_0.8fr_0.8fr_1.2fr_0.8fr]"
        >
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <div
              key={`submission-skeleton-cell-${rowIndex}-${cellIndex}`}
              className="h-4 animate-pulse rounded-full bg-slate-200"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
