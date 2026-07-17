"use client";

import dynamic from "@/lib/dynamic";
import { BkPageHero } from "@/features/bk/components/page-hero";
import {
  classFilterOptions,
  formatGender,
  getInitials,
  TableSkeleton,
} from "@/features/bk/components/common";
import {
  StudentDetailModal,
  CounselingNoteCreateModal,
} from "@/features/bk/components/students/modals";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import {
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
  SearchFilterBar,
  usePagination,
} from "@/features/admin/management/shared/section-ui";
import { StaffShell } from "@/features/staff/components/shell";
import { bkSidebarItems } from "@/features/staff/components/sidebar";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  createBKCounselingNote,
  getBKStudentDetail,
  getBKStudentsOverview,
} from "@/services/staff.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookHeart,
  Eye,
  NotebookPen,
  ShieldAlert,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const BKSiswaReportModal = dynamic(
  () => import("@/features/reports/bk/students-report-modal").then((module) => module.BKSiswaReportModal),
  { ssr: false },
);

const riskOptions = [
  { value: "Semua", label: "Semua risiko" },
  { value: "need_attention", label: "Perlu Perhatian" },
  { value: "late", label: "Ada Telat" },
  { value: "alpha", label: "Ada Alfa" },
  { value: "counseling", label: "Punya Catatan BK" },
  { value: "stable", label: "Stabil" },
];

