"use client";

import dynamic from "@/lib/dynamic";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import {
  ActionButtons,
  AddButton,
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCell,
  DataTableHeadRow,
  DataTableRow,
  SearchFilterBar,
  SectionTabSwitch,
  StatCard,
  StatusBadge,
  getInitials,
  usePagination,
} from "@/components/dashboard/admin/sections/section-ui";
import {
  AttendanceRuleCreateModal,
  AttendanceRuleEditModal,
} from "@/components/dashboard/admin/sections/student-attendance-modals";
import {
  StudentMembershipCreateModal,
  StudentMembershipEditModal,
  MembershipStatusBadge,
  formatDateTime,
} from "@/components/dashboard/admin/sections/student-membership-modals";
import {
  StudentProfileCreateModal,
  StudentProfileEditModal,
  formatGender,
} from "@/components/dashboard/admin/sections/student-profile-modals";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  createAdminAttendanceRule,
  createAdminStudent,
  createAdminStudentClassMembership,
  deleteAdminAttendanceRule,
  deleteAdminStudent,
  deleteAdminStudentClassMembership,
  updateAdminAttendanceRule,
  updateAdminStudent,
  updateAdminStudentClassMembership,
} from "@/services/admin.service";
import type {
  AdminAttendanceRule,
  AdminAttendanceRulePayload,
  AdminClass,
  AdminSchoolYear,
  AdminStudent,
  AdminStudentClassMembership,
  AdminStudentClassMembershipPayload,
  AdminStudentPayload,
} from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  FilePenLine,
  FileSpreadsheet,
  GraduationCap,
  LayoutPanelTop,
  ShieldCheck,
  Printer,
  TimerReset,
  UsersRound,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

const ImportExcelModal = dynamic(
  () => import("@/components/modals/import-excel-modal").then((module) => module.ImportExcelModal),
  { ssr: false },
);

const SiswaReportModal = dynamic(
  () => import("@/components/reports/admin/siswa-report-modal").then((module) => module.SiswaReportModal),
  { ssr: false },
);

