"use client";

import dynamic from "@/lib/dynamic";
import {
  classFilterOptions,
  formatDateTime,
  getInitials,
} from "@/components/dashboard/bk/bk-common";
import {
  CounselingDetailModal,
  CounselingFormModal,
} from "@/components/dashboard/bk/bk-counseling-modals";
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
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  createBKCounselingNote,
  deleteBKCounselingNote,
  getBKCounselingOverview,
  updateBKCounselingNote,
} from "@/services/staff.service";
import type { StaffCounselingNote } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookHeart,
  Edit3,
  Eye,
  FileText,
  LayoutPanelTop,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const BKKonselingReportModal = dynamic(
  () => import("@/components/reports/bk/bk-konseling-report-modal").then((module) => module.BKKonselingReportModal),
  { ssr: false },
);

export function BKCounselingPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [classFilter, setClassFilter] = useState("Semua");
  const [studentFilter, setStudentFilter] = useState("Semua");
  const [detailTarget, setDetailTarget] = useState<StaffCounselingNote | null>(null);
  const [editTarget, setEditTarget] = useState<StaffCounselingNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffCounselingNote | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const overviewQuery = useQuery({
    queryKey: ["bk-counseling-overview", classFilter, studentFilter, debouncedQuery],
    queryFn: () =>
      getBKCounselingOverview({
        class_id: classFilter === "Semua" ? "" : classFilter,
        student_id: studentFilter === "Semua" ? "" : studentFilter,
        query: debouncedQuery.trim(),
      }),
  });

  const overview = overviewQuery.data;
  const counts = overview?.counts ?? {
    total_notes: 0,
    students_covered: 0,
    classes_covered: 0,
    recent_week_notes: 0,
  };
  const records = overview?.records ?? [];
  const classes = overview?.classes ?? [];
  const students = useMemo(() => overview?.students ?? [], [overview?.students]);

  const studentOptions = useMemo(
    () => [
      { value: "Semua", label: "Semua siswa" },
      ...students.map((student) => ({
        value: student.id,
        label: `${student.name} - ${student.nis}`,
      })),
    ],
    [students],
  );

  const createMutation = useMutation({
    mutationFn: createBKCounselingNoteFromModal,
    onSuccess: () => {
      toast.success("Catatan BK berhasil dibuat.");
      setCreateOpen(false);
      void invalidateBKCounseling(queryClient);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { title: string; note: string }) => {
      if (!editTarget) throw new Error("Catatan BK belum dipilih.");
      return updateBKCounselingNote(editTarget.id, payload);
    },
    onSuccess: () => {
      toast.success("Catatan BK berhasil diperbarui.");
      setEditTarget(null);
      void invalidateBKCounseling(queryClient);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBKCounselingNote,
    onSuccess: () => {
      toast.success("Catatan BK berhasil dihapus.");
      setDeleteTarget(null);
      void invalidateBKCounseling(queryClient);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function createBKCounselingNoteFromModal(payload: {
    student_id: string;
    title: string;
    note: string;
  }) {
    return createBKCounselingNote(payload.student_id, {
      title: payload.title,
      note: payload.note,
    });
  }

  const kpiCards = [
    {
      label: "Total Catatan",
      value: String(counts.total_notes),
      subtitle: "Catatan pembinaan",
      icon: BookHeart,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Siswa Tercover",
      value: String(counts.students_covered),
      subtitle: "Sudah ada catatan",
      icon: UsersRound,
      accentClass: "bg-sky-100 text-sky-700",
    },
    {
      label: "Kelas Terpantau",
      value: String(counts.classes_covered),
      subtitle: "Lintas rombel aktif",
      icon: LayoutPanelTop,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Minggu Ini",
      value: String(counts.recent_week_notes),
      subtitle: "Catatan terbaru",
      icon: FileText,
      accentClass: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <StaffShell
      expectedRole="bk"
      sidebarItems={bkSidebarItems}
      userLabel="Guru BK"
      resolveTitle={getBKCounselingTitle}
    >
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                    <LayoutPanelTop className="size-3.5" />
                    BK Counseling Workspace
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-normal text-slate-950 sm:text-[2.35rem]">
                      Catatan Konseling
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Kelola catatan pembinaan, tindak lanjut, dan histori
                      konseling siswa lintas kelas.
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
                  <RadixSelectField
                    value={classFilter}
                    onValueChange={(value) => {
                      setClassFilter(value);
                      setStudentFilter("Semua");
                    }}
                    options={classFilterOptions(classes)}
                    placeholder="Pilih kelas"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
                <div className="w-full sm:w-[260px]">
                  <RadixSelectField
                    value={studentFilter}
                    onValueChange={setStudentFilter}
                    options={studentOptions}
                    placeholder="Pilih siswa"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                    <SlidersHorizontal className="size-4" />
                  </span>
                  <Search className="size-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari siswa, NIS, judul, catatan"
                    className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[260px]"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950"
                  onClick={() => setCreateOpen(true)}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
                    <Plus className="size-4" />
                  </span>
                  Tambah
                </Button>
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
                  <EmptyState icon={ShieldAlert} title="Catatan BK belum bisa dimuat" description={overviewQuery.error.message} />
                </div>
              ) : records.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={BookHeart} title="Belum ada catatan konseling" description="Tambah catatan BK atau ubah filter untuk melihat histori pembinaan." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DataTable>
                    <DataTableHeadRow labels={["Siswa", "Catatan", "Kelas", "Dibuat Oleh", "Waktu", "Aksi"]} />
                    <DataTableBody>
                      {records.map((record) => (
                        <DataTableRow key={record.id}>
                          <DataTableCell>
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 items-center justify-center rounded-[16px] bg-emerald-50 text-sm font-semibold text-emerald-800">
                                {getInitials(record.student_name)}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{record.student_name}</p>
                                <p className="text-xs text-slate-500">{record.nis}</p>
                              </div>
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <p className="font-semibold text-slate-900">{record.title}</p>
                            <p className="line-clamp-2 max-w-[360px] text-sm leading-6 text-slate-500">{record.note}</p>
                          </DataTableCell>
                          <DataTableCell>{record.class_name || "-"}</DataTableCell>
                          <DataTableCell>{record.created_by_name || "-"}</DataTableCell>
                          <DataTableCell>{formatDateTime(record.created_at)}</DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center justify-center gap-2">
                              <IconAction icon={Eye} onClick={() => setDetailTarget(record)} tone="emerald" />
                              <IconAction icon={Edit3} onClick={() => setEditTarget(record)} tone="sky" />
                              <IconAction icon={Trash2} onClick={() => setDeleteTarget(record)} tone="rose" disabled={deleteMutation.isPending} />
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

          <BKKonselingReportModal
            open={reportModalOpen}
            onOpenChange={setReportModalOpen}
            classes={classes}
            students={students}
          />

          <CounselingDetailModal
            note={detailTarget}
            onOpenChange={(open) => {
              if (!open) setDetailTarget(null);
            }}
          />
          {createOpen ? (
            <CounselingFormModal
              key="create-note"
              open
              onOpenChange={setCreateOpen}
              students={students}
              isPending={createMutation.isPending}
              onSubmit={(payload) => createMutation.mutate(payload)}
            />
          ) : null}
          {editTarget ? (
            <CounselingFormModal
              key={editTarget.id}
              open
              onOpenChange={(open) => {
                if (!open) setEditTarget(null);
              }}
              students={students}
              note={editTarget}
              isPending={updateMutation.isPending}
              onSubmit={(payload) => updateMutation.mutate({ title: payload.title, note: payload.note })}
            />
          ) : null}
          <DeleteConfirmationModal
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            title="Hapus Catatan BK?"
            description={
              deleteTarget
                ? `Catatan "${deleteTarget.title}" untuk ${deleteTarget.student_name} akan dihapus permanen.`
                : "Catatan BK ini akan dihapus permanen."
            }
            isPending={deleteMutation.isPending}
            onConfirm={() => {
              if (!deleteTarget) return;
              deleteMutation.mutate(deleteTarget.id);
            }}
          />
        </>
      )}
    </StaffShell>
  );
}

function IconAction({ icon: Icon, onClick, tone, disabled }: { icon: typeof Eye; onClick: () => void; tone: "emerald" | "sky" | "rose"; disabled?: boolean }) {
  const className =
    tone === "emerald"
      ? "border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
      : tone === "sky"
        ? "border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        : "border-rose-100 text-rose-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700";
  return (
    <Button type="button" variant="ghost" size="icon" className={`size-10 rounded-2xl ${className}`} onClick={onClick} disabled={disabled}>
      <Icon className="size-4.5" />
    </Button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div key={`bk-counseling-loading-${rowIndex}`} className="grid gap-3 rounded-[18px] border border-slate-100 bg-slate-50/75 px-4 py-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <div key={`bk-counseling-loading-${rowIndex}-${cellIndex}`} className="h-4 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
      ))}
    </div>
  );
}

async function invalidateBKCounseling(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["bk-counseling-overview"] }),
    queryClient.invalidateQueries({ queryKey: ["bk-students-overview"] }),
    queryClient.invalidateQueries({ queryKey: ["bk-dashboard"] }),
  ]);
}

function getBKCounselingTitle() {
  return "Counseling Notes Dashboard";
}
