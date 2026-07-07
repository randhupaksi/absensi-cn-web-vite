"use client";

import dynamic from "@/lib/dynamic";
import { BkPageHero } from "@/components/dashboard/bk/bk-page-hero";
import {
  classFilterOptions,
  formatDateTime,
  getInitials,
  TableSkeleton,
} from "@/components/dashboard/bk/bk-common";
import {
  CounselingDetailModal,
  CounselingFormModal,
} from "@/components/dashboard/bk/bk-counseling-modals";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import {
  AddButton,
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
  ShieldAlert,
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
            <BkPageHero
              badge="BK Counseling Workspace"
              title="Catatan Konseling"
              description={<>Kelola catatan pembinaan, tindak lanjut, dan histori konseling siswa lintas kelas.</>}
              kpiCards={kpiCards}
              onOpenReport={() => setReportModalOpen(true)}
            />

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
                <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari siswa, NIS, judul, catatan" />
                <AddButton label="Catatan Konseling" onClick={() => setCreateOpen(true)} />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80 bg-white/92"
            >
              {overviewQuery.isLoading ? (
                <TableSkeleton columns={6} />
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

          {reportModalOpen && (
            <BKKonselingReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              classes={classes}
              students={students}
            />
          )}

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
