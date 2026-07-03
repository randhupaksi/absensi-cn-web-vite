"use client";

import { ScrollableTabsWrapper } from "@/components/dashboard/admin/widgets/scrollable-tabs";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import {
  ActionButtons,
  DataTableCard,
  StatCard,
  StatusBadge,
  getInitials,
} from "@/components/dashboard/admin/sections/section-ui";
import { SubjectFormModal, TeachingAssignmentFormModal } from "@/components/dashboard/admin/sections/subject-management-modals";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SubjectFormValues, TeachingAssignmentFormValues } from "@/lib/validations/subject-schema";
import {
  createAdminSubject,
  createAdminTeacherSubjectAssignment,
  deleteAdminSubject,
  deleteAdminTeacherSubjectAssignment,
  updateAdminSubject,
  updateAdminTeacherSubjectAssignment,
} from "@/services/admin.service";
import type {
  AdminClass,
  AdminMajor,
  AdminRoom,
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
  GraduationCap,
  Layers3,
  LayoutPanelTop,
  Plus,
  Search,
  SlidersHorizontal,
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
  isLoading: boolean;
  errorMessage?: string;
};

type ManagementTab = "subjects" | "schedules";

export function SubjectManagementSection({
  subjects,
  schedules,
  assignments,
  teachers,
  classes,
  schoolYears,
  programs,
  rooms,
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
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<AdminSubject | null>(null);
  const [deleteAssignmentTarget, setDeleteAssignmentTarget] = useState<AdminTeacherSubjectAssignment | null>(null);

  const invalidateMapelData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-subject-schedules"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-subject-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-profiles"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] }),
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

  const kpiCards = useMemo(() => {
    if (activeTab === "schedules") {
      return [
        { label: "Total Penempatan", value: assignments.length, icon: CalendarClock, accentClass: "from-emerald-500 via-teal-500 to-cyan-500" },
        { label: "Jadwal Aktif", value: activeSchedules, icon: BookOpenCheck, accentClass: "from-emerald-500 via-teal-500 to-green-500" },
        { label: "Guru Terjadwal", value: scheduledTeachers, icon: UsersRound, accentClass: "from-sky-500 via-cyan-500 to-emerald-500" },
        { label: "Kelas Terjadwal", value: scheduledClasses, icon: GraduationCap, accentClass: "from-violet-500 via-purple-500 to-indigo-500" },
      ];
    }
    return [
      { label: "Total Mapel", value: subjects.length, icon: BookOpenCheck, accentClass: "from-emerald-500 via-teal-500 to-cyan-500" },
      { label: "Mapel Aktif", value: activeSubjects, icon: Layers3, accentClass: "from-emerald-500 via-teal-500 to-green-500" },
      { label: "Guru Terjadwal", value: scheduledTeachers, icon: UsersRound, accentClass: "from-sky-500 via-cyan-500 to-emerald-500" },
      { label: "Kelas Terjadwal", value: scheduledClasses, icon: GraduationCap, accentClass: "from-violet-500 via-purple-500 to-indigo-500" },
    ];
  }, [activeTab, activeSchedules, activeSubjects, assignments.length, scheduledClasses, scheduledTeachers, subjects.length]);

  return (
    <>
      <section
        id="mapel"
        className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6"
      >
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-sky-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:gap-6">
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
                Kelola master mata pelajaran, guru pengajar, kelas, dan slot jadwal dalam satu alur yang terhubung.
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

          {/* Filter toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex h-14 flex-1 items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                <SlidersHorizontal className="size-4" />
              </span>
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={activeTab === "subjects" ? "Cari kode, nama, atau kelompok mapel…" : "Cari guru, mapel, atau kelas…"}
                className="w-full min-w-[160px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="w-full sm:w-[190px]">
              <RadixSelectField
                value={statusFilter}
                onValueChange={setStatusFilter}
                placeholder="Semua status"
                options={statusOptions}
                triggerClassName="h-14 rounded-[22px] pl-4"
              />
            </div>

            <Button
              variant="outline"
              className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950"
              onClick={() => activeTab === "subjects" ? setSubjectModalOpen(true) : setAssignmentModalOpen(true)}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
                <Plus className="size-4" />
              </span>
              {activeTab === "subjects" ? "Tambah Mapel" : "Tambah Jadwal"}
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState icon={BookOpenCheck} title="Data mapel belum dapat dimuat" description={errorMessage} compact />
          </div>
        ) : null}

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
          className="mt-5 gap-4"
        >
          <ScrollableTabsWrapper>
            <TabsList className="flex min-w-max gap-2 rounded-[24px] border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(242,250,246,0.92)_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_30px_rgba(15,23,42,0.04)] xl:min-w-0 xl:grid xl:w-full xl:grid-cols-2">
              <TabsTrigger
                value="subjects"
                className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full"
              >
                <BookOpenCheck className="size-4" />
                Master Mapel
              </TabsTrigger>
              <TabsTrigger
                value="schedules"
                className="shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-colors hover:border-emerald-100 hover:bg-white/80 hover:text-emerald-800 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-[0_14px_26px_rgba(16,185,129,0.12)] xl:w-full"
              >
                <CalendarClock className="size-4" />
                Jadwal Mengajar
              </TabsTrigger>
            </TabsList>
          </ScrollableTabsWrapper>

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
            >
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {["Kode", "Mata Pelajaran", "Guru", "Kelas", "Slot Jadwal", "Status", "Aksi"].map((label) => (
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
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                      <td className="border-t border-slate-100 px-4 py-4">
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 font-mono text-xs text-slate-600">
                          {subject.code}
                        </Badge>
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <p className="font-medium text-slate-700">{subject.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{subject.group || "Tanpa kelompok"}</p>
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4 text-slate-700">
                        {subject.teacher_count}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4 text-slate-700">
                        {subject.class_count}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4 text-slate-700">
                        {subject.schedule_count}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <StatusBadge isActive={subject.is_active} />
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <ActionButtons
                          onEdit={() => setEditingSubject(subject)}
                          onDelete={() => setDeleteSubjectTarget(subject)}
                          isDeletePending={deleteSubjectMutation.isPending}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            >
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                    {["Guru", "Mata Pelajaran", "Kelas", "Jadwal", "Tahun Ajaran", "Status", "Aksi"].map((label) => (
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
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                      <td className="border-t border-slate-100 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#fef7ec_0%,#ecfdf5_100%)] text-xs font-semibold text-emerald-700 shadow-[0_8px_20px_rgba(22,85,58,0.08)]">
                            {getInitials(assignment.teacher_name)}
                          </span>
                          <p className="font-medium text-slate-700">{assignment.teacher_name}</p>
                        </div>
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <p className="text-slate-700">{assignment.subject_name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{assignment.subject_code}</p>
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4 text-slate-700">
                        {assignment.class_name}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <div className="flex min-w-48 flex-wrap gap-1.5">
                          {assignment.schedules.length > 0 ? (
                            assignment.schedules.map((schedule) => (
                              <Badge
                                key={schedule.id}
                                variant="outline"
                                className="border-emerald-100 bg-emerald-50 text-emerald-700"
                              >
                                {formatDay(schedule.hari)} · {formatTime(schedule.jam_mulai)}–{formatTime(schedule.jam_selesai)}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="border-rose-100 bg-rose-50 text-rose-600">
                              Belum dijadwalkan
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4 text-slate-700">
                        {assignment.school_year_name}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <StatusBadge isActive={assignment.is_active} />
                      </td>
                      <td className="border-t border-slate-100 px-4 py-4">
                        <ActionButtons
                          onEdit={() => setEditingAssignment(assignment)}
                          onDelete={() => setDeleteAssignmentTarget(assignment)}
                          isDeletePending={deleteAssignmentMutation.isPending}
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

      <SubjectFormModal
        key={editingSubject?.id ?? "subject-form-closed"}
        subject={editingSubject}
        open={subjectModalOpen || Boolean(editingSubject)}
        onOpenChange={(open) => { if (!open) { setSubjectModalOpen(false); setEditingSubject(null); } }}
        isPending={createSubjectMutation.isPending || updateSubjectMutation.isPending}
        programs={programs}
        onSubmit={(values) => editingSubject ? updateSubjectMutation.mutate({ id: editingSubject.id, values }) : createSubjectMutation.mutate(values)}
      />
      <TeachingAssignmentFormModal
        key={editingAssignment?.id ?? "assignment-form-closed"}
        assignment={editingAssignment}
        open={assignmentModalOpen || Boolean(editingAssignment)}
        onOpenChange={(open) => { if (!open) { setAssignmentModalOpen(false); setEditingAssignment(null); } }}
        teachers={teachers}
        subjects={subjects}
        classes={classes}
        schoolYears={schoolYears}
        rooms={rooms}
        isPending={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
        onSubmit={(values) => editingAssignment ? updateAssignmentMutation.mutate({ id: editingAssignment.id, values }) : createAssignmentMutation.mutate(values)}
      />
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

function formatDay(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTime(value: string) {
  return value.slice(0, 5);
}