export function BKStudentsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [classFilter, setClassFilter] = useState("Semua");
  const [riskFilter, setRiskFilter] = useState("Semua");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["bk-students-overview", classFilter, riskFilter, debouncedQuery],
    queryFn: () =>
      getBKStudentsOverview({
        class_id: classFilter === "Semua" ? "" : classFilter,
        risk: riskFilter === "Semua" ? "" : riskFilter,
        query: debouncedQuery.trim(),
      }),
    placeholderData: (previousData) => previousData,
  });

  const detailQuery = useQuery({
    queryKey: ["bk-student-detail", selectedStudentId],
    queryFn: () => getBKStudentDetail(selectedStudentId ?? ""),
    enabled: Boolean(selectedStudentId),
  });

  const createNoteMutation = useMutation({
    mutationFn: async (payload: { title: string; note: string }) => {
      const targetId = noteTargetId ?? selectedStudentId;
      if (!targetId) throw new Error("Siswa belum dipilih.");
      return createBKCounselingNote(targetId, payload);
    },
    onSuccess: () => {
      toast.success("Catatan BK berhasil dibuat.");
      void queryClient.invalidateQueries({ queryKey: ["bk-student-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["bk-students-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["bk-dashboard"] });
      setNoteTargetId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const overview = overviewQuery.data;
  const counts = overview?.counts ?? {
    total: 0,
    active: 0,
    need_attention: 0,
    total_late: 0,
    total_alpha: 0,
    with_counseling_notes: 0,
  };
  const students = overview?.students ?? [];
  const { pageItems: pageStudents, pagination: studentsPagination } = usePagination(students);
  const classes = overview?.classes ?? [];

  const kpiCards = [
    {
      label: "Total Siswa",
      value: String(counts.total),
      subtitle: "Siswa lintas kelas",
      icon: UsersRound,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Perlu Perhatian",
      value: String(counts.need_attention),
      subtitle: "Butuh tindak lanjut",
      icon: ShieldAlert,
      accentClass: "bg-rose-100 text-rose-700",
    },
    {
      label: "Akumulasi Alfa",
      value: String(counts.total_alpha),
      subtitle: "Catatan alfa siswa",
      icon: TriangleAlert,
      accentClass: "bg-orange-100 text-orange-700",
    },
    {
      label: "Catatan BK",
      value: String(counts.with_counseling_notes),
      subtitle: "Siswa sudah dibina",
      icon: BookHeart,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <StaffShell
      expectedRole="bk"
      sidebarItems={bkSidebarItems}
      userLabel="Guru BK"
      resolveTitle={getBKStudentsTitle}
    >
      {() => (
        <>
          <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
            <BkPageHero
              badge="BK Students Workspace"
              title="Monitoring Siswa"
              description={<>Pantau siswa lintas kelas, lihat pola telat atau alfa, dan buka catatan pembinaan dari satu tabel kerja BK.</>}
              kpiCards={kpiCards}
              onOpenReport={() => setReportModalOpen(true)}
              kpiGridClassName="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4"
            />

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="w-full sm:w-[220px]">
                  <RadixSelectField
                    value={classFilter}
                    onValueChange={setClassFilter}
                    options={classFilterOptions(classes)}
                    placeholder="Pilih kelas"
                    searchable
                    searchPlaceholder="Cari kelas..."
                    emptyText="Kelas tidak ditemukan."
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
                <div className="w-full sm:w-[230px]">
                  <RadixSelectField
                    value={riskFilter}
                    onValueChange={setRiskFilter}
                    options={riskOptions}
                    placeholder="Pilih risiko"
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari siswa, NIS, atau kelas" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80"
            >
              <div className="overflow-x-auto bg-white/92">
                {overviewQuery.isLoading ? (
                  <TableSkeleton columns={10} />
                ) : overviewQuery.error ? (
                  <div className="p-5">
                    <EmptyState
                      icon={ShieldAlert}
                      title="Data siswa BK belum bisa dimuat"
                      description={overviewQuery.error.message}
                    />
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={UsersRound}
                      title="Belum ada siswa untuk filter ini"
                      description="Ubah filter kelas, risiko, atau pencarian untuk melihat data siswa."
                    />
                  </div>
                ) : (
                  <>
                  <div className="hidden md:block">
                  <DataTable>
                    <DataTableHeadRow
                      labels={["Siswa", "Kelas", "Identitas", "H", "I", "S", "A", "T", "Status", "Aksi"]}
                      centerLabels={["H", "I", "S", "A", "T", "Status"]}
                    />
                    <DataTableBody>
                      {pageStudents.map((student) => (
                        <DataTableRow key={student.id}>
                          <DataTableCell>
                            <div className="flex items-center gap-3">
                              <span className="flex size-11 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-sm font-semibold text-emerald-800">
                                {getInitials(student.name)}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.nis}</p>
                              </div>
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <p className="font-medium text-slate-800">
                              {student.class_name || "-"}
                            </p>
                            <p className="text-xs">{student.school_year_name || "-"}</p>
                          </DataTableCell>
                          <DataTableCell>
                            <p>{formatGender(student.gender)}</p>
                            <p className="text-xs">{student.nisn || "-"}</p>
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <CountBadge value={student.present_count} tone="success" />
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <CountBadge value={student.permission_count} tone="info" />
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <CountBadge value={student.sick_count} tone="violet" />
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <CountBadge value={student.alpha_count} tone="danger" />
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <CountBadge value={student.late_count} tone="warning" />
                          </DataTableCell>
                          <DataTableCell className="text-center">
                            <StatusBadge active={student.is_active} />
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                                onClick={() => setSelectedStudentId(student.id)}
                              >
                                <Eye className="size-4.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-2xl border border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                onClick={() => setNoteTargetId(student.id)}
                              >
                                <NotebookPen className="size-4.5" />
                              </Button>
                            </div>
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                  </div>
                  <MobileDataList>
                    {pageStudents.map((student) => (
                      <MobileDataCard key={student.id}>
                        <MobileDataHeader
                          leading={
                            <span className="flex size-11 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-sm font-semibold text-emerald-800">
                              {getInitials(student.name)}
                            </span>
                          }
                          title={student.name}
                          subtitle={student.nis}
                          badge={<StatusBadge active={student.is_active} />}
                        />
                        <div className="mt-4 grid gap-3">
                          <MobileDataField label="Kelas" value={student.class_name || "-"} />
                          <MobileDataField label="Tahun Ajaran" value={student.school_year_name || "-"} />
                          <MobileDataField label="Identitas" value={`${formatGender(student.gender)} - ${student.nisn || "-"}`} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Hadir</p>
                            <div className="mt-1"><CountBadge value={student.present_count} tone="success" /></div>
                          </div>
                          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700">Izin</p>
                            <div className="mt-1"><CountBadge value={student.permission_count} tone="info" /></div>
                          </div>
                          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700">Sakit</p>
                            <div className="mt-1"><CountBadge value={student.sick_count} tone="violet" /></div>
                          </div>
                          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700">Alfa</p>
                            <div className="mt-1"><CountBadge value={student.alpha_count} tone="danger" /></div>
                          </div>
                          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">Telat</p>
                            <div className="mt-1"><CountBadge value={student.late_count} tone="warning" /></div>
                          </div>
                        </div>
                        <MobileDataFooter>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-2xl border border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setSelectedStudentId(student.id)}
                          >
                            <Eye className="size-4.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-2xl border border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            onClick={() => setNoteTargetId(student.id)}
                          >
                            <NotebookPen className="size-4.5" />
                          </Button>
                        </MobileDataFooter>
                      </MobileDataCard>
                    ))}
                  </MobileDataList>
                  </>
                )}
              </div>
              {!overviewQuery.isLoading && !overviewQuery.error && students.length > 0 ? (
                <DataTablePagination {...studentsPagination} />
              ) : null}
            </motion.div>
          </section>

          {reportModalOpen && (
            <BKSiswaReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              classes={classes}
            />
          )}

          <StudentDetailModal
            open={Boolean(selectedStudentId)}
            onOpenChange={(open) => {
              if (!open) setSelectedStudentId(null);
            }}
            detail={detailQuery.data ?? null}
            isLoading={detailQuery.isLoading}
            errorMessage={detailQuery.error?.message}
            onCreateNote={(studentId) => setNoteTargetId(studentId)}
          />

          {noteTargetId ? (
            <CounselingNoteCreateModal
              key={noteTargetId}
              open
              onOpenChange={(open) => {
                if (!open) setNoteTargetId(null);
              }}
              isPending={createNoteMutation.isPending}
              onSubmit={(payload) => createNoteMutation.mutate(payload)}
            />
          ) : null}
        </>
      )}
    </StaffShell>
  );
}

function CountBadge({ value, tone }: { value: number; tone: "success" | "warning" | "danger" | "info" | "violet" }) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "violet"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-sky-200 bg-sky-50 text-sky-700";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{value}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function getBKStudentsTitle() {
  return "Student Monitoring Dashboard";
}
