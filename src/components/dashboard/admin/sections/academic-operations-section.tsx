import { ActionButtons, DataTable, DataTableBody, DataTableCard, DataTableCell, DataTableHeadRow, DataTableRow, StatCard, StatusBadge } from "@/components/dashboard/admin/sections/section-ui";
import { ScheduleOverrideModal, RoomModal, SubjectOfferingModal } from "@/components/dashboard/admin/sections/academic-operations-modals";
import { ScrollableTabsWrapper } from "@/components/dashboard/admin/widgets/scrollable-tabs";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RoomFormValues, ScheduleOverrideFormValues, SubjectOfferingFormValues } from "@/lib/validations/academic-operations-schema";
import { createAdminRoom, createAdminScheduleOverride, createAdminSubjectOffering, deleteAdminRoom, deleteAdminScheduleOverride, deleteAdminSubjectOffering, updateAdminRoom, updateAdminScheduleOverride, updateAdminSubjectOffering } from "@/services/admin.service";
import type { AdminClass, AdminRoom, AdminScheduleOverride, AdminSchoolUnit, AdminSchoolYear, AdminSubject, AdminSubjectOffering, AdminSubjectScheduleOverview, AdminTeacherProfile } from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookPlus, CalendarSync, DoorOpen, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Tab = "offerings" | "rooms" | "overrides";

const ADD_LABELS: Record<Tab, string> = {
  offerings: "Tambah Penawaran",
  rooms: "Tambah Ruangan",
  overrides: "Tambah Perubahan Jadwal",
};

