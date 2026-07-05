"use client";

import dynamic from "@/lib/dynamic";
import {
  classFilterOptions,
  formatDateTime,
  isImageAttachment,
  normalizeAttachmentUrl,
  openAttachment,
  SubmissionStatusPill,
  SubmissionTypePill,
} from "@/components/dashboard/bk/bk-common";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { KpiCard } from "@/components/dashboard/admin/widgets/kpi-card";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadRow,
  DataTableRow,
} from "@/components/dashboard/admin/sections/section-ui";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";
import { bkSidebarItems } from "@/components/dashboard/staff/staff-sidebar";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
  premiumModalSurfaceClassName,
} from "@/components/modals/premium-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import { getBKSubmissionsOverview, reviewBKSubmission } from "@/services/staff.service";
import type { StaffSubmission } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppImage as Image } from "@/components/media/app-image";
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardCheck,
  Eye,
  FileClock,
  FileImage,
  FileSearch,
  LayoutPanelTop,
  PencilLine,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const BKPengajuanReportModal = dynamic(
  () => import("@/components/reports/bk/bk-pengajuan-report-modal").then((module) => module.BKPengajuanReportModal),
  { ssr: false },
);

const submissionStatusOptions = [
  { value: "Semua", label: "Semua status" },
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

const reviewStatusOptions = [
  { value: "menunggu", label: "Menunggu" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

export function BKSubmissionsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [typeFilter, setTypeFilter] = useState("Semua");
  const [classFilter, setClassFilter] = useState("Semua");
  const [detailTarget, setDetailTarget] = useState<StaffSubmission | null>(null);
  const [reviewTarget, setReviewTarget] = useState<StaffSubmission | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["bk-submissions-overview", statusFilter, typeFilter, classFilter, query],
    queryFn: () =>
      getBKSubmissionsOverview({
        status: statusFilter === "Semua" ? "" : statusFilter,
        type: typeFilter === "Semua" ? "" : typeFilter,
        class_id: classFilter === "Semua" ? "" : classFilter,
        query: query.trim(),
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { status: string; review_note: string }) => {
      if (!reviewTarget) throw new Error("Pengajuan belum dipilih.");
      return reviewBKSubmission(reviewTarget.id, payload);
    },
    onSuccess: () => {
      toast.success("Tanggapan pengajuan berhasil disimpan.");
      void queryClient.invalidateQueries({ queryKey: ["bk-submissions-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["bk-dashboard"] });
      setReviewTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const overview = overviewQuery.data;
  const counts = overview?.counts ?? {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    with_attachment: 0,
  };
  const records = useMemo(() => overview?.records ?? [], [overview?.records]);
  const classes = overview?.classes ?? [];
  const pendingItems = useMemo(
    () => records.filter((item) => normalizeSubmissionStatus(item.status) === "menunggu").slice(0, 6),
    [records],
  );

  const kpiCards = [
    {
      label: "Total Pengajuan",
      value: String(counts.total),
      subtitle: "Pengajuan lintas kelas",
      icon: FileClock,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Menunggu",
      value: String(counts.pending),
      subtitle: "Butuh tanggapan",
      icon: ShieldAlert,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Diterima",
      value: String(counts.approved),
      subtitle: "Sudah disetujui",
      icon: BadgeCheck,
      accentClass: "bg-sky-100 text-sky-700",
    },
    {
      label: "Lampiran",
      value: String(counts.with_attachment),
      subtitle: "Bukti tersedia",
      icon: Upload,
      accentClass: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <StaffShell
      expectedRole="bk"
      sidebarItems={bkSidebarItems}
      userLabel="Guru BK"
      resolveTitle={getBKSubmissionsTitle}
    >
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                    <LayoutPanelTop className="size-3.5" />
                    BK Submissions Workspace
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-normal text-slate-950 sm:text-[2.35rem]">
                      Monitoring Pengajuan
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Tinjau izin, sakit, dan dispensasi lintas kelas beserta
                      bukti pendukungnya dari meja kerja BK.
                    </p>
                  </div>
                </div>
                <div className="flex justify-start lg:justify-end">
                  <Button
                    variant="outline"
                    className="h-14 rounded-[22px] border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,255,0.98)_100%)] px-5 text-sm font-semibold text-violet-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-violet-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(237,233,254,1)_100%)] hover:text-violet-950"
                    onClick={() => setReportModalOpen(true)}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_10px_20px_rgba(124,58,237,0.2)]">
                      <Printer className="size-4" />
                    </span>
                    Cetak Laporan
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: index * 0.04 }}
                  >
                    <KpiCard {...item} />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="w-full sm:w-[220px]">
                  <RadixSelectField value={classFilter} onValueChange={setClassFilter} options={classFilterOptions(classes)} placeholder="Pilih kelas" triggerClassName="h-14 rounded-[22px] pl-4" />
                </div>
                <div className="w-full sm:w-[210px]">
                  <RadixSelectField value={statusFilter} onValueChange={setStatusFilter} options={submissionStatusOptions} placeholder="Pilih status" triggerClassName="h-14 rounded-[22px] pl-4" />
                </div>
                <div className="w-full sm:w-[210px]">
                  <RadixSelectField value={typeFilter} onValueChange={setTypeFilter} options={submissionTypeOptions} placeholder="Pilih tipe" triggerClassName="h-14 rounded-[22px] pl-4" />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                    <SlidersHorizontal className="size-4" />
                  </span>
                  <Search className="size-4 text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari siswa, NIS, alasan, tipe" className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[260px]" />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80 bg-white/92"
            >
              {overviewQuery.isLoading ? (
                <TableSkeleton />
              ) : overviewQuery.error ? (
                <div className="p-5">
                  <EmptyState icon={ShieldAlert} title="Pengajuan BK belum bisa dimuat" description={overviewQuery.error.message} />
                </div>
              ) : records.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={FileSearch} title="Belum ada pengajuan" description="Ubah filter untuk melihat pengajuan siswa lintas kelas." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DataTable>
                    <DataTableHeadRow labels={["Siswa", "Pengajuan", "Kelas", "Waktu", "Status", "Lampiran", "Aksi"]} />
                    <DataTableBody>
                      {records.map((record) => (
                        <DataTableRow key={record.id}>
                          <DataTableCell>
                            <p className="font-semibold text-slate-900">{record.student_name}</p>
                            <p className="text-xs text-slate-500">{record.nis}</p>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="space-y-2">
                              <SubmissionTypePill type={record.type} />
                              <p className="line-clamp-2 max-w-[280px] text-xs leading-5 text-slate-500">{record.reason}</p>
                            </div>
                          </DataTableCell>
                          <DataTableCell>{record.class_name || "-"}</DataTableCell>
                          <DataTableCell>{formatDateTime(record.created_at)}</DataTableCell>
                          <DataTableCell className="text-center"><SubmissionStatusPill status={record.status} /></DataTableCell>
                          <DataTableCell className="text-center">
                            {record.attachment ? (
                              <Button type="button" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={() => openAttachment(record.attachment)}>
                                <FileImage className="size-3.5" />
                                Buka
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">Tidak ada</span>
                            )}
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center justify-center gap-2">
                              <IconAction icon={Eye} onClick={() => setDetailTarget(record)} tone="emerald" />
                              <IconAction icon={PencilLine} onClick={() => setReviewTarget(record)} tone="sky" />
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
                <h3 className="text-xl font-semibold text-slate-950">Fokus Review BK</h3>
                <p className="mt-1 text-sm text-slate-500">Pengajuan yang masih menunggu tanggapan.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Prioritas</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pendingItems.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="Tidak ada pengajuan pending" description="Pengajuan pending akan muncul di panel ini." compact />
              ) : (
                pendingItems.map((item, index) => (
                  <motion.article key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.04 }} className="rounded-[22px] border border-slate-100 bg-slate-50/92 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{item.student_name}</p>
                        <p className="text-sm text-slate-500">{item.nis} - {item.class_name || "-"}</p>
                        <p className="line-clamp-2 text-sm leading-6 text-slate-500">{item.reason}</p>
                      </div>
                      <SubmissionTypePill type={item.type} />
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          </section>

          <BKPengajuanReportModal
            open={reportModalOpen}
            onOpenChange={setReportModalOpen}
            classes={classes}
          />

          <SubmissionDetailModal submission={detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)} />
          {reviewTarget ? (
            <SubmissionReviewModal
              key={reviewTarget.id}
              submission={reviewTarget}
              onOpenChange={(open) => !open && setReviewTarget(null)}
              isPending={reviewMutation.isPending}
              onSubmit={(payload) => reviewMutation.mutate(payload)}
            />
          ) : null}
        </>
      )}
    </StaffShell>
  );
}

function SubmissionDetailModal({ submission, onOpenChange }: { submission: StaffSubmission | null; onOpenChange: (open: boolean) => void }) {
  return (
    <PremiumModal
      open={Boolean(submission)}
      onOpenChange={onOpenChange}
      title={submission ? `Detail ${submission.student_name}` : "Detail Pengajuan"}
      description="Lihat alasan, lampiran, status, dan catatan review pengajuan siswa."
      icon={Eye}
      className="sm:!max-w-[920px]"
    >
      {submission ? (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-4">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold tracking-normal text-slate-950">{submission.student_name}</h3>
                <SubmissionStatusPill status={submission.status} />
                <SubmissionTypePill type={submission.type} />
              </div>
              <p className="mt-2 text-sm text-slate-500">{submission.nis} - {submission.class_name || "Kelas belum tersedia"}</p>
              <p className="mt-2 text-sm text-slate-500">Dibuat {formatDateTime(submission.created_at)}</p>
            </div>
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-slate-900">Alasan Pengajuan</p>
                <ClipboardCheck className="size-4.5 text-emerald-600" />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{submission.reason}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-slate-900">Lampiran</p>
                <FileImage className="size-4.5 text-emerald-600" />
              </div>
              {submission.attachment ? (
                isImageAttachment(submission.attachment) ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-[20px] border border-emerald-100 bg-slate-50/80">
                      <Image
                        src={normalizeAttachmentUrl(submission.attachment)}
                        alt={`Lampiran ${submission.student_name}`}
                        width={720}
                        height={360}
                        className="h-[260px] w-full object-cover"
                        unoptimized
                      />
                    </div>
                    <Button type="button" variant="outline" className="w-full rounded-[16px]" onClick={() => openAttachment(submission.attachment)}>
                      <ArrowUpRight className="size-4" />
                      Lihat ukuran penuh
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full rounded-[16px]" onClick={() => openAttachment(submission.attachment)}>
                    <ArrowUpRight className="size-4" />
                    Buka Lampiran
                  </Button>
                )
              ) : (
                <EmptyState icon={FileImage} title="Tidak ada lampiran" description="Siswa belum mengunggah bukti pendukung." compact />
              )}
            </div>
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-slate-900">Catatan Review</p>
                <ShieldCheck className="size-4.5 text-emerald-600" />
              </div>
              {submission.review_note ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{submission.review_note}</p>
              ) : (
                <EmptyState icon={ClipboardCheck} title="Belum ada catatan review" description="Catatan BK akan tampil setelah pengajuan ditinjau." compact />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

function SubmissionReviewModal({
  submission,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  submission: StaffSubmission;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { status: string; review_note: string }) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(normalizeSubmissionStatus(submission.status));
  const [reviewNote, setReviewNote] = useState(submission.review_note || "");
  const [errors, setErrors] = useState<FieldErrors<"status" | "review_note">>({});

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"status" | "review_note"> = {};
    validateRequired(nextErrors, "status", status, "Status final");
    validateRequired(nextErrors, "review_note", reviewNote, "Catatan tanggapan");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ status, review_note: reviewNote });
  };

  return (
    <PremiumModal
      open
      onOpenChange={onOpenChange}
      title={submission ? `Review ${submission.student_name}` : "Review Pengajuan"}
      description="Berikan keputusan dan tanggapan BK untuk pengajuan siswa."
      icon={PencilLine}
      className="sm:!max-w-[760px]"
    >
      <div className="grid gap-5">
          <div className={`${premiumModalSurfaceClassName} p-4`}>
            <p className="text-base font-semibold text-slate-900">{submission.student_name}</p>
            <p className="mt-1 text-sm text-slate-500">{submission.nis} - {submission.class_name || "-"}</p>
          </div>
          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Status final</label>
            <RadixSelectField value={status} onValueChange={setStatus} options={reviewStatusOptions} placeholder="Pilih status akhir" triggerClassName="h-12 rounded-[18px]" />
            <FieldError message={errors.status} />
          </div>
          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Catatan tanggapan</label>
            <p className={premiumModalHelperClassName}>Catatan ini tersimpan di riwayat review pengajuan siswa.</p>
            <Textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Tulis tanggapan BK" className="min-h-[140px] rounded-[20px]" />
            <FieldError message={errors.review_note} />
          </div>
          <div className={premiumModalActionsClassName}>
            <Button type="button" variant="outline" className="h-12 rounded-[18px] px-5" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="button" className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white hover:bg-emerald-800" disabled={isPending} onClick={handleSubmit}>
              {isPending ? "Menyimpan..." : "Simpan Tanggapan"}
            </Button>
          </div>
      </div>
    </PremiumModal>
  );
}

function IconAction({ icon: Icon, onClick, tone }: { icon: typeof Eye; onClick: () => void; tone: "emerald" | "sky" }) {
  const className =
    tone === "emerald"
      ? "border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
      : "border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700";
  return (
    <Button type="button" variant="ghost" size="icon" className={`size-10 rounded-2xl ${className}`} onClick={onClick}>
      <Icon className="size-4.5" />
    </Button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div key={`bk-submissions-loading-${rowIndex}`} className="grid gap-3 rounded-[18px] border border-slate-100 bg-slate-50/75 px-4 py-4 md:grid-cols-7">
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <div key={`bk-submissions-loading-${rowIndex}-${cellIndex}`} className="h-4 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  );
}

function normalizeSubmissionStatus(value?: string) {
  return (value || "").toLowerCase().trim();
}

function getBKSubmissionsTitle() {
  return "Submission Monitoring Dashboard";
}
