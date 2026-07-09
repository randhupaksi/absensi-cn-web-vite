"use client";

import dynamic from "@/lib/dynamic";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatGender,
  getInitials,
  LoadingTable,
  StatusPill,
  StudentDetailModal,
} from "@/components/dashboard/walas/walas-students-modals";
import { RadixSelectField } from "@/components/ui/radix-select";
import { WalasShell } from "@/components/dashboard/staff/walas-shell";
import {
  getTeacherHomeroom,
  getTeacherHomeroomStudentDetail,
  getTeacherHomeroomStudents,
} from "@/services/staff.service";
import type { StaffHomeroomContext } from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  BadgeCheck,
  Eye,
  GraduationCap,
  LayoutPanelTop,
  Printer,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

const WalasSiswaReportModal = dynamic(
  () => import("@/components/reports/walas/walas-siswa-report-modal").then((module) => module.WalasSiswaReportModal),
  { ssr: false },
);

const studentStatusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Perlu Perhatian", label: "Perlu Perhatian" },
  { value: "Stabil", label: "Stabil" },
];

const emptyHomeroom: StaffHomeroomContext = {
  assignment_id: "",
  teacher_id: "",
  class_id: "",
  class_name: "Belum ada kelas walas",
  school_year_id: "",
  school_year_name: "Tahun ajaran belum tersedia",
  is_active: false,
};

