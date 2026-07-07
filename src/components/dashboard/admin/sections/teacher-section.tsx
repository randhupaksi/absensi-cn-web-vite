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
} from "@/components/dashboard/admin/sections/section-ui";
import { HomeroomAssignmentCreateModal, HomeroomAssignmentEditModal } from "@/components/dashboard/admin/sections/teacher-homeroom-modals";
import {
  TeacherProfileCreateModal,
  TeacherProfileEditModal,
  type TeacherProfileCreatePayload,
} from "@/components/dashboard/admin/sections/teacher-profile-modals";
import { BKAssignmentModal } from "@/components/dashboard/admin/sections/teacher-bk-modals";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  createAdminHomeroomAssignment,
  createAdminTeacherAccount,
  deleteAdminHomeroomAssignment,
  deleteAdminUser,
  getAdminClasses,
  getAdminSchoolYears,
  replaceAdminBKUnitScopes,
  updateAdminHomeroomAssignment,
  updateAdminTeacherAccount,
} from "@/services/admin.service";
import type {
  AdminBKUnitScope,
  AdminHomeroomAssignment,
  AdminHomeroomAssignmentPayload,
  AdminSchoolUnit,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
} from "@/types/admin";
import type { BKScopeFormValues } from "@/lib/validations/bk-scope-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpen,
  FileSpreadsheet,
  FilePenLine,
  GraduationCap,
  IdCard,
  LayoutPanelTop,
  Printer,
  UserCog,
  UsersRound,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

const ImportExcelModal = dynamic(
  () => import("@/components/modals/import-excel-modal").then((module) => module.ImportExcelModal),
  { ssr: false },
);

const GuruReportModal = dynamic(
  () => import("@/components/reports/admin/guru-report-modal").then((module) => module.GuruReportModal),
  { ssr: false },
);

type TeacherSectionProps = {
  teacherProfiles: AdminTeacherProfile[];
  teacherSubjectAssignments: AdminTeacherSubjectAssignment[];
  homeroomAssignments: AdminHomeroomAssignment[];
  schoolUnits: AdminSchoolUnit[];
  bkUnitScopes: AdminBKUnitScope[];
  isLoading?: boolean;
  errorMessage?: string;
};

const profileStatusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

type TeacherTab = "profiles" | "homerooms" | "bk";

type TeacherDeleteTarget =
  | { type: "profile"; item: AdminTeacherProfile }
  | { type: "homeroom"; item: AdminHomeroomAssignment };