export function AcademicOperationsSection({ offerings, rooms, overrides, subjects, classes, schoolYears, schoolUnits, schedules, teachers, isLoading }: {
  offerings: AdminSubjectOffering[]; rooms: AdminRoom[]; overrides: AdminScheduleOverride[]; subjects: AdminSubject[]; classes: AdminClass[]; schoolYears: AdminSchoolYear[]; schoolUnits: AdminSchoolUnit[]; schedules: AdminSubjectScheduleOverview[]; teachers: AdminTeacherProfile[]; isLoading: boolean;
}) {
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("offerings");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<AdminSubjectOffering | null>(null);
  const [editingRoom, setEditingRoom] = useState<AdminRoom | null>(null);
  const [editingOverride, setEditingOverride] = useState<AdminScheduleOverride | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; kind: Tab } | null>(null);
  const invalidate = () => Promise.all(["admin-subject-offerings", "admin-rooms", "admin-schedule-overrides", "admin-subject-schedules", "admin-teacher-subject-assignments"].map((key) => client.invalidateQueries({ queryKey: [key] })));
  const success = async (message: string) => { toast.success(message); setCreateOpen(false); setEditingOffering(null); setEditingRoom(null); setEditingOverride(null); setDeleteTarget(null); await invalidate(); };

  const createOffering = useMutation({ mutationFn: createAdminSubjectOffering, onSuccess: () => success("Penawaran mapel berhasil ditambahkan."), onError: showError });
  const updateOffering = useMutation({ mutationFn: ({ id, values }: { id: string; values: SubjectOfferingFormValues }) => updateAdminSubjectOffering(id, values), onSuccess: () => success("Penawaran mapel berhasil diperbarui."), onError: showError });
  const removeOffering = useMutation({ mutationFn: deleteAdminSubjectOffering, onSuccess: () => success("Penawaran mapel berhasil dihapus."), onError: showError });
  const createRoom = useMutation({ mutationFn: createAdminRoom, onSuccess: () => success("Ruangan berhasil ditambahkan."), onError: showError });
  const updateRoom = useMutation({ mutationFn: ({ id, values }: { id: string; values: RoomFormValues }) => updateAdminRoom(id, values), onSuccess: () => success("Ruangan berhasil diperbarui."), onError: showError });
  const removeRoom = useMutation({ mutationFn: deleteAdminRoom, onSuccess: () => success("Ruangan berhasil dihapus."), onError: showError });
  const createOverride = useMutation({ mutationFn: createAdminScheduleOverride, onSuccess: () => success("Perubahan jadwal berhasil ditambahkan."), onError: showError });
  const updateOverride = useMutation({ mutationFn: ({ id, values }: { id: string; values: ScheduleOverrideFormValues }) => updateAdminScheduleOverride(id, values), onSuccess: () => success("Perubahan jadwal berhasil diperbarui."), onError: showError });
  const removeOverride = useMutation({ mutationFn: deleteAdminScheduleOverride, onSuccess: () => success("Perubahan jadwal berhasil dihapus."), onError: showError });

  const pending = createOffering.isPending || updateOffering.isPending || createRoom.isPending || updateRoom.isPending || createOverride.isPending || updateOverride.isPending;
  const cards = [{ label: "Penawaran Kelas", value: offerings.length, icon: BookPlus, accentClass: "from-emerald-500 to-teal-500" }, { label: "Ruangan Aktif", value: rooms.filter((x) => x.is_active).length, icon: DoorOpen, accentClass: "from-sky-500 to-emerald-500" }, { label: "Perubahan Aktif", value: overrides.filter((x) => x.status === "ACTIVE").length, icon: CalendarSync, accentClass: "from-amber-400 to-emerald-500" }];

  return <>
    <section className="relative mt-6 overflow-hidden rounded-[30px] border border-white/75 bg-white/95 p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] sm:p-5 lg:p-6">
      <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Academic Operations</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Operasional Jadwal Mapel</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Kelola ketersediaan mapel per kelas, ruang belajar, serta perubahan jadwal tanpa mengubah histori.</p></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">{cards.map((card) => <StatCard key={card.label} {...card} />)}</div>
      <Tabs value={tab} onValueChange={(value) => { setTab(value as Tab); setCreateOpen(false); }} className="mt-5">
        <ScrollableTabsWrapper><TabsList className="h-auto w-max min-w-full justify-start gap-2 rounded-[22px] bg-emerald-50/70 p-2"><TabsTrigger value="offerings" className="rounded-[16px] px-5 py-3">Penawaran Mapel</TabsTrigger><TabsTrigger value="rooms" className="rounded-[16px] px-5 py-3">Ruangan</TabsTrigger><TabsTrigger value="overrides" className="rounded-[16px] px-5 py-3">Perubahan Jadwal</TabsTrigger></TabsList></ScrollableTabsWrapper>
        <div className="mt-3 flex justify-end">
          <Button className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white" onClick={() => setCreateOpen(true)}><Plus className="size-4" />{ADD_LABELS[tab]}</Button>
        </div>
        <TabsContent value="offerings" className="mt-4"><DataTableCard isLoading={isLoading} columnCount={7} isEmpty={offerings.length === 0} emptyTitle="Belum ada penawaran mapel" emptyDescription="Tambahkan mapel ke kelas dan tahun ajaran." icon={BookPlus}><DataTable><DataTableHeadRow labels={["Mapel", "Kelas", "Unit", "Tahun", "JP/Minggu", "Status", "Aksi"]} /><DataTableBody>{offerings.map((item) => <DataTableRow key={item.id}><DataTableCell><b>{item.subject_code}</b><small>{item.subject_name}</small></DataTableCell><DataTableCell>{item.class_name}</DataTableCell><DataTableCell><Pill>{item.school_unit_code}</Pill></DataTableCell><DataTableCell>{item.school_year_name}</DataTableCell><DataTableCell>{item.weekly_hours} JP</DataTableCell><DataTableCell><StatusBadge isActive={item.is_active} /></DataTableCell><DataTableCell><ActionButtons onEdit={() => setEditingOffering(item)} onDelete={() => setDeleteTarget({ id: item.id, label: `${item.subject_code} · ${item.class_name}`, kind: "offerings" })} /></DataTableCell></DataTableRow>)}</DataTableBody></DataTable></DataTableCard></TabsContent>
        <TabsContent value="rooms" className="mt-4"><DataTableCard isLoading={isLoading} columnCount={6} isEmpty={rooms.length === 0} emptyTitle="Belum ada ruangan" emptyDescription="Tambahkan ruang yang dapat dipakai jadwal." icon={DoorOpen}><DataTable><DataTableHeadRow labels={["Kode", "Nama", "Unit", "Tipe", "Kapasitas", "Aksi"]} /><DataTableBody>{rooms.map((item) => <DataTableRow key={item.id}><DataTableCell><b>{item.code}</b></DataTableCell><DataTableCell>{item.name}</DataTableCell><DataTableCell><Pill>{item.school_unit_code}</Pill></DataTableCell><DataTableCell>{item.room_type}</DataTableCell><DataTableCell>{item.capacity}</DataTableCell><DataTableCell><ActionButtons onEdit={() => setEditingRoom(item)} onDelete={() => setDeleteTarget({ id: item.id, label: item.name, kind: "rooms" })} /></DataTableCell></DataTableRow>)}</DataTableBody></DataTable></DataTableCard></TabsContent>
        <TabsContent value="overrides" className="mt-4"><DataTableCard isLoading={isLoading} columnCount={6} isEmpty={overrides.length === 0} emptyTitle="Belum ada perubahan jadwal" emptyDescription="Jadwal normal tetap berlaku selama tidak ada override." icon={CalendarSync}><DataTable><DataTableHeadRow labels={["Jadwal", "Tanggal Asal", "Jenis", "Pengganti", "Status", "Aksi"]} /><DataTableBody>{overrides.map((item) => { const schedule = schedules.find((x) => x.id === item.schedule_id); return <DataTableRow key={item.id}><DataTableCell><b>{schedule?.subject_code ?? "Jadwal"}</b><small>{schedule?.class_name ?? item.schedule_id}</small></DataTableCell><DataTableCell>{item.original_date}</DataTableCell><DataTableCell><Pill>{item.override_type}</Pill></DataTableCell><DataTableCell>{item.replacement_date || item.replacement_room_id || item.substitute_teacher_id || "—"}</DataTableCell><DataTableCell><StatusBadge isActive={item.status === "ACTIVE"} /></DataTableCell><DataTableCell><ActionButtons onEdit={() => setEditingOverride(item)} onDelete={() => setDeleteTarget({ id: item.id, label: `${item.override_type} · ${item.original_date}`, kind: "overrides" })} /></DataTableCell></DataTableRow>; })}</DataTableBody></DataTable></DataTableCard></TabsContent>
      </Tabs>
    </section>
    <SubjectOfferingModal open={(tab === "offerings" && createOpen) || Boolean(editingOffering)} item={editingOffering} subjects={subjects} classes={classes} schoolYears={schoolYears} pending={pending} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditingOffering(null); } }} onSubmit={(values) => editingOffering ? updateOffering.mutate({ id: editingOffering.id, values }) : createOffering.mutate(values)} />
    <RoomModal open={(tab === "rooms" && createOpen) || Boolean(editingRoom)} item={editingRoom} schoolUnits={schoolUnits} pending={pending} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditingRoom(null); } }} onSubmit={(values) => editingRoom ? updateRoom.mutate({ id: editingRoom.id, values }) : createRoom.mutate(values)} />
    <ScheduleOverrideModal open={(tab === "overrides" && createOpen) || Boolean(editingOverride)} item={editingOverride} schedules={schedules} rooms={rooms} teachers={teachers} pending={pending} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditingOverride(null); } }} onSubmit={(values) => editingOverride ? updateOverride.mutate({ id: editingOverride.id, values }) : createOverride.mutate(values)} />
    <DeleteConfirmationModal open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Hapus data akademik?" description={deleteTarget?.label ?? ""} warning="Data yang sudah memiliki relasi histori sebaiknya dinonaktifkan dan dapat ditolak oleh server." onConfirm={() => { if (!deleteTarget) return; if (deleteTarget.kind === "offerings") removeOffering.mutate(deleteTarget.id); else if (deleteTarget.kind === "rooms") removeRoom.mutate(deleteTarget.id); else removeOverride.mutate(deleteTarget.id); }} isPending={removeOffering.isPending || removeRoom.isPending || removeOverride.isPending} />
  </>;
}

function showError(error: Error) { toast.error(error.message); }
function Pill({ children }: { children: React.ReactNode }) { return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{children}</Badge>; }