type StudentSectionProps = {
  students: AdminStudent[];
  memberships: AdminStudentClassMembership[];
  attendanceRules: AdminAttendanceRule[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isLoading?: boolean;
  errorMessage?: string;
};

type StudentTab = "profiles" | "memberships" | "rules";

type StudentDeleteTarget =
  | { type: "profile"; item: AdminStudent }
  | { type: "membership"; item: AdminStudentClassMembership }
  | { type: "rule"; item: AdminAttendanceRule };

const statusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

export function StudentSection({
  students,
  memberships,
  attendanceRules,
  classes,
  schoolYears,
  isLoading = false,
  errorMessage,
}: StudentSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [activeTab, setActiveTab] = useState<StudentTab>("profiles");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [editingMembership, setEditingMembership] =
    useState<AdminStudentClassMembership | null>(null);
  const [editingRule, setEditingRule] = useState<AdminAttendanceRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentDeleteTarget | null>(null);

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const createStudentMutation = useMutation({
    mutationFn: createAdminStudent,
    onSuccess: () => {
      toast.success("Profil siswa berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
      setProfileModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createMembershipMutation = useMutation({
    mutationFn: createAdminStudentClassMembership,
    onSuccess: () => {
      toast.success("Penempatan kelas siswa berhasil dibuat.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
      setMembershipModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createRuleMutation = useMutation({
    mutationFn: createAdminAttendanceRule,
    onSuccess: () => {
      toast.success("Aturan absensi berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-attendance-rules"] });
      setRuleModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminStudentPayload }) =>
      updateAdminStudent(id, payload),
    onSuccess: () => {
      toast.success("Profil siswa berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
      setEditingStudent(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: deleteAdminStudent,
    onSuccess: () => {
      toast.success("Data siswa berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMembershipMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminStudentClassMembershipPayload;
    }) => updateAdminStudentClassMembership(id, payload),
    onSuccess: () => {
      toast.success("Penempatan kelas siswa berhasil diperbarui.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
      setEditingMembership(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: deleteAdminStudentClassMembership,
    onSuccess: () => {
      toast.success("Penempatan kelas siswa berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin-student-class-memberships"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminAttendanceRulePayload;
    }) => updateAdminAttendanceRule(id, payload),
    onSuccess: () => {
      toast.success("Aturan absensi berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-attendance-rules"] });
      setEditingRule(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteAdminAttendanceRule,
    onSuccess: () => {
      toast.success("Aturan absensi berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-attendance-rules"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && student.is_active) ||
          (statusFilter === "Nonaktif" && !student.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          student.name.toLowerCase().includes(normalizedQuery) ||
          student.nis.toLowerCase().includes(normalizedQuery) ||
          (student.nisn ?? "").toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [students, statusFilter, normalizedQuery],
  );

  const filteredMemberships = useMemo(
    () =>
      memberships.filter((membership) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && membership.is_active) ||
          (statusFilter === "Nonaktif" && !membership.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          membership.student_name.toLowerCase().includes(normalizedQuery) ||
          membership.nis.toLowerCase().includes(normalizedQuery) ||
          membership.class_name.toLowerCase().includes(normalizedQuery) ||
          membership.school_year_name.toLowerCase().includes(normalizedQuery) ||
          membership.status.toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [memberships, statusFilter, normalizedQuery],
  );

  const filteredRules = useMemo(
    () =>
      attendanceRules.filter((rule) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && rule.is_active) ||
          (statusFilter === "Nonaktif" && !rule.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          rule.school_year.toLowerCase().includes(normalizedQuery) ||
          rule.check_in_start.toLowerCase().includes(normalizedQuery) ||
          rule.on_time_until.toLowerCase().includes(normalizedQuery) ||
          rule.late_until.toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [attendanceRules, statusFilter, normalizedQuery],
  );

  const { pageItems: pageStudents, pagination: studentsPagination } = usePagination(filteredStudents);
  const { pageItems: pageMemberships, pagination: membershipsPagination } = usePagination(filteredMemberships);
  const { pageItems: pageRules, pagination: rulesPagination } = usePagination(filteredRules);

  const activeStudentCount = students.filter((student) => student.is_active).length;
  const activeMembershipCount = memberships.filter((membership) => membership.is_active).length;
  const activeRuleCount = attendanceRules.filter((rule) => rule.is_active).length;

  const kpiCards = useMemo(() => {
    if (activeTab === "memberships") {
      return [
        {
          label: "Total Penempatan",
          value: memberships.length,
          icon: GraduationCap,
          accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
        },
        {
          label: "Penempatan Aktif",
          value: activeMembershipCount,
          icon: BadgeCheck,
          accentClass: "from-teal-500 via-emerald-500 to-green-500",
        },
        {
          label: "Kelas Terisi",
          value: new Set(memberships.map((membership) => membership.class_id)).size,
          icon: BookOpen,
          accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
        },
        {
          label: "Tahun Ajaran",
          value: new Set(memberships.map((membership) => membership.school_year_id)).size,
          icon: CalendarClock,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
      ];
    }

    if (activeTab === "rules") {
      return [
        {
          label: "Total Rule",
          value: attendanceRules.length,
          icon: TimerReset,
          accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
        },
        {
          label: "Rule Aktif",
          value: activeRuleCount,
          icon: ShieldCheck,
          accentClass: "from-teal-500 via-emerald-500 to-green-500",
        },
        {
          label: "Tahun Ajaran",
          value: new Set(attendanceRules.map((rule) => rule.school_year_id)).size,
          icon: CalendarClock,
          accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
        },
        {
          label: "Window Unik",
          value: new Set(
            attendanceRules.map(
              (rule) => `${rule.check_in_start}|${rule.on_time_until}|${rule.late_until}`,
            ),
          ).size,
          icon: BadgeCheck,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
      ];
    }

    return [
      {
        label: "Total Siswa",
        value: students.length,
        icon: UsersRound,
        accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
      },
      {
        label: "Siswa Aktif",
        value: activeStudentCount,
        icon: BadgeCheck,
        accentClass: "from-teal-500 via-emerald-500 to-green-500",
      },
      {
        label: "Punya NISN",
        value: students.filter((student) => Boolean(student.nisn?.trim())).length,
        icon: FilePenLine,
        accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
      },
      {
        label: "Sudah Ditempatkan",
        value: new Set(memberships.filter((membership) => membership.is_active).map((membership) => membership.student_id)).size,
        icon: GraduationCap,
        accentClass: "from-amber-400 via-orange-400 to-emerald-500",
      },
    ];
  }, [activeMembershipCount, activeRuleCount, activeStudentCount, activeTab, attendanceRules, memberships, students]);

  const addActionConfig = {
    profiles: {
      label: "Siswa",
      onClick: () => setProfileModalOpen(true),
    },
    memberships: {
      label: "Penempatan Kelas",
      onClick: () => setMembershipModalOpen(true),
    },
    rules: {
      label: "Aturan Absensi",
      onClick: () => setRuleModalOpen(true),
    },
  } satisfies Record<StudentTab, { label: string; onClick: () => void }>;

  const activeAction = addActionConfig[activeTab];

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-emerald-100/30 blur-3xl" />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StudentTab)}>
        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-8 sm:gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <LayoutPanelTop className="size-3.5" />
                Student Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Student Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Kelola profil siswa, penempatan kelas per tahun ajaran, dan aturan absensi
                  harian dari API admin dengan struktur yang konsisten.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              {activeTab === "profiles" && (
                <Button
                  variant="outline"
                  className="h-14 rounded-[22px] border-teal-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,250,0.98)_100%)] px-5 text-sm font-semibold text-teal-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-teal-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(230,252,248,1)_100%)] hover:text-teal-950"
                  onClick={() => setImportModalOpen(true)}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-teal-600 text-white shadow-[0_10px_20px_rgba(13,148,136,0.2)]">
                    <FileSpreadsheet className="size-4" />
                  </span>
                  Import Excel
                </Button>
              )}

              {activeTab === "profiles" && (
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
              )}
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accentClass={card.accentClass}
              />
            ))}
          </div>

          <SectionTabSwitch
            tabs={[
              { value: "profiles", label: "Profil Siswa", icon: UsersRound },
              { value: "memberships", label: "Penempatan Kelas", icon: GraduationCap },
              { value: "rules", label: "Aturan Absensi", icon: TimerReset },
            ]}
          />
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState
              icon={UsersRound}
              title="Data student belum bisa dimuat"
              description={errorMessage}
              compact
            />
          </div>
        ) : null}

        <div className="mt-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-xs font-medium text-slate-400">
              {activeStudentCount} siswa aktif tercatat
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari siswa, kelas, atau NIS" />

              <div className="w-full sm:w-[190px]">
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Pilih status"
                  options={statusOptions}
                  triggerClassName="h-14 rounded-[22px] pl-4"
                />
              </div>

              <AddButton label={activeAction.label} onClick={activeAction.onClick} />
            </div>
          </div>
        </div>

          <TabsContent value="profiles" className="mt-4">
            <DataTableCard isLoading={isLoading} columnCount={6} isEmpty={filteredStudents.length === 0} emptyTitle="Belum ada siswa" emptyDescription="Tambahkan siswa baru agar data muncul pada daftar ini." icon={UsersRound} pagination={studentsPagination}>
              <DataTable>
                <DataTableHeadRow labels={["Siswa", "NIS / NISN", "Kelas Aktif", "Gender", "Status", "Aksi"]} />
                <DataTableBody>
                  {pageStudents.map((student) => (
                    <DataTableRow key={student.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                            {getInitials(student.name)}
                          </span>
                          <div>
                            <p className="font-medium text-slate-700">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.user_id}</p>
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="space-y-1">
                          <p>{student.nis}</p>
                          <p className="text-xs text-slate-400">NISN: {student.nisn || "-"}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        {memberships.find((membership) => membership.student_id === student.id && membership.is_active)?.class_name || "Belum ditempatkan"}
                      </DataTableCell>
                      <DataTableCell>{formatGender(student.gender)}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge isActive={student.is_active} />
                      </DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingStudent(student)}
                          onDelete={() => setDeleteTarget({ type: "profile", item: student })}
                          isDeletePending={deleteStudentMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="memberships" className="mt-4">
            <DataTableCard isLoading={isLoading} columnCount={6} isEmpty={filteredMemberships.length === 0} emptyTitle="Belum ada penempatan kelas" emptyDescription="Riwayat kelas siswa per tahun ajaran akan tampil di sini." icon={GraduationCap} pagination={membershipsPagination}>
              <DataTable>
                <DataTableHeadRow labels={["Siswa", "Kelas", "Tahun Ajaran", "Status", "Waktu", "Aksi"]} />
                <DataTableBody>
                  {pageMemberships.map((membership) => (
                    <DataTableRow key={membership.id}>
                      <DataTableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-700">{membership.student_name}</p>
                          <p className="text-xs text-slate-400">{membership.nis}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>{membership.class_name}</DataTableCell>
                      <DataTableCell>{membership.school_year_name}</DataTableCell>
                      <DataTableCell>
                        <MembershipStatusBadge status={membership.status} />
                      </DataTableCell>
                      <DataTableCell>
                        <div className="space-y-1 text-xs text-slate-500">
                          <p>Masuk: {formatDateTime(membership.joined_at)}</p>
                          <p>Keluar: {formatDateTime(membership.left_at)}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingMembership(membership)}
                          onDelete={() => setDeleteTarget({ type: "membership", item: membership })}
                          isDeletePending={deleteMembershipMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <DataTableCard isLoading={isLoading} columnCount={6} isEmpty={filteredRules.length === 0} emptyTitle="Belum ada aturan absensi" emptyDescription="Rule jam hadir, telat, dan cutoff alfa akan muncul di tabel ini." icon={TimerReset} pagination={rulesPagination}>
              <DataTable>
                <DataTableHeadRow labels={["Tahun Ajaran", "Mulai Absen", "Tepat Waktu", "Batas Telat", "Status", "Aksi"]} />
                <DataTableBody>
                  {pageRules.map((rule) => (
                    <DataTableRow key={rule.id}>
                      <DataTableCell>{rule.school_year}</DataTableCell>
                      <DataTableCell>{rule.check_in_start}</DataTableCell>
                      <DataTableCell>{rule.on_time_until}</DataTableCell>
                      <DataTableCell>{rule.late_until}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge isActive={rule.is_active} />
                      </DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingRule(rule)}
                          onDelete={() => setDeleteTarget({ type: "rule", item: rule })}
                          isDeletePending={deleteRuleMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>
        </Tabs>
      </section>

      {importModalOpen && (
        <ImportExcelModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          type="siswa"
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
            void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
          }}
        />
      )}

      {reportModalOpen && (
        <SiswaReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          students={students}
        />
      )}

      {profileModalOpen && (
        <StudentProfileCreateModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          isPending={createStudentMutation.isPending}
          classes={classes}
          onSubmit={(payload) => createStudentMutation.mutate(payload)}
        />
      )}
      {editingStudent && (
        <StudentProfileEditModal
          key={editingStudent.id}
          student={editingStudent}
          open
          onOpenChange={(open) => { if (!open) setEditingStudent(null); }}
          isPending={updateStudentMutation.isPending}
          classes={classes}
          currentClassId={memberships.find((membership) => membership.student_id === editingStudent.id && membership.is_active)?.class_id}
          onSubmit={(payload) => updateStudentMutation.mutate({ id: editingStudent.id, payload })}
        />
      )}
      {membershipModalOpen && (
        <StudentMembershipCreateModal
          open={membershipModalOpen}
          onOpenChange={setMembershipModalOpen}
          students={students}
          classes={classes}
          schoolYears={schoolYears}
          isPending={createMembershipMutation.isPending}
          onSubmit={(payload) => createMembershipMutation.mutate(payload)}
        />
      )}
      {editingMembership && (
        <StudentMembershipEditModal
          key={editingMembership.id}
          membership={editingMembership}
          open
          onOpenChange={(open) => { if (!open) setEditingMembership(null); }}
          students={students}
          classes={classes}
          schoolYears={schoolYears}
          isPending={updateMembershipMutation.isPending}
          onSubmit={(payload) => updateMembershipMutation.mutate({ id: editingMembership.id, payload })}
        />
      )}
      {ruleModalOpen && (
        <AttendanceRuleCreateModal
          open={ruleModalOpen}
          onOpenChange={setRuleModalOpen}
          schoolYears={schoolYears}
          isPending={createRuleMutation.isPending}
          onSubmit={(payload) => createRuleMutation.mutate(payload)}
        />
      )}
      {editingRule && (
        <AttendanceRuleEditModal
          key={editingRule.id}
          rule={editingRule}
          open
          onOpenChange={(open) => { if (!open) setEditingRule(null); }}
          schoolYears={schoolYears}
          isPending={updateRuleMutation.isPending}
          onSubmit={(payload) => updateRuleMutation.mutate({ id: editingRule.id, payload })}
        />
      )}
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={getStudentDeleteTitle(deleteTarget)}
        description={getStudentDeleteDescription(deleteTarget)}
        isPending={
          deleteStudentMutation.isPending ||
          deleteMembershipMutation.isPending ||
          deleteRuleMutation.isPending
        }
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "profile") {
            deleteStudentMutation.mutate(deleteTarget.item.id);
            return;
          }
          if (deleteTarget.type === "membership") {
            deleteMembershipMutation.mutate(deleteTarget.item.id);
            return;
          }
          deleteRuleMutation.mutate(deleteTarget.item.id);
        }}
      />
    </>
  );
}

function getStudentDeleteTitle(target: StudentDeleteTarget | null) {
  if (target?.type === "profile") return "Hapus Siswa?";
  if (target?.type === "membership") return "Hapus Penempatan Kelas?";
  if (target?.type === "rule") return "Hapus Aturan Absensi?";
  return "Konfirmasi Penghapusan";
}

function getStudentDeleteDescription(target: StudentDeleteTarget | null) {
  if (!target) return "Data ini akan dihapus permanen.";
  if (target.type === "profile") {
    return `Profil siswa "${target.item.name}" akan dihapus permanen.`;
  }
  if (target.type === "membership") {
    return `Penempatan kelas "${target.item.student_name}" di ${target.item.class_name} akan dihapus permanen.`;
  }
  return `Aturan absensi tahun ajaran "${target.item.school_year}" akan dihapus permanen.`;
}
