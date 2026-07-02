"use client";

import dynamic from "@/lib/dynamic";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { ScrollableTabsWrapper } from "@/components/dashboard/admin/widgets/scrollable-tabs";
import {
  ActionButtons,
  DataTableCard,
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
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAdminHomeroomAssignment,
  createAdminTeacherAccount,
  deleteAdminHomeroomAssignment,
  deleteAdminUser,
  getAdminClasses,
  getAdminSchoolYears,
  updateAdminHomeroomAssignment,
  updateAdminTeacherAccount,
} from "@/services/admin.service";
import type {
  AdminHomeroomAssignment,
  AdminHomeroomAssignmentPayload,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
} from "@/types/admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpen,
  FileSpreadsheet,
  FilePenLine,
  GraduationCap,
  IdCard,
  LayoutPanelTop,
  Plus,
  Search,
  Printer,
  SlidersHorizontal,
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
  isLoading?: boolean;
  errorMessage?: string;
};

const profileStatusOptions = [
  { value: "Semua", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

type TeacherTab = "profiles" | "homerooms";

type TeacherDeleteTarget =
  | { type: "profile"; item: AdminTeacherProfile }
  | { type: "homeroom"; item: AdminHomeroomAssignment };

export function TeacherSection({
  teacherProfiles,
  teacherSubjectAssignments,
  homeroomAssignments,
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
  const [editingProfile, setEditingProfile] = useState<AdminTeacherProfile | null>(null);
  const [editingHomeroomAssignment, setEditingHomeroomAssignment] =
    useState<AdminHomeroomAssignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherDeleteTarget | null>(null);

  const classesQuery = useQuery({
    queryKey: ["admin-classes"],
    queryFn: getAdminClasses,
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

  const normalizedQuery = deferredQuery.trim().toLowerCase();

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

  const activeTeacherCount = teacherProfiles.filter(
    (teacher) => teacher.is_active,
  ).length;
  const totalHomeroomAssignments = homeroomAssignments.length;
  const activeHomeroomAssignments = homeroomAssignments.filter(
    (assignment) => assignment.is_active,
  ).length;

  const kpiCards = useMemo(() => {
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
    homeroomAssignments,
    teacherSubjectAssignments,
    teacherProfiles,
    totalHomeroomAssignments,
  ]);

  const addActionConfig = {
    profiles: {
      label: "Tambah",
      onClick: () => setProfileModalOpen(true),
    },
    homerooms: {
      label: "Tambah",
      onClick: () => setHomeroomModalOpen(true),
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

        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:gap-6">
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

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-xs font-medium text-slate-400">
              {activeTeacherCount} guru aktif
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="flex h-14 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                  <SlidersHorizontal className="size-4" />
                </span>
                <Search className="size-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari guru, mapel, kelas, NIP, NUPTK"
                  className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[240px]"
                />
              </div>

              <div className="w-full sm:w-[190px]">
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Pilih status"
                  options={profileStatusOptions}
                  triggerClassName="h-14 rounded-[22px] pl-4"
                />
              </div>

              <Button
                variant="outline"
                className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950"
                onClick={activeAction.onClick}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
                  <Plus className="size-4" />
                </span>
                {activeAction.label}
              </Button>
            </div>
          </div>
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

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TeacherTab)}
          className="mt-5 gap-4"
        >
          <ScrollableTabsWrapper>
            <TabsList className="flex min-w-max gap-2 rounded-[24px] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(242,250,246,0.92)_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_30px_rgba(15,23,42,0.04)] xl:min-w-0 xl:grid xl:w-full xl:grid-cols-2">
              <TabsTrigger
                value="profiles"
                className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full"
              >
                <UsersRound className="size-4" />
                Profil Guru
              </TabsTrigger>
              <TabsTrigger
                value="homerooms"
                className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full"
              >
                <GraduationCap className="size-4" />
                Penempatan Walas
              </TabsTrigger>
            </TabsList>
          </ScrollableTabsWrapper>

          <TabsContent value="profiles" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={8}
              isEmpty={filteredTeacherProfiles.length === 0}
              emptyTitle="Belum ada profil guru"
              emptyDescription="Tambahkan akun dengan role TEACHER lalu buat teacher profile agar data muncul di sini."
              icon={UsersRound}
            >
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {[
                      "Guru",
                      "Username",
                      "Gender",
                      "Mapel",
                      "Walas",
                      "Status",
                      "Aksi",
                    ].map((label) => (
                      <th
                        key={label}
                        className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeacherProfiles.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30"
                    >
                      <td className="border-t border-slate-100 px-4 py-4">
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
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        {teacher.username || "-"}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        {teacher.gender === "MALE" ? "Laki-laki" : teacher.gender === "FEMALE" ? "Perempuan" : "-"}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        {subjectAssignmentsByTeacher[teacher.id] ?? 0}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        {homeroomAssignmentsByTeacher[teacher.id] ?? 0}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <StatusBadge isActive={teacher.is_active} />
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <ActionButtons
                          onEdit={() => setEditingProfile(teacher)}
                          onDelete={() => setDeleteTarget({ type: "profile", item: teacher })}
                          isDeletePending={deleteTeacherProfileMutation.isPending}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {[
                      "Guru",
                      "Kelas",
                      "Tahun Ajaran",
                      "Status",
                      "ID Assignment",
                      "Aksi",
                    ].map((label) => (
                      <th
                        key={label}
                        className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHomeroomAssignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30"
                    >
                      <td className="border-t border-slate-100 px-4 py-4 font-medium text-slate-700">
                        {assignment.teacher_name}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        {assignment.class_name}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        {assignment.school_year_name}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <StatusBadge isActive={assignment.is_active} />
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4 text-xs text-slate-400">
                        {assignment.id}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <ActionButtons
                          onEdit={() => setEditingHomeroomAssignment(assignment)}
                          onDelete={() => setDeleteTarget({ type: "homeroom", item: assignment })}
                          isDeletePending={deleteHomeroomAssignmentMutation.isPending}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableCard>
          </TabsContent>
        </Tabs>
      </section>

      <ImportExcelModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        type="guru"
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        }}
      />

      <GuruReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        teachers={teacherProfiles}
      />

      <TeacherProfileCreateModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        isPending={createTeacherProfileMutation.isPending}
        onSubmit={(payload) => createTeacherProfileMutation.mutate(payload)}
      />
      <TeacherProfileEditModal
        key={editingProfile?.id ?? "profile-closed"}
        teacher={editingProfile}
        open={Boolean(editingProfile)}
        onOpenChange={(open) => {
          if (!open) setEditingProfile(null);
        }}
        isPending={updateTeacherProfileMutation.isPending}
        onSubmit={(payload) => updateTeacherProfileMutation.mutate(payload)}
      />

      <HomeroomAssignmentCreateModal
        open={homeroomModalOpen}
        onOpenChange={setHomeroomModalOpen}
        teacherProfiles={teacherProfiles}
        classes={classesQuery.data ?? []}
        schoolYears={schoolYearsQuery.data ?? []}
        isPending={createHomeroomAssignmentMutation.isPending}
        onSubmit={(payload) => createHomeroomAssignmentMutation.mutate(payload)}
      />
      <HomeroomAssignmentEditModal
        key={editingHomeroomAssignment?.id ?? "homeroom-assignment-closed"}
        assignment={editingHomeroomAssignment}
        open={Boolean(editingHomeroomAssignment)}
        onOpenChange={(open) => {
          if (!open) setEditingHomeroomAssignment(null);
        }}
        teacherProfiles={teacherProfiles}
        classes={classesQuery.data ?? []}
        schoolYears={schoolYearsQuery.data ?? []}
        isPending={updateHomeroomAssignmentMutation.isPending}
        onSubmit={(payload) => {
          if (!editingHomeroomAssignment) return;
          updateHomeroomAssignmentMutation.mutate({
            id: editingHomeroomAssignment.id,
            payload,
          });
        }}
      />
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
