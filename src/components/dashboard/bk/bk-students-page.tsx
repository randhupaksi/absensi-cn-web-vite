"use client";

import dynamic from "@/lib/dynamic";
import {
  classFilterOptions,
  formatGender,
  getInitials,
} from "@/components/dashboard/bk/bk-common";
import {
  TableSkeleton,
  StudentDetailModal,
  CounselingNoteCreateModal,
} from "@/components/dashboard/bk/bk-students-modals";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { KpiCard } from "@/components/dashboard/admin/widgets/kpi-card";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";
import { bkSidebarItems } from "@/components/dashboard/staff/staff-sidebar";
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
  LayoutPanelTop,
  NotebookPen,
  Printer,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BKSiswaReportModal = dynamic(
  () => import("@/components/reports/bk/bk-siswa-report-modal").then((module) => module.BKSiswaReportModal),
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [classFilter, setClassFilter] = useState("Semua");
  const [riskFilter, setRiskFilter] = useState("Semua");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const overviewQuery = useQuery({
    queryKey: ["bk-students-overview", classFilter, riskFilter, debouncedQuery],
    queryFn: () =>
      getBKStudentsOverview({
        class_id: classFilter === "Semua" ? "" : classFilter,
        risk: riskFilter === "Semua" ? "" : riskFilter,
        query: debouncedQuery.trim(),
      }),
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
            <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                    <LayoutPanelTop className="size-3.5" />
                    BK Students Workspace
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-normal text-slate-950 sm:text-[2.35rem]">
                      Monitoring Siswa
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Pantau siswa lintas kelas, lihat pola telat atau alfa, dan
                      buka catatan pembinaan dari satu tabel kerja BK.
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

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                    onValueChange={setClassFilter}
                    options={classFilterOptions(classes)}
                    placeholder="Pilih kelas"
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
                <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                    <SlidersHorizontal className="size-4" />
                  </span>
                  <Search className="size-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari siswa, NIS, kelas, telepon"
                    className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[260px]"
                  />
                </div>
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
                  <TableSkeleton columns={8} />
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
                  <table className="min-w-full text-sm">
                    <thead className="bg-[linear-gradient(180deg,#eef8f2_0%,#e5f4eb_100%)] text-left text-slate-700">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Siswa</th>
                        <th className="px-5 py-4 font-semibold">Kelas</th>
                        <th className="px-5 py-4 font-semibold">Identitas</th>
                        <th className="px-5 py-4 text-center font-semibold">Telat</th>
                        <th className="px-5 py-4 text-center font-semibold">Alfa</th>
                        <th className="px-5 py-4 text-center font-semibold">Izin/Sakit</th>
                        <th className="px-5 py-4 text-center font-semibold">Status</th>
                        <th className="px-5 py-4 text-center font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 bg-white/92">
                      {students.map((student) => (
                        <tr key={student.id} className="transition-colors hover:bg-emerald-50/45">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-11 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-sm font-semibold text-emerald-800">
                                {getInitials(student.name)}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.nis}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-slate-800">
                              {student.class_name || "-"}
                            </p>
                            <p className="text-xs">{student.school_year_name || "-"}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p>{formatGender(student.gender)}</p>
                            <p className="text-xs">{student.nisn || "-"}</p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <CountBadge value={student.late_count} tone="warning" />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <CountBadge value={student.alpha_count} tone="danger" />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <CountBadge
                              value={student.permission_count + student.sick_count}
                              tone="info"
                            />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <StatusBadge active={student.is_active} />
                          </td>
                          <td className="px-5 py-4">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </section>

          <BKSiswaReportModal
            open={reportModalOpen}
            onOpenChange={setReportModalOpen}
            classes={classes}
          />

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

function CountBadge({ value, tone }: { value: number; tone: "warning" | "danger" | "info" }) {
  const className =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
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
