"use client";

import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { RadixSelectField } from "@/components/ui/radix-select";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { SchoolHolidayFormModal } from "@/features/admin/management/holidays/modals";
import { countEffectiveHolidayDays, formatHolidayPeriod, holidayDurationDays, holidayPeriodState, jakartaDateKey } from "@/features/admin/management/holidays/date-utils";
import { ActionButtons, AddButton, DataTable, DataTableBody, DataTableCard, DataTableCell, DataTableHeadRow, DataTableRow, MobileDataCard, MobileDataField, MobileDataFooter, MobileDataHeader, MobileDataList, SearchFilterBar, StatCard, usePagination } from "@/features/admin/management/shared/section-ui";
import type { SchoolHolidayFormValues } from "@/lib/validations/school-holiday-schema";
import { createAdminSchoolHoliday, deleteAdminSchoolHoliday, updateAdminSchoolHoliday } from "@/services/admin.service";
import type { AdminSchoolHoliday, AdminSchoolHolidayPayload, AdminSchoolHolidayType } from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CalendarCheck2, CalendarDays, CalendarRange, Clock3 } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type Props = { holidays: AdminSchoolHoliday[]; isLoading?: boolean; errorMessage?: string };

const TYPE_LABEL: Record<AdminSchoolHolidayType, string> = {
  NATIONAL: "Libur Nasional",
  COLLECTIVE_LEAVE: "Cuti Bersama",
  SCHOOL: "Libur Sekolah",
};

export function HolidayManagementSection({ holidays, isLoading = false, errorMessage }: Props) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminSchoolHoliday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSchoolHoliday | null>(null);

  const today = jakartaDateKey();
  const currentYear = Number(today.slice(0, 4));
  const orderedHolidays = useMemo(
    () => [...holidays].sort((left, right) => right.start_date.localeCompare(left.start_date) || left.name.localeCompare(right.name, "id")),
    [holidays],
  );
  const filteredHolidays = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return orderedHolidays.filter((item) => {
      const matchesType = typeFilter === "all" || item.holiday_type === typeFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? item.is_active : !item.is_active);
      const matchesQuery = !normalized || `${item.name} ${item.description ?? ""} ${TYPE_LABEL[item.holiday_type]}`.toLowerCase().includes(normalized);
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [deferredQuery, orderedHolidays, statusFilter, typeFilter]);
  const { pageItems, pagination } = usePagination(filteredHolidays);

  const activeHolidays = holidays.filter((item) => item.is_active);
  const upcomingHolidays = activeHolidays.filter((item) => item.start_date > today).length;
  const activeDaysThisYear = countEffectiveHolidayDays(activeHolidays, currentYear);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-school-holidays"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };
  const createMutation = useMutation({
    mutationFn: createAdminSchoolHoliday,
    onSuccess: () => { toast.success("Periode libur berhasil ditambahkan."); setCreateOpen(false); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminSchoolHolidayPayload }) => updateAdminSchoolHoliday(id, payload),
    onSuccess: () => { toast.success("Periode libur berhasil diperbarui."); setEditingItem(null); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminSchoolHoliday,
    onSuccess: () => { toast.success("Periode libur berhasil dihapus."); setDeleteTarget(null); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const toPayload = (values: SchoolHolidayFormValues): AdminSchoolHolidayPayload => ({ ...values });

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] size-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="relative border-b border-slate-200/80 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <CalendarCheck2 className="size-3.5" /> Kalender Sekolah
              </div>
              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">Kalender Hari Libur</h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">Kelola libur nasional, cuti bersama, dan libur sekolah sebagai satu kebijakan absensi terpusat.</p>
              </div>
            </div>
            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarRange className="size-4.5" /></span>
                <div><p className="text-sm font-semibold text-slate-800">Berlaku ke seluruh sistem</p><p className="text-xs leading-5 text-slate-500">Tanggal aktif tidak menghasilkan alfa dan tidak dihitung dalam rekap kehadiran.</p></div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Total Periode" value={holidays.length} icon={CalendarDays} accentClass="from-emerald-500 via-teal-500 to-cyan-500" />
            <StatCard label="Periode Aktif" value={activeHolidays.length} icon={BadgeCheck} accentClass="from-teal-500 via-emerald-500 to-green-500" />
            <StatCard label="Akan Datang" value={upcomingHolidays} icon={Clock3} accentClass="from-sky-500 via-cyan-500 to-emerald-500" />
            <StatCard label={`Hari Efektif ${currentYear}`} value={activeDaysThisYear} icon={CalendarCheck2} accentClass="from-violet-500 via-fuchsia-500 to-emerald-500" />
          </div>
        </div>

        <div className="relative mt-5 flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-end">
          <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari nama atau catatan libur" className="xl:min-w-[280px]" />
          <Filter value={typeFilter} onChange={setTypeFilter} options={[{ value: "all", label: "Semua kategori" }, ...Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))]} placeholder="Kategori" wide />
          <Filter value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "Semua status" }, { value: "active", label: "Aktif" }, { value: "inactive", label: "Nonaktif" }]} placeholder="Status" />
          <AddButton label="Hari Libur" onClick={() => setCreateOpen(true)} />
        </div>

        {errorMessage ? <div className="relative mt-5"><EmptyState icon={CalendarDays} title="Kalender libur belum bisa dimuat" description={errorMessage} compact /></div> : null}

        <div className="relative mt-5">
          <DataTableCard isLoading={isLoading} columnCount={6} isEmpty={filteredHolidays.length === 0} emptyTitle="Periode libur tidak ditemukan" emptyDescription="Ubah filter atau tambahkan periode libur baru." icon={CalendarDays} pagination={pagination} mobileView={<HolidayMobileList items={pageItems} onEdit={setEditingItem} onDelete={setDeleteTarget} isDeletePending={deleteMutation.isPending} />}>
            <DataTable>
              <DataTableHeadRow labels={["Periode", "Nama Libur", "Kategori", "Durasi", "Status", "Aksi"]} centerLabels={["Kategori", "Durasi", "Status"]} />
              <DataTableBody>
                {pageItems.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell><p className="font-semibold text-slate-800">{formatHolidayPeriod(item)}</p><p className="mt-1 text-xs text-slate-400">{holidayPeriodState(item, today)}</p></DataTableCell>
                    <DataTableCell className="max-w-[340px] whitespace-normal"><p className="font-semibold text-slate-800">{item.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description || "Tanpa catatan tambahan"}</p></DataTableCell>
                    <DataTableCell className="text-center"><HolidayTypeBadge type={item.holiday_type} /></DataTableCell>
                    <DataTableCell className="text-center font-semibold text-slate-700">{holidayDurationDays(item)} hari</DataTableCell>
                    <DataTableCell className="text-center"><ActiveBadge active={item.is_active} /></DataTableCell>
                    <DataTableCell><ActionButtons onEdit={() => setEditingItem(item)} onDelete={() => setDeleteTarget(item)} isDeletePending={deleteMutation.isPending} /></DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableCard>
        </div>
      </section>

      <SchoolHolidayFormModal item={null} open={createOpen} onOpenChange={setCreateOpen} isPending={createMutation.isPending} onSubmit={(values) => createMutation.mutate(toPayload(values))} />
      <SchoolHolidayFormModal item={editingItem} open={Boolean(editingItem)} onOpenChange={(open) => { if (!open) setEditingItem(null); }} isPending={updateMutation.isPending} onSubmit={(values) => { if (editingItem) updateMutation.mutate({ id: editingItem.id, payload: toPayload(values) }); }} />
      <DeleteConfirmationModal open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Hapus periode libur?" description={deleteTarget ? `${deleteTarget.name} (${formatHolidayPeriod(deleteTarget)}) akan dihapus dari kalender.` : "Periode libur akan dihapus."} warning="Tanggal tersebut akan kembali dianggap sebagai hari sekolah dan dapat masuk ke perhitungan absensi." isPending={deleteMutation.isPending} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }} />
    </>
  );
}