export function WalasStudentsPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const homeroomQuery = useQuery({
    queryKey: ["teacher-homeroom"],
    queryFn: getTeacherHomeroom,
  });

  const studentsQuery = useQuery({
    queryKey: ["teacher-homeroom-students"],
    queryFn: getTeacherHomeroomStudents,
  });

  const studentDetailQuery = useQuery({
    queryKey: ["teacher-homeroom-student-detail", selectedStudentId],
    queryFn: () => getTeacherHomeroomStudentDetail(selectedStudentId ?? ""),
    enabled: Boolean(selectedStudentId),
  });

  const homeroom = homeroomQuery.data ?? emptyHomeroom;
  const studentsData = studentsQuery.data;
  const students = studentsData ?? [];
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    return (studentsData ?? []).filter((student) => {
      const needsAttention = student.late_count > 0 || student.alpha_count > 0;

      const matchesStatus =
        statusFilter === "Semua" ||
        (statusFilter === "Aktif" && student.is_active) ||
        (statusFilter === "Perlu Perhatian" && needsAttention) ||
        (statusFilter === "Stabil" && !needsAttention);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.nis.toLowerCase().includes(normalizedQuery) ||
        (student.nisn ?? "").toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [normalizedQuery, statusFilter, studentsData]);

  const { pageItems: pageStudents, pagination: studentsPagination } = usePagination(filteredStudents);

  const activeStudents = students.filter((student) => student.is_active).length;
  const studentsNeedingAttention = students.filter(
    (student) => student.late_count > 0 || student.alpha_count > 0,
  ).length;
  const totalLateCount = students.reduce((sum, student) => sum + student.late_count, 0);
  const totalAlphaCount = students.reduce((sum, student) => sum + student.alpha_count, 0);

  const tableErrorMessage = homeroomQuery.error?.message ?? studentsQuery.error?.message;

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
                    Homeroom Students Workspace
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                      Siswa Kelas
                    </h2>
                    <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                      Pantau daftar siswa walas, lihat ringkasan kehadiran, dan
                      buka detail siswa langsung dari satu tabel operasional yang
                      lebih fokus.
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
                        {homeroom.class_name || "Belum ada kelas walas"}
                      </p>
                      <p className="text-xs leading-5 text-slate-500">
                        {homeroom.school_year_name || "Tahun ajaran belum tersedia"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                <StaffStatCard
                  label="Total Siswa"
                  value={students.length}
                  icon={UsersRound}
                  accentClass="from-emerald-500 via-teal-500 to-cyan-500"
                />
                <StaffStatCard
                  label="Siswa Aktif"
                  value={activeStudents}
                  icon={BadgeCheck}
                  accentClass="from-teal-500 via-emerald-500 to-green-500"
                />
                <StaffStatCard
                  label="Perlu Perhatian"
                  value={studentsNeedingAttention}
                  icon={TriangleAlert}
                  accentClass="from-amber-400 via-orange-400 to-rose-500"
                />
                <StaffStatCard
                  label="Akumulasi Alfa"
                  value={totalAlphaCount}
                  icon={ShieldCheck}
                  accentClass="from-sky-500 via-cyan-500 to-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="text-xs font-medium text-slate-400">
                  {totalLateCount} catatan telat dan {totalAlphaCount} catatan alfa tercatat untuk siswa kelas ini
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari siswa, NIS, atau NISN" />

                  <div className="w-full sm:w-[210px]">
                    <RadixSelectField
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                      placeholder="Pilih status"
                      options={studentStatusOptions}
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
                    Cetak Laporan
                  </Button>
                </div>
              </div>
            </div>

            {tableErrorMessage ? (
              <div className="mt-5">
                <EmptyState
                  icon={UsersRound}
                  title="Data siswa kelas belum bisa dimuat"
                  description={tableErrorMessage}
                  compact
                />
              </div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
              className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100/80"
            >
              {studentsQuery.isLoading || homeroomQuery.isLoading ? (
                <div className="overflow-x-auto">
                  <LoadingTable columnCount={8} />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={UsersRound}
                    title="Belum ada siswa yang cocok"
                    description="Coba ubah pencarian atau filter untuk melihat daftar siswa kelas walas."
                    compact
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DataTable>
                    <DataTableHeadRow labels={["Siswa", "Identitas", "Gender", "Status", "Telat", "Alfa", "Ringkasan", "Aksi"]} />
                    <DataTableBody>
                        {pageStudents.map((student) => (
                          <DataTableRow key={student.id}>
                            <DataTableCell>
                              <div className="flex items-center gap-3">
                                <span className="flex size-11 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-sm font-semibold text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                                  {getInitials(student.name)}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {student.name}
                                  </p>
                                  <p className="truncate text-slate-500">{student.class_name || "-"}</p>
                                </div>
                              </div>
                            </DataTableCell>
                            <DataTableCell>
                              <p className="font-medium text-slate-800">{student.nis}</p>
                              <p>{student.nisn || "-"}</p>
                            </DataTableCell>
                            <DataTableCell>
                              {formatGender(student.gender)}
                            </DataTableCell>
                            <DataTableCell>
                              <div className="flex flex-wrap gap-2">
                                <StatusPill isActive={student.is_active} />
                                {student.late_count > 0 || student.alpha_count > 0 ? (
                                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                    Perlu perhatian
                                  </Badge>
                                ) : null}
                              </div>
                            </DataTableCell>
                            <DataTableCell>
                              <CountBadge value={student.late_count} tone="warning" />
                            </DataTableCell>
                            <DataTableCell>
                              <CountBadge value={student.alpha_count} tone="danger" />
                            </DataTableCell>
                            <DataTableCell>
                              <div className="space-y-1 text-xs text-slate-500">
                                <p>Hadir: {student.present_count}</p>
                                <p>Izin: {student.permission_count}</p>
                                <p>Sakit: {student.sick_count}</p>
                              </div>
                            </DataTableCell>
                            <DataTableCell>
                              <div className="flex justify-center">
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  className="rounded-[14px] border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => setSelectedStudentId(student.id)}
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </div>
                            </DataTableCell>
                          </DataTableRow>
                        ))}
                    </DataTableBody>
                  </DataTable>
                </div>
              )}
              {!studentsQuery.isLoading && !homeroomQuery.isLoading && filteredStudents.length > 0 ? (
                <DataTablePagination {...studentsPagination} />
              ) : null}
            </motion.div>
          </section>

          <StudentDetailModal
            open={Boolean(selectedStudentId)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedStudentId(null);
              }
            }}
            studentDetail={studentDetailQuery.data ?? null}
            isLoading={studentDetailQuery.isLoading}
            errorMessage={studentDetailQuery.error?.message}
          />

          {reportModalOpen && (
            <WalasSiswaReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              homeroom={homeroom}
            />
          )}
        </>
      )}
    </WalasShell>
  );
}
function StaffStatCard({
  label,
  value,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
  accentClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,252,248,0.96)_100%)] p-4 shadow-[0_18px_34px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_54px_rgba(15,23,42,0.1)]">
      <div className="absolute right-[-10px] top-[-26px] h-24 w-24 rounded-full bg-emerald-100/40 blur-2xl transition duration-300 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="text-[2.15rem] font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center text-right">
          <span
            className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]`}
          >
            <Icon className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}

function CountBadge({
  value,
  tone,
}: {
  value: number;
  tone: "warning" | "danger";
}) {
  return (
    <Badge
      className={
        tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }
    >
      {value}
    </Badge>
  );
}
