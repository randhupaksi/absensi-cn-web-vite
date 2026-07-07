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
  StatCard,
} from "@/components/dashboard/admin/sections/section-ui";
import { ClassFormModal } from "@/components/dashboard/admin/sections/class-management-modals";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { RadixSelectField } from "@/components/ui/radix-select";
import { createAdminClass, deleteAdminClass, updateAdminClass } from "@/services/admin.service";
import type { AdminClass, AdminClassPayload, AdminMajor, AdminSchoolUnit, AdminSchoolYear } from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building2, GraduationCap, LayoutPanelTop, ShieldCheck, Users } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type ClassManagementSectionProps = {
  classes: AdminClass[];
  majors: AdminMajor[];
  schoolYears: AdminSchoolYear[];
  schoolUnits: AdminSchoolUnit[];
  isLoading?: boolean;
  errorMessage?: string;
};

const statusOptions = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

export function ClassManagementSection({
  classes,
  majors,
  schoolYears,
  schoolUnits,
  isLoading = false,
  errorMessage,
}: ClassManagementSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AdminClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminClass | null>(null);

  const activeClasses = classes.filter((item) => item.is_active);
  const totalStudents = classes.reduce((sum, item) => sum + (item.student_count ?? 0), 0);
  const totalAssignments = classes.reduce(
    (sum, item) => sum + (item.subject_assignment_count ?? 0),
    0,
  );
  const homeroomCovered = classes.filter((item) => item.homeroom_teacher_name).length;

  const filteredClasses = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return classes.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.is_active : !item.is_active);
      const matchesQuery =
        normalized.length === 0 ||
        item.display_name.toLowerCase().includes(normalized) ||
        item.major_name.toLowerCase().includes(normalized) ||
        item.school_year_name.toLowerCase().includes(normalized) ||
        (item.homeroom_teacher_name ?? "").toLowerCase().includes(normalized);

      return matchesStatus && matchesQuery;
    });
  }, [classes, deferredQuery, statusFilter]);

  const createMutation = useMutation({
    mutationFn: createAdminClass,
    onSuccess: () => {
      toast.success("Kelas berhasil ditambahkan.");
      setModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminClassPayload }) =>
      updateAdminClass(id, payload),
    onSuccess: () => {
      toast.success("Kelas berhasil diperbarui.");
      setEditingClass(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-homeroom-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-subject-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminClass,
    onSuccess: () => {
      toast.success("Kelas dan relasi terkait berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-homeroom-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-teacher-subject-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-student-class-memberships"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const kpiCards = [
    {
      label: "Total Kelas",
      value: classes.length,
      icon: Building2,
      accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
    },
    {
      label: "Kelas Aktif",
      value: activeClasses.length,
      icon: BadgeCheck,
      accentClass: "from-teal-500 via-emerald-500 to-green-500",
    },
    {
      label: "Siswa",
      value: totalStudents,
      icon: Users,
      accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
    },
    {
      label: "Walas",
      value: homeroomCovered,
      icon: ShieldCheck,
      accentClass: "from-amber-400 via-orange-400 to-emerald-500",
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <LayoutPanelTop className="size-3.5" />
                Class Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Class Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Kelola rombel, jurusan, tahun ajaran, walas, dan relasi data kelas dari satu
                  area operasional admin.
                </p>
              </div>
            </div>

            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <GraduationCap className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Relasi data kelas</p>
                  <p className="text-xs leading-5 text-slate-500">
                    Hapus kelas akan membersihkan walas, mapel, membership, dan absensi terkait.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-xs font-medium text-slate-400">
              {totalAssignments} assignment mapel aktif terhubung ke struktur kelas
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari kelas, jurusan, walas" />

              <div className="w-full sm:w-[180px]">
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Pilih status"
                  options={statusOptions}
                  triggerClassName="h-14 rounded-[22px] pl-4"
                />
              </div>

              <AddButton label="Kelas" onClick={() => setModalOpen(true)} />
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState
              icon={Building2}
              title="Data kelas belum bisa dimuat"
              description={errorMessage}
              compact
            />
          </div>
        ) : null}

        <div className="mt-5">
          <DataTableCard
            isLoading={isLoading}
            columnCount={8}
            isEmpty={filteredClasses.length === 0}
            emptyTitle="Kelas tidak ditemukan"
            emptyDescription="Coba ubah pencarian, filter status, atau tambahkan kelas baru."
            icon={Building2}
          >
            <DataTable>
              <DataTableHeadRow labels={["Kelas", "Jurusan", "Tahun Ajaran", "Walas", "Siswa", "Mapel", "Status", "Aksi"]} />
              <DataTableBody>
                {filteredClasses.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                          {item.grade}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">{item.display_name}</p>
                          <p className="text-xs text-slate-400">ID: {item.id}</p>
                        </div>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="font-medium text-slate-700">{item.major_code}</p>
                      <p className="text-xs text-slate-400">{item.major_name}</p>
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap">{item.school_year_name}</DataTableCell>
                    <DataTableCell>
                      {item.homeroom_teacher_name ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          {item.homeroom_teacher_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          Belum Ada
                        </Badge>
                      )}
                    </DataTableCell>
                    <DataTableCell>{item.student_count}</DataTableCell>
                    <DataTableCell>{item.subject_assignment_count}</DataTableCell>
                    <DataTableCell>
                      <Badge variant="outline" className={item.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <ActionButtons
                        onEdit={() => setEditingClass(item)}
                        onDelete={() => setDeleteTarget(item)}
                        isDeletePending={deleteMutation.isPending}
                      />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableCard>
        </div>
      </section>

      {modalOpen && (
        <ClassFormModal
          title="Tambah Kelas"
          description="Buat rombel baru yang langsung bisa dipakai untuk assignment walas, mapel, dan penempatan siswa."
          open={modalOpen}
          majors={majors}
          schoolUnits={schoolUnits}
          schoolYears={schoolYears}
          isSubmitting={createMutation.isPending}
          onOpenChange={setModalOpen}
          onSubmit={(payload) => createMutation.mutate(payload)}
        />
      )}

      {editingClass && (
        <ClassFormModal
          key={editingClass.id}
          title="Edit Kelas"
          description="Perbarui identitas kelas tanpa memutus relasi data yang sudah terhubung."
          open
          initialData={editingClass}
          majors={majors}
          schoolUnits={schoolUnits}
          schoolYears={schoolYears}
          isSubmitting={updateMutation.isPending}
          onOpenChange={(open) => { if (!open) setEditingClass(null); }}
          onSubmit={(payload) => updateMutation.mutate({ id: editingClass.id, payload })}
        />
      )}

      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        title="Hapus Kelas?"
        description={
          deleteTarget
            ? `Kelas "${deleteTarget.display_name}" akan dihapus bersama relasi walas, mapel, membership siswa, dan record absensi terkait.`
            : ""
        }
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