function Filter({ value, onChange, options, placeholder, wide = false }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string; wide?: boolean }) {
  return <div className={`w-full ${wide ? "sm:w-[220px]" : "sm:w-[170px]"}`}><RadixSelectField value={value} onValueChange={onChange} options={options} placeholder={placeholder} triggerClassName="h-14 rounded-[22px]" /></div>;
}

function HolidayMobileList({ items, onEdit, onDelete, isDeletePending }: { items: AdminSchoolHoliday[]; onEdit: (item: AdminSchoolHoliday) => void; onDelete: (item: AdminSchoolHoliday) => void; isDeletePending: boolean }) {
  return <MobileDataList>{items.map((item) => <MobileDataCard key={item.id}><MobileDataHeader leading={<span className="flex size-10 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700"><CalendarDays className="size-4" /></span>} title={item.name} subtitle={formatHolidayPeriod(item)} badge={<ActiveBadge active={item.is_active} />} /><div className="mt-4 space-y-3"><MobileDataField label="Kategori" value={<HolidayTypeBadge type={item.holiday_type} />} /><MobileDataField label="Durasi" value={`${holidayDurationDays(item)} hari`} /><MobileDataField label="Catatan" value={item.description || "—"} /></div><MobileDataFooter><ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} isDeletePending={isDeletePending} /></MobileDataFooter></MobileDataCard>)}</MobileDataList>;
}

function HolidayTypeBadge({ type }: { type: AdminSchoolHolidayType }) {
  const style = type === "NATIONAL" ? "border-rose-200 bg-rose-50 text-rose-700" : type === "COLLECTIVE_LEAVE" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-violet-200 bg-violet-50 text-violet-700";
  return <Badge variant="outline" className={style}>{TYPE_LABEL[type]}</Badge>;
}

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant="outline" className={active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}>{active ? "Aktif" : "Nonaktif"}</Badge>;
}