export function TeacherSection({
  teacherProfiles,
  teacherSubjectAssignments,
  homeroomAssignments,
  schoolUnits,
  bkUnitScopes,
  isLoading = false,
  errorMessage,
}: TeacherSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [activeTab, setActiveTab] = useState<TeacherTab>("profiles");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [homeroomModalOpen, setHomeroomModalOpen] = useState(false);
  const [bkModalOpen, setBkModalOpen] = useState(false);
  const [editingBkTeacher, setEditingBkTeacher] = useState<AdminTeacherProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<AdminTeacherProfile | null>(null);
  const [editingHomeroomAssignment, setEditingHomeroomAssignment] =
    useState<AdminHomeroomAssignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherDeleteTarget | null>(null);
  const [revokeBkTarget, setRevokeBkTarget] = useState<AdminTeacherProfile | null>(null);

  const classesQuery = useQuery({
    queryKey: ["admin-classes"],
    queryFn: () => getAdminClasses(),
  });
  const schoolYearsQuery = useQuery({
    queryKey: ["admin-school-years"],
    queryFn: getAdminSchoolYears,
  });

  const createTeacherProfileMutation = useMutation({
    mutationFn: createAdminTeacherAccount,
    onSuccess: () => {
      toast.success("Akun dan profil guru baru berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setProfileModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createHomeroomAssignmentMutation = useMutation({
    mutationFn: createAdminHomeroomAssignment,
    onSuccess: () => {
      toast.success("Assignment wali kelas berhasil dibuat.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
      setHomeroomModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateTeacherProfileMutation = useMutation({
    mutationFn: async (payload: TeacherProfileCreatePayload) => {
      if (!editingProfile) {
        throw new Error("Profil guru tidak ditemukan.");
      }

      return updateAdminTeacherAccount(editingProfile.id, payload);
    },
    onSuccess: () => {
      toast.success("Profil guru berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingProfile(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTeacherProfileMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("Data guru berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-teacher-subject-assignments"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-bk-unit-scopes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateHomeroomAssignmentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminHomeroomAssignmentPayload;
    }) => updateAdminHomeroomAssignment(id, payload),
    onSuccess: () => {
      toast.success("Assignment walas berhasil diperbarui.");
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
      setEditingHomeroomAssignment(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteHomeroomAssignmentMutation = useMutation({
    mutationFn: deleteAdminHomeroomAssignment,
    onSuccess: () => {
      toast.success("Assignment walas berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin-homeroom-assignments"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveBkAssignmentMutation = useMutation({
    mutationFn: (values: BKScopeFormValues) =>
      replaceAdminBKUnitScopes(values.user_id, values.school_unit_ids),
    onSuccess: () => {
      toast.success("Penempatan BK berhasil disimpan.");
      setBkModalOpen(false);
      setEditingBkTeacher(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-bk-unit-scopes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeBkAssignmentMutation = useMutation({
    mutationFn: (teacher: AdminTeacherProfile) =>
      replaceAdminBKUnitScopes(teacher.user_id, []),
    onSuccess: () => {
      toast.success("Penempatan BK berhasil dicabut.");
      setRevokeBkTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-bk-unit-scopes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const bkScopesByUser = useMemo(
    () => bkUnitScopes.reduce<Record<string, AdminBKUnitScope[]>>((result, scope) => {
      (result[scope.user_id] ??= []).push(scope);
      return result;
    }, {}),
    [bkUnitScopes],
  );
  const bkTeachers = useMemo(
    () => teacherProfiles.filter((teacher) => (bkScopesByUser[teacher.user_id]?.length ?? 0) > 0),
    [bkScopesByUser, teacherProfiles],
  );
  const eligibleTeachersForBk = useMemo(
    () => teacherProfiles.filter((teacher) => teacher.is_active && !bkScopesByUser[teacher.user_id]?.length),
    [bkScopesByUser, teacherProfiles],
  );

  const subjectAssignmentsByTeacher = useMemo(() => {
    return teacherSubjectAssignments.reduce<Record<string, number>>(
      (accumulator, assignment) => {
        accumulator[assignment.teacher_id] =
          (accumulator[assignment.teacher_id] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
  }, [teacherSubjectAssignments]);

  const homeroomAssignmentsByTeacher = useMemo(() => {
    return homeroomAssignments.reduce<Record<string, number>>(
      (accumulator, assignment) => {
        accumulator[assignment.teacher_id] =
          (accumulator[assignment.teacher_id] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
  }, [homeroomAssignments]);

  const filteredTeacherProfiles = useMemo(
    () =>
      teacherProfiles.filter((teacher) => {
        const matchesStatus =
          statusFilter === "Semua" ||
          (statusFilter === "Aktif" && teacher.is_active) ||
          (statusFilter === "Nonaktif" && !teacher.is_active);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          teacher.name.toLowerCase().includes(normalizedQuery) ||
          (teacher.username ?? "").toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      }),
    [teacherProfiles, statusFilter, normalizedQuery],
  );

  const filteredHomeroomAssignments = useMemo(
    () =>
      homeroomAssignments.filter(
        (assignment) =>
          normalizedQuery.length === 0 ||
          assignment.teacher_name.toLowerCase().includes(normalizedQuery) ||
          assignment.class_name.toLowerCase().includes(normalizedQuery) ||
          assignment.school_year_name.toLowerCase().includes(normalizedQuery),
      ),
    [homeroomAssignments, normalizedQuery],
  );

  const filteredBkTeachers = useMemo(
    () =>
      bkTeachers.filter(
        (teacher) =>
          normalizedQuery.length === 0 ||
          teacher.name.toLowerCase().includes(normalizedQuery) ||
          (teacher.username ?? "").toLowerCase().includes(normalizedQuery),
      ),
    [bkTeachers, normalizedQuery],
  );

  const activeTeacherCount = teacherProfiles.filter(
    (teacher) => teacher.is_active,
  ).length;
  const totalHomeroomAssignments = homeroomAssignments.length;
  const activeHomeroomAssignments = homeroomAssignments.filter(
    (assignment) => assignment.is_active,
  ).length;

  const kpiCards = useMemo(() => {
    if (activeTab === "bk") {
      return [
        {
          label: "Total Akun BK",
          value: bkTeachers.length,
          icon: UserCog,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
        {
          label: "Guru Tersedia",
          value: eligibleTeachersForBk.length,
          icon: UsersRound,
          accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
        },
      ];
    }

    if (activeTab === "homerooms") {
      return [
        {
          label: "Total Assignment",
          value: totalHomeroomAssignments,
          icon: GraduationCap,
          accentClass: "from-amber-400 via-orange-400 to-emerald-500",
        },
        {
          label: "Walas Aktif",
          value: activeHomeroomAssignments,
          icon: BadgeCheck,
          accentClass: "from-emerald-500 via-teal-500 to-green-500",
        },
        {
          label: "Guru Walas",
          value: new Set(homeroomAssignments.map((assignment) => assignment.teacher_id)).size,
          icon: UsersRound,
          accentClass: "from-teal-500 via-emerald-500 to-lime-500",
        },
        {
          label: "Kelas Berwali",
          value: new Set(homeroomAssignments.map((assignment) => assignment.class_id)).size,
          icon: BookOpen,
          accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
        },
      ];
    }

    return [
      {
        label: "Total Guru",
        value: teacherProfiles.length,
        icon: UsersRound,
        accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
      },
      {
        label: "Guru Aktif",
        value: activeTeacherCount,
        icon: BadgeCheck,
        accentClass: "from-emerald-500 via-teal-500 to-green-500",
      },
      {
        label: "Guru Mapel",
        value: new Set(teacherSubjectAssignments.map((assignment) => assignment.teacher_id)).size,
        icon: IdCard,
        accentClass: "from-teal-500 via-emerald-500 to-lime-500",
      },
      {
        label: "Guru Walas",
        value: new Set(homeroomAssignments.map((assignment) => assignment.teacher_id)).size,
        icon: FilePenLine,
        accentClass: "from-amber-400 via-orange-400 to-emerald-500",
      },
    ];
  }, [
    activeHomeroomAssignments,
    activeTab,
    activeTeacherCount,
    bkTeachers.length,
    eligibleTeachersForBk.length,
    homeroomAssignments,
    teacherSubjectAssignments,
    teacherProfiles,
    totalHomeroomAssignments,
  ]);

  const addActionConfig = {
    profiles: {
      label: "Profil Guru",
      onClick: () => setProfileModalOpen(true),
    },
    homerooms: {
      label: "Wali Kelas",
      onClick: () => setHomeroomModalOpen(true),
    },
    bk: {
      label: "BK",
      onClick: () => setBkModalOpen(true),
    },
  } satisfies Record<
    TeacherTab,
    { label: string; onClick: () => void }
  >;

  const activeAction = addActionConfig[activeTab];

  return (
    <>
      <section
        id="guru"
        className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6"
      >
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-sky-200/20 blur-3xl" />

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TeacherTab)}
        >
        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-8 sm:gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <LayoutPanelTop className="size-3.5" />
                Teacher Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Teacher Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Profil guru dan penugasan wali kelas dengan tampilan kerja yang
                  lebih rapi untuk operasional harian. Jadwal mengajar dikelola
                  terpusat melalui Manajemen Mapel.
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
              { value: "profiles", label: "Profil Guru", icon: UsersRound },
              { value: "homerooms", label: "Penempatan Walas", icon: GraduationCap },
              { value: "bk", label: "Penempatan BK", icon: UserCog },
            ]}
          />
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState
              icon={UsersRound}
              title="Data teacher belum bisa dimuat"
              description={errorMessage}
              compact
            />
          </div>
        ) : null}

        <div className="mt-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-xs font-medium text-slate-400">
              {activeTeacherCount} guru aktif
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari guru, mapel, kelas" />

              <div className="w-full sm:w-[190px]">
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Pilih status"
                  options={profileStatusOptions}
                  triggerClassName="h-14 rounded-[22px] pl-4"
                />
              </div>

              <AddButton label={activeAction.label} onClick={activeAction.onClick} />
            </div>
          </div>
        </div>

          <TabsContent value="profiles" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={8}
              isEmpty={filteredTeacherProfiles.length === 0}
              emptyTitle="Belum ada profil guru"
              emptyDescription="Tambahkan akun dengan role TEACHER lalu buat teacher profile agar data muncul di sini."
              icon={UsersRound}
            >
              <DataTable>
                <DataTableHeadRow labels={["Guru", "Username", "Gender", "Mapel", "Walas", "Status", "Aksi"]} />
                <DataTableBody>
                  {filteredTeacherProfiles.map((teacher) => (
                    <DataTableRow key={teacher.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#fef7ec_0%,#ecfdf5_100%)] text-xs font-semibold text-emerald-700 shadow-[0_8px_20px_rgba(22,85,58,0.08)]">
                            {getInitials(teacher.name)}
                          </span>
                          <div>
                            <p className="font-medium text-slate-700">
                              {teacher.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {teacher.user_id}
                            </p>
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell>{teacher.username || "-"}</DataTableCell>
                      <DataTableCell>
                        {teacher.gender === "MALE" ? "Laki-laki" : teacher.gender === "FEMALE" ? "Perempuan" : "-"}
                      </DataTableCell>
                      <DataTableCell>{subjectAssignmentsByTeacher[teacher.id] ?? 0}</DataTableCell>
                      <DataTableCell>{homeroomAssignmentsByTeacher[teacher.id] ?? 0}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge isActive={teacher.is_active} />
                      </DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingProfile(teacher)}
                          onDelete={() => setDeleteTarget({ type: "profile", item: teacher })}
                          isDeletePending={deleteTeacherProfileMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="homerooms" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={6}
              isEmpty={filteredHomeroomAssignments.length === 0}
              emptyTitle="Belum ada assignment walas"
              emptyDescription="Data wali kelas per tahun ajaran akan tampil di sini."
              icon={GraduationCap}
            >
              <DataTable>
                <DataTableHeadRow labels={["Guru", "Kelas", "Tahun Ajaran", "Status", "ID Assignment", "Aksi"]} />
                <DataTableBody>
                  {filteredHomeroomAssignments.map((assignment) => (
                    <DataTableRow key={assignment.id}>
                      <DataTableCell className="font-medium text-slate-700">{assignment.teacher_name}</DataTableCell>
                      <DataTableCell>{assignment.class_name}</DataTableCell>
                      <DataTableCell>{assignment.school_year_name}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge isActive={assignment.is_active} />
                      </DataTableCell>
                      <DataTableCell className="text-xs text-slate-400">{assignment.id}</DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingHomeroomAssignment(assignment)}
                          onDelete={() => setDeleteTarget({ type: "homeroom", item: assignment })}
                          isDeletePending={deleteHomeroomAssignmentMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="bk" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={4}
              isEmpty={filteredBkTeachers.length === 0}
              emptyTitle="Belum ada penempatan BK"
              emptyDescription="Tambahkan guru dan pilih unit sekolah yang menjadi cakupan monitoringnya."
              icon={UserCog}
            >
              <DataTable>
                <DataTableHeadRow labels={["Nama", "Username", "Cakupan Unit", "Aksi"]} />
                <DataTableBody>
                  {filteredBkTeachers.map((teacher) => (
                    <DataTableRow key={teacher.user_id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#fef7ec_0%,#ecfdf5_100%)] text-xs font-semibold text-emerald-700 shadow-[0_8px_20px_rgba(22,85,58,0.08)]">
                            {getInitials(teacher.name)}
                          </span>
                          <p className="font-medium text-slate-700">{teacher.name}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>{teacher.username || "-"}</DataTableCell>
                      <DataTableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {bkScopesByUser[teacher.user_id]?.map((scope) => (
                            <Badge key={scope.id} variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-700">
                              {scope.school_unit_code}
                            </Badge>
                          ))}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => {
                            setEditingBkTeacher(teacher);
                            setBkModalOpen(true);
                          }}
                          onDelete={() => setRevokeBkTarget(teacher)}
                          isDeletePending={revokeBkAssignmentMutation.isPending}
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
          type="guru"
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
            void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          }}
        />
      )}

      {reportModalOpen && (
        <GuruReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          teachers={teacherProfiles}
        />
      )}

      {profileModalOpen && (
        <TeacherProfileCreateModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          isPending={createTeacherProfileMutation.isPending}
          onSubmit={(payload) => createTeacherProfileMutation.mutate(payload)}
        />
      )}
      {editingProfile && (
        <TeacherProfileEditModal
          key={editingProfile.id}
          teacher={editingProfile}
          open
          onOpenChange={(open) => { if (!open) setEditingProfile(null); }}
          isPending={updateTeacherProfileMutation.isPending}
          onSubmit={(payload) => updateTeacherProfileMutation.mutate(payload)}
        />
      )}

      {homeroomModalOpen && (
        <HomeroomAssignmentCreateModal
          open={homeroomModalOpen}
          onOpenChange={setHomeroomModalOpen}
          teacherProfiles={teacherProfiles}
          classes={classesQuery.data ?? []}
          schoolYears={schoolYearsQuery.data ?? []}
          isPending={createHomeroomAssignmentMutation.isPending}
          onSubmit={(payload) => createHomeroomAssignmentMutation.mutate(payload)}
        />
      )}
      {editingHomeroomAssignment && (
        <HomeroomAssignmentEditModal
          key={editingHomeroomAssignment.id}
          assignment={editingHomeroomAssignment}
          open
          onOpenChange={(open) => { if (!open) setEditingHomeroomAssignment(null); }}
          teacherProfiles={teacherProfiles}
          classes={classesQuery.data ?? []}
          schoolYears={schoolYearsQuery.data ?? []}
          isPending={updateHomeroomAssignmentMutation.isPending}
          onSubmit={(payload) => updateHomeroomAssignmentMutation.mutate({ id: editingHomeroomAssignment.id, payload })}
        />
      )}
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={getTeacherDeleteTitle(deleteTarget)}
        description={getTeacherDeleteDescription(deleteTarget)}
        isPending={
          deleteTeacherProfileMutation.isPending ||
          deleteHomeroomAssignmentMutation.isPending
        }
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "profile") {
            deleteTeacherProfileMutation.mutate(deleteTarget.item.user_id);
            return;
          }
          deleteHomeroomAssignmentMutation.mutate(deleteTarget.item.id);
        }}
      />
      {bkModalOpen && (
        <BKAssignmentModal
          open={bkModalOpen}
          onOpenChange={(open) => {
            setBkModalOpen(open);
            if (!open) setEditingBkTeacher(null);
          }}
          teachers={editingBkTeacher ? [editingBkTeacher] : eligibleTeachersForBk}
          units={schoolUnits}
          initialValues={editingBkTeacher ? {
            user_id: editingBkTeacher.user_id,
            school_unit_ids: bkScopesByUser[editingBkTeacher.user_id]?.map((scope) => scope.school_unit_id) ?? [],
          } : undefined}
          isPending={saveBkAssignmentMutation.isPending}
          onSubmit={(values) => saveBkAssignmentMutation.mutate(values)}
        />
      )}
      <DeleteConfirmationModal
        open={Boolean(revokeBkTarget)}
        onOpenChange={(open) => { if (!open) setRevokeBkTarget(null); }}
        title="Cabut Penempatan BK?"
        description={revokeBkTarget ? `Capability BK untuk "${revokeBkTarget.name}" akan dicabut dari seluruh unit sekolah.` : ""}
        warning="Penugasan mapel dan wali kelas tetap tersimpan."
        confirmLabel="Ya, Cabut"
        isPending={revokeBkAssignmentMutation.isPending}
        onConfirm={() => revokeBkTarget && revokeBkAssignmentMutation.mutate(revokeBkTarget)}
      />
    </>
  );
}

function getTeacherDeleteTitle(target: TeacherDeleteTarget | null) {
  if (target?.type === "profile") return "Hapus Guru?";
  if (target?.type === "homeroom") return "Hapus Assignment Walas?";
  return "Konfirmasi Penghapusan";
}

function getTeacherDeleteDescription(target: TeacherDeleteTarget | null) {
  if (!target) return "Data ini akan dihapus permanen.";
  if (target.type === "profile") {
    return `Profil dan akun guru "${target.item.name}" akan dihapus permanen.`;
  }
  return `Assignment wali kelas "${target.item.class_name}" untuk ${target.item.teacher_name} akan dihapus permanen.`;
}
