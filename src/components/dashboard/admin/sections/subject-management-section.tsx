"use client";

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
import { SubjectFormModal, TeachingAssignmentFormModal } from "@/components/dashboard/admin/sections/subject-management-modals";
import { RoomModal, ScheduleOverrideModal } from "@/components/dashboard/admin/sections/academic-operations-modals";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { SubjectFormValues, TeachingAssignmentFormValues } from "@/lib/validations/subject-schema";
import type { RoomFormValues, ScheduleOverrideFormValues } from "@/lib/validations/academic-operations-schema";
import {
  createAdminSubject,
  createAdminTeacherSubjectAssignment,
  createAdminRoom,
  createAdminScheduleOverride,
  deleteAdminSubject,
  deleteAdminTeacherSubjectAssignment,
  deleteAdminRoom,
  deleteAdminScheduleOverride,
  updateAdminSubject,
  updateAdminTeacherSubjectAssignment,
  updateAdminRoom,
  updateAdminScheduleOverride,
} from "@/services/admin.service";
import type {
  AdminClass,
  AdminMajor,
  AdminRoom,
  AdminScheduleOverride,
  AdminSchoolUnit,
  AdminSchoolYear,
  AdminSubject,
  AdminSubjectScheduleOverview,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
} from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenCheck,
  CalendarClock,
  CalendarSync,
  DoorOpen,
  GraduationCap,
  Layers3,
  LayoutPanelTop,
  UsersRound,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type SubjectManagementSectionProps = {
  subjects: AdminSubject[];
  schedules: AdminSubjectScheduleOverview[];
  assignments: AdminTeacherSubjectAssignment[];
  teachers: AdminTeacherProfile[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  programs: AdminMajor[];
  rooms: AdminRoom[];
  overrides: AdminScheduleOverride[];
  schoolUnits: AdminSchoolUnit[];
  isLoading: boolean;
  errorMessage?: string;
};

type ManagementTab = "subjects" | "schedules" | "rooms" | "overrides";

const ADD_LABELS: Record<ManagementTab, string> = {
  subjects: "Mapel",
  schedules: "Jadwal",
  rooms: "Ruangan",
  overrides: "Perubahan Jadwal",
};

export function SubjectManagementSection({
  subjects,
  schedules,
  assignments,
  teachers,
  classes,
  schoolYears,
  programs,
  rooms,
  overrides,
  schoolUnits,
  isLoading,
  errorMessage,
}: SubjectManagementSectionProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ManagementTab>("subjects");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [schoolYearFilter, setSchoolYearFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AdminSubject | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AdminTeacherSubjectAssignment | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<AdminRoom | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<AdminScheduleOverride | null>(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<AdminSubject | null>(null);
  const [deleteAssignmentTarget, setDeleteAssignmentTarget] = useState<AdminTeacherSubjectAssignment | null>(null);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<AdminRoom | null>(null);
  const [deleteOverrideTarget, setDeleteOverrideTarget] = useState<AdminScheduleOverride | null>(null);

  const invalidateMapelData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-subject-schedules"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-subject-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-overrides"] }),
      queryClient.invalidateQueries({ queryKey: ["teacher-subject-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["subject-current-session"] }),
    ]);
  };

  const createSubjectMutation = useMutation({
    mutationFn: createAdminSubject,
    onSuccess: async () => {
      toast.success("Mapel berhasil ditambahkan.");
      setSubjectModalOpen(false);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SubjectFormValues }) => updateAdminSubject(id, values),
    onSuccess: async () => {
      toast.success("Mapel berhasil diperbarui.");
      setEditingSubject(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteSubjectMutation = useMutation({
    mutationFn: deleteAdminSubject,
    onSuccess: async () => {
      toast.success("Mapel berhasil dihapus.");
      setDeleteSubjectTarget(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const createAssignmentMutation = useMutation({
    mutationFn: createAdminTeacherSubjectAssignment,
    onSuccess: async () => {
      toast.success("Jadwal mengajar berhasil ditambahkan.");
      setAssignmentModalOpen(false);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TeachingAssignmentFormValues }) => updateAdminTeacherSubjectAssignment(id, values),
    onSuccess: async () => {
      toast.success("Jadwal mengajar berhasil diperbarui.");
      setEditingAssignment(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteAssignmentMutation = useMutation({
    mutationFn: deleteAdminTeacherSubjectAssignment,
    onSuccess: async () => {
      toast.success("Penempatan jadwal berhasil dihapus.");
      setDeleteAssignmentTarget(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const createRoomMutation = useMutation({
    mutationFn: createAdminRoom,
    onSuccess: async () => {
      toast.success("Ruangan berhasil ditambahkan.");
      setRoomModalOpen(false);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateRoomMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: RoomFormValues }) => updateAdminRoom(id, values),
    onSuccess: async () => {
      toast.success("Ruangan berhasil diperbarui.");
      setEditingRoom(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteRoomMutation = useMutation({
    mutationFn: deleteAdminRoom,
    onSuccess: async () => {
      toast.success("Ruangan berhasil dihapus.");
      setDeleteRoomTarget(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const createOverrideMutation = useMutation({
    mutationFn: createAdminScheduleOverride,
    onSuccess: async () => {
      toast.success("Perubahan jadwal berhasil ditambahkan.");
      setOverrideModalOpen(false);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateOverrideMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ScheduleOverrideFormValues }) => updateAdminScheduleOverride(id, values),
    onSuccess: async () => {
      toast.success("Perubahan jadwal berhasil diperbarui.");
      setEditingOverride(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteOverrideMutation = useMutation({
    mutationFn: deleteAdminScheduleOverride,
    onSuccess: async () => {
      toast.success("Perubahan jadwal berhasil dihapus.");
      setDeleteOverrideTarget(null);
      await invalidateMapelData();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredSubjects = useMemo(() => subjects.filter((subject) => {
    const matchesQuery = !normalizedQuery || `${subject.code} ${subject.name} ${subject.group ?? ""}`.toLowerCase().includes(normalizedQuery);
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? subject.is_active : !subject.is_active);
    return matchesQuery && matchesStatus;
  }), [normalizedQuery, statusFilter, subjects]);

  const matchingAssignmentIDs = useMemo(() => new Set(schedules.filter((schedule) => {
    const matchesDay = dayFilter === "all" || schedule.hari === dayFilter;
    const matchesYear = schoolYearFilter === "all" || schedule.school_year_id === schoolYearFilter;
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? schedule.is_active : !schedule.is_active);
    const matchesTeacher = teacherFilter === "all" || schedule.teacher_id === teacherFilter;
    const matchesSubject = subjectFilter === "all" || schedule.subject_id === subjectFilter;
    const matchesClass = classFilter === "all" || schedule.class_id === classFilter;
    const matchesQuery = !normalizedQuery || `${schedule.teacher_name} ${schedule.subject_code} ${schedule.subject_name} ${schedule.class_name}`.toLowerCase().includes(normalizedQuery);
    return matchesDay && matchesYear && matchesStatus && matchesTeacher && matchesSubject && matchesClass && matchesQuery;
  }).map((schedule) => schedule.assignment_id)), [classFilter, dayFilter, normalizedQuery, schedules, schoolYearFilter, statusFilter, subjectFilter, teacherFilter]);

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    if (assignment.schedules.length === 0) {
      const matchesQuery = !normalizedQuery || `${assignment.teacher_name} ${assignment.subject_code} ${assignment.subject_name} ${assignment.class_name}`.toLowerCase().includes(normalizedQuery);
      const matchesYear = schoolYearFilter === "all" || assignment.school_year_id === schoolYearFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? assignment.is_active : !assignment.is_active);
      const matchesTeacher = teacherFilter === "all" || assignment.teacher_id === teacherFilter;
      const matchesSubject = subjectFilter === "all" || assignment.subject_id === subjectFilter;
      const matchesClass = classFilter === "all" || assignment.class_id === classFilter;
      return dayFilter === "all" && matchesQuery && matchesYear && matchesStatus && matchesTeacher && matchesSubject && matchesClass;
    }
    return matchingAssignmentIDs.has(assignment.id);
  }), [assignments, classFilter, dayFilter, matchingAssignmentIDs, normalizedQuery, schoolYearFilter, statusFilter, subjectFilter, teacherFilter]);

  const activeSubjects = subjects.filter((s) => s.is_active).length;
  const activeSchedules = schedules.filter((s) => s.is_active).length;
  const scheduledTeachers = new Set(schedules.filter((s) => s.is_active).map((s) => s.teacher_id)).size;
  const scheduledClasses = new Set(schedules.filter((s) => s.is_active).map((s) => s.class_id)).size;

  const activeRooms = rooms.filter((r) => r.is_active).length;
  const activeOverrides = overrides.filter((o) => o.status === "ACTIVE").length;

  const { pageItems: pageSubjects, pagination: subjectsPagination } = usePagination(filteredSubjects);
  const { pageItems: pageAssignments, pagination: assignmentsPagination } = usePagination(filteredAssignments);
  const { pageItems: pageRooms, pagination: roomsPagination } = usePagination(rooms);
  const { pageItems: pageOverrides, pagination: overridesPagination } = usePagination(overrides);

  const kpiCards = useMemo(() => {
    if (activeTab === "schedules") {
      return [
        { label: "Total Penempatan", value: assignments.length, icon: CalendarClock, accentClass: "from-emerald-500 via-teal-500 to-cyan-500" },
        { label: "Jadwal Aktif", value: activeSchedules, icon: BookOpenCheck, accentClass: "from-emerald-500 via-teal-500 to-green-500" },
        { label: "Guru Terjadwal", value: scheduledTeachers, icon: UsersRound, accentClass: "from-sky-500 via-cyan-500 to-emerald-500" },
        { label: "Kelas Terjadwal", value: scheduledClasses, icon: GraduationCap, accentClass: "from-violet-500 via-purple-500 to-indigo-500" },
      ];
    }
    if (activeTab === "rooms") {
      return [
        { label: "Total Ruangan", value: rooms.length, icon: DoorOpen, accentClass: "from-sky-500 via-cyan-500 to-emerald-500" },
        { label: "Ruangan Aktif", value: activeRooms, icon: DoorOpen, accentClass: "from-emerald-500 via-teal-500 to-green-500" },
      ];
    }
    if (activeTab === "overrides") {
      return [
        { label: "Total Perubahan", value: overrides.length, icon: CalendarSync, accentClass: "from-amber-400 via-orange-400 to-emerald-500" },
        { label: "Perubahan Aktif", value: activeOverrides, icon: CalendarSync, accentClass: "from-emerald-500 via-teal-500 to-green-500" },
      ];
    }
    return [
      { label: "Total Mapel", value: subjects.length, icon: BookOpenCheck, accentClass: "from-emerald-500 via-teal-500 to-cyan-500" },
      { label: "Mapel Aktif", value: activeSubjects, icon: Layers3, accentClass: "from-emerald-500 via-teal-500 to-green-500" },
      { label: "Guru Terjadwal", value: scheduledTeachers, icon: UsersRound, accentClass: "from-sky-500 via-cyan-500 to-emerald-500" },
      { label: "Kelas Terjadwal", value: scheduledClasses, icon: GraduationCap, accentClass: "from-violet-500 via-purple-500 to-indigo-500" },
    ];
  }, [activeTab, activeSchedules, activeSubjects, activeRooms, activeOverrides, assignments.length, rooms.length, overrides.length, scheduledClasses, scheduledTeachers, subjects.length]);

  return (
    <>
      <section
        id="mapel"
        className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6"
      >
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-sky-200/20 blur-3xl" />

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as ManagementTab);
            setQuery("");
            setStatusFilter("all");
            setDayFilter("all");
            setSchoolYearFilter("all");
            setTeacherFilter("all");
            setSubjectFilter("all");
            setClassFilter("all");
          }}
        >
        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-8 sm:gap-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
              <LayoutPanelTop className="size-3.5" />
              Akademik Workspace
            </div>
            <div className="space-y-2">
              <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                Manajemen Mapel
              </h2>
              <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                Kelola master mata pelajaran, guru pengajar, kelas, ruangan, dan perubahan jadwal dalam satu alur yang terhubung.
              </p>
            </div>
          </div>

          {/* KPI Cards */}
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

          {/* Tab selector */}
          <SectionTabSwitch
            tabs={[
              { value: "subjects", label: "Master Mapel", icon: BookOpenCheck },
              { value: "schedules", label: "Jadwal Mengajar", icon: CalendarClock },
              { value: "rooms", label: "Ruangan", icon: DoorOpen },
              { value: "overrides", label: "Perubahan Jadwal", icon: CalendarSync },
            ]}
          />
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState icon={BookOpenCheck} title="Data mapel belum dapat dimuat" description={errorMessage} compact />
          </div>
        ) : null}

        <div className="mt-3">
          {/* Filter toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {(activeTab === "subjects" || activeTab === "schedules") && (
              <>
                <SearchFilterBar
                  value={query}
                  onChange={setQuery}
                  placeholder={activeTab === "subjects" ? "Cari kode, nama, atau kelompok mapel…" : "Cari guru, mapel, atau kelas…"}
                />

                <div className="w-full sm:w-[190px]">
                  <RadixSelectField
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="Semua status"
                    options={statusOptions}
                    triggerClassName="h-14 rounded-[22px] pl-4"
                  />
                </div>
              </>
            )}

            <AddButton
              label={ADD_LABELS[activeTab]}
              onClick={() => {
                if (activeTab === "subjects") setSubjectModalOpen(true);
                else if (activeTab === "schedules") setAssignmentModalOpen(true);
                else if (activeTab === "rooms") setRoomModalOpen(true);
                else setOverrideModalOpen(true);
              }}
            />
          </div>

          {/* Additional filters for schedules tab */}
          {activeTab === "schedules" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <RadixSelectField value={dayFilter} onValueChange={setDayFilter} placeholder="Semua hari" options={dayOptions} triggerClassName="h-12 rounded-[18px]" />
              <RadixSelectField value={schoolYearFilter} onValueChange={setSchoolYearFilter} placeholder="Semua tahun ajaran" options={[{ value: "all", label: "Semua tahun ajaran" }, ...schoolYears.map((y) => ({ value: y.id, label: y.name }))]} triggerClassName="h-12 rounded-[18px]" />
              <RadixSelectField value={teacherFilter} onValueChange={setTeacherFilter} placeholder="Semua guru" options={[{ value: "all", label: "Semua guru" }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]} triggerClassName="h-12 rounded-[18px]" />
              <RadixSelectField value={subjectFilter} onValueChange={setSubjectFilter} placeholder="Semua mapel" options={[{ value: "all", label: "Semua mapel" }, ...subjects.map((s) => ({ value: s.id, label: s.name, description: s.code }))]} triggerClassName="h-12 rounded-[18px]" />
              <RadixSelectField value={classFilter} onValueChange={setClassFilter} placeholder="Semua kelas" options={[{ value: "all", label: "Semua kelas" }, ...classes.map((c) => ({ value: c.id, label: c.display_name }))]} triggerClassName="h-12 rounded-[18px]" />
            </div>
          )}

          {/* Master Mapel tab */}
          <TabsContent value="subjects" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={7}
              isEmpty={filteredSubjects.length === 0}
              emptyTitle="Mapel tidak ditemukan"
              emptyDescription="Tambahkan master mapel baru atau ubah filter pencarian."
              icon={BookOpenCheck}
              pagination={subjectsPagination}
            >
              <DataTable>
                <DataTableHeadRow labels={["Kode", "Mata Pelajaran", "Guru", "Kelas", "Slot Jadwal", "Status", "Aksi"]} />
                <DataTableBody>
                  {pageSubjects.map((subject) => (
                    <DataTableRow key={subject.id}>
                      <DataTableCell>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 font-mono text-xs text-slate-600">
                          {subject.code}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <p className="font-medium text-slate-700">{subject.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{subject.group || "Tanpa kelompok"}</p>
                      </DataTableCell>
                      <DataTableCell className="text-slate-700">{subject.teacher_count}</DataTableCell>
                      <DataTableCell className="text-slate-700">{subject.class_count}</DataTableCell>
                      <DataTableCell className="text-slate-700">{subject.schedule_count}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge isActive={subject.is_active} />
                      </DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingSubject(subject)}
                          onDelete={() => setDeleteSubjectTarget(subject)}
                          isDeletePending={deleteSubjectMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>

          {/* Jadwal Mengajar tab */}
          <TabsContent value="schedules" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={7}
              isEmpty={filteredAssignments.length === 0}
              emptyTitle="Jadwal mengajar tidak ditemukan"
              emptyDescription="Tambahkan penempatan guru dan slot jadwal, atau ubah filter pencarian."
              icon={CalendarClock}
              pagination={assignmentsPagination}
            >
              <DataTable>
                <DataTableHeadRow labels={["Guru", "Mata Pelajaran", "Kelas", "Jadwal", "Tahun Ajaran", "Status", "Aksi"]} />
                <DataTableBody>
                  {pageAssignments.map((assignment) => (
                    <DataTableRow key={assignment.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#fef7ec_0%,#ecfdf5_100%)] text-xs font-semibold text-emerald-700 shadow-[0_8px_20px_rgba(22,85,58,0.08)]">
                            {getInitials(assignment.teacher_name)}
                          </span>
                          <p className="font-medium text-slate-700">{assignment.teacher_name}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <p className="text-slate-700">{assignment.subject_name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{assignment.subject_code}</p>
                      </DataTableCell>
                      <DataTableCell className="text-slate-700">{assignment.class_name}</DataTableCell>
                      <DataTableCell>
                        {assignment.schedules.length > 0 ? (
                          <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-700">
                            Sudah dijadwalkan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-rose-100 bg-rose-50 text-rose-600">
                            Belum dijadwalkan
                          </Badge>
                        )}
                      </DataTableCell>
                      <DataTableCell className="text-slate-700">{assignment.school_year_name}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge isActive={assignment.is_active} />
                      </DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingAssignment(assignment)}
                          onDelete={() => setDeleteAssignmentTarget(assignment)}
                          isDeletePending={deleteAssignmentMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>

          {/* Ruangan tab */}
          <TabsContent value="rooms" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={6}
              isEmpty={rooms.length === 0}
              emptyTitle="Belum ada ruangan"
              emptyDescription="Tambahkan ruang yang dapat dipakai jadwal."
              icon={DoorOpen}
              pagination={roomsPagination}
            >
              <DataTable>
                <DataTableHeadRow labels={["Kode", "Nama", "Unit", "Tipe", "Kapasitas", "Aksi"]} />
                <DataTableBody>
                  {pageRooms.map((item) => (
                    <DataTableRow key={item.id}>
                      <DataTableCell><b>{item.code}</b></DataTableCell>
                      <DataTableCell>{item.name}</DataTableCell>
                      <DataTableCell><Pill>{item.school_unit_code}</Pill></DataTableCell>
                      <DataTableCell>{item.room_type}</DataTableCell>
                      <DataTableCell>{item.capacity}</DataTableCell>
                      <DataTableCell>
                        <ActionButtons
                          onEdit={() => setEditingRoom(item)}
                          onDelete={() => setDeleteRoomTarget(item)}
                          isDeletePending={deleteRoomMutation.isPending}
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>

          {/* Perubahan Jadwal tab */}
          <TabsContent value="overrides" className="mt-4">
            <DataTableCard
              isLoading={isLoading}
              columnCount={6}
              isEmpty={overrides.length === 0}
              emptyTitle="Belum ada perubahan jadwal"
              emptyDescription="Jadwal normal tetap berlaku selama tidak ada override."
              icon={CalendarSync}
              pagination={overridesPagination}
            >
              <DataTable>
                <DataTableHeadRow labels={["Jadwal", "Tanggal Asal", "Jenis", "Pengganti", "Status", "Aksi"]} />
                <DataTableBody>
                  {pageOverrides.map((item) => {
                    const schedule = schedules.find((x) => x.id === item.schedule_id);
                    return (
                      <DataTableRow key={item.id}>
                        <DataTableCell><b>{schedule?.subject_code ?? "Jadwal"}</b><small>{schedule?.class_name ?? item.schedule_id}</small></DataTableCell>
                        <DataTableCell>{item.original_date}</DataTableCell>
                        <DataTableCell><Pill>{item.override_type}</Pill></DataTableCell>
                        <DataTableCell>{item.replacement_date || item.replacement_room_id || item.substitute_teacher_id || "—"}</DataTableCell>
                        <DataTableCell><StatusBadge isActive={item.status === "ACTIVE"} /></DataTableCell>
                        <DataTableCell>
                          <ActionButtons
                            onEdit={() => setEditingOverride(item)}
                            onDelete={() => setDeleteOverrideTarget(item)}
                            isDeletePending={deleteOverrideMutation.isPending}
                          />
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            </DataTableCard>
          </TabsContent>
        </div>
        </Tabs>
      </section>

      {(subjectModalOpen || editingSubject) && (
        <SubjectFormModal
          key={editingSubject?.id ?? "subject-create"}
          subject={editingSubject}
          open
          onOpenChange={(open) => { if (!open) { setSubjectModalOpen(false); setEditingSubject(null); } }}
          isPending={createSubjectMutation.isPending || updateSubjectMutation.isPending}
          programs={programs}
          onSubmit={(values) => {
            if (createSubjectMutation.isPending || updateSubjectMutation.isPending) return;
            if (editingSubject) updateSubjectMutation.mutate({ id: editingSubject.id, values });
            else createSubjectMutation.mutate(values);
          }}
        />
      )}
      {(assignmentModalOpen || editingAssignment) && (
        <TeachingAssignmentFormModal
          key={editingAssignment?.id ?? "assignment-create"}
          assignment={editingAssignment}
          open
          onOpenChange={(open) => { if (!open) { setAssignmentModalOpen(false); setEditingAssignment(null); } }}
          teachers={teachers}
          subjects={subjects}
          classes={classes}
          schoolYears={schoolYears}
          rooms={rooms}
          isPending={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
          onSubmit={(values) => {
            if (createAssignmentMutation.isPending || updateAssignmentMutation.isPending) return;
            if (editingAssignment) updateAssignmentMutation.mutate({ id: editingAssignment.id, values });
            else createAssignmentMutation.mutate(values);
          }}
        />
      )}
      <DeleteConfirmationModal
        open={Boolean(deleteSubjectTarget)}
        onOpenChange={(open) => { if (!open) setDeleteSubjectTarget(null); }}
        title="Hapus mapel?"
        description={deleteSubjectTarget ? `${deleteSubjectTarget.code} — ${deleteSubjectTarget.name}` : ""}
        warning="Mapel yang sudah digunakan pada penempatan guru tidak dapat dihapus. Nonaktifkan mapel untuk mempertahankan histori."
        isPending={deleteSubjectMutation.isPending}
        onConfirm={() => deleteSubjectTarget && deleteSubjectMutation.mutate(deleteSubjectTarget.id)}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteAssignmentTarget)}
        onOpenChange={(open) => { if (!open) setDeleteAssignmentTarget(null); }}
        title="Hapus penempatan jadwal?"
        description={deleteAssignmentTarget ? `${deleteAssignmentTarget.teacher_name} — ${deleteAssignmentTarget.subject_name} — ${deleteAssignmentTarget.class_name}` : ""}
        warning="Penempatan yang sudah memiliki histori absensi tidak dapat dihapus. Nonaktifkan penempatan untuk menjaga histori."
        isPending={deleteAssignmentMutation.isPending}
        onConfirm={() => deleteAssignmentTarget && deleteAssignmentMutation.mutate(deleteAssignmentTarget.id)}
      />
      {(roomModalOpen || editingRoom) && (
        <RoomModal
          key={editingRoom?.id ?? "room-create"}
          open
          item={editingRoom}
          schoolUnits={schoolUnits}
          pending={createRoomMutation.isPending || updateRoomMutation.isPending}
          onOpenChange={(open) => { if (!open) { setRoomModalOpen(false); setEditingRoom(null); } }}
          onSubmit={(values) => {
            if (createRoomMutation.isPending || updateRoomMutation.isPending) return;
            if (editingRoom) updateRoomMutation.mutate({ id: editingRoom.id, values });
            else createRoomMutation.mutate(values);
          }}
        />
      )}
      {(overrideModalOpen || editingOverride) && (
        <ScheduleOverrideModal
          key={editingOverride?.id ?? "override-create"}
          open
          item={editingOverride}
          schedules={schedules}
          rooms={rooms}
          teachers={teachers}
          pending={createOverrideMutation.isPending || updateOverrideMutation.isPending}
          onOpenChange={(open) => { if (!open) { setOverrideModalOpen(false); setEditingOverride(null); } }}
          onSubmit={(values) => {
            if (createOverrideMutation.isPending || updateOverrideMutation.isPending) return;
            if (editingOverride) updateOverrideMutation.mutate({ id: editingOverride.id, values });
            else createOverrideMutation.mutate(values);
          }}
        />
      )}
      <DeleteConfirmationModal
        open={Boolean(deleteRoomTarget)}
        onOpenChange={(open) => { if (!open) setDeleteRoomTarget(null); }}
        title="Hapus ruangan?"
        description={deleteRoomTarget ? `${deleteRoomTarget.code} — ${deleteRoomTarget.name}` : ""}
        warning="Ruangan yang sudah dipakai jadwal sebaiknya dinonaktifkan dan dapat ditolak oleh server."
        isPending={deleteRoomMutation.isPending}
        onConfirm={() => deleteRoomTarget && deleteRoomMutation.mutate(deleteRoomTarget.id)}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteOverrideTarget)}
        onOpenChange={(open) => { if (!open) setDeleteOverrideTarget(null); }}
        title="Hapus perubahan jadwal?"
        description={deleteOverrideTarget ? `${deleteOverrideTarget.override_type} · ${deleteOverrideTarget.original_date}` : ""}
        warning="Data yang sudah memiliki relasi histori sebaiknya dinonaktifkan dan dapat ditolak oleh server."
        isPending={deleteOverrideMutation.isPending}
        onConfirm={() => deleteOverrideTarget && deleteOverrideMutation.mutate(deleteOverrideTarget.id)}
      />
    </>
  );
}

const statusOptions = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

const dayOptions = [
  { value: "all", label: "Semua hari" },
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
  { value: "sabtu", label: "Sabtu" },
  { value: "minggu", label: "Minggu" },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
      {children}
    </Badge>
  );
}
