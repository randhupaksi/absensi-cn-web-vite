import { StatCard } from "@/components/dashboard/admin/sections/section-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { bkScopeSchema, type BKScopeFormValues } from "@/lib/validations/bk-scope-schema";
import { replaceAdminBKUnitScopes } from "@/services/admin.service";
import type { AdminBKUnitScope, AdminSchoolUnit, AdminUser } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Save, ShieldCheck } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";

export function BKScopeSection({ users, units, scopes }: { users: AdminUser[]; units: AdminSchoolUnit[]; scopes: AdminBKUnitScope[] }) {
  const client = useQueryClient();
  const bkUsers = users.filter((user) => user.role === "BK");
  const form = useForm<BKScopeFormValues>({ resolver: zodResolver(bkScopeSchema), defaultValues: { user_id: "", school_unit_ids: [] } });
  const selectedUser = form.watch("user_id");
  useEffect(() => { form.setValue("school_unit_ids", scopes.filter((scope) => scope.user_id === selectedUser).map((scope) => scope.school_unit_id)); }, [form, scopes, selectedUser]);
  const mutation = useMutation({ mutationFn: (values: BKScopeFormValues) => replaceAdminBKUnitScopes(values.user_id, values.school_unit_ids), onSuccess: async () => { toast.success("Cakupan unit BK berhasil disimpan."); await client.invalidateQueries({ queryKey: ["admin-bk-unit-scopes"] }); }, onError: (error: Error) => toast.error(error.message) });
  return <section className="mt-6 rounded-[30px] border border-white/75 bg-white/95 p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] sm:p-5 lg:p-6">
    <div className="border-b border-slate-200 pb-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Access Boundary</p><h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Cakupan Unit BK</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Batasi akun BK ke SMA, SMK, atau keduanya. Tanpa konfigurasi, akun lama tetap mendapat akses seluruh unit untuk kompatibilitas.</p></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><StatCard label="Akun BK" value={bkUsers.length} icon={ShieldCheck} accentClass="from-emerald-500 to-teal-500" /><StatCard label="Unit Sekolah" value={units.length} icon={Building2} accentClass="from-sky-500 to-emerald-500" /></div>
    <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="mt-5 grid gap-5 rounded-[24px] border border-emerald-100 bg-emerald-50/30 p-4 sm:p-5">
      <div><label className="mb-2 block text-sm font-semibold text-slate-700">Akun BK</label><Controller control={form.control} name="user_id" render={({ field }) => <RadixSelectField value={field.value} onValueChange={field.onChange} placeholder="Pilih akun BK" options={bkUsers.map((user) => ({ value: user.id, label: user.name, description: user.username }))} triggerClassName="h-14 rounded-[20px]" />} /><FieldError message={form.formState.errors.user_id?.message} /></div>
      <div><label className="mb-2 block text-sm font-semibold text-slate-700">Unit yang dapat diakses</label><div className="grid gap-3 sm:grid-cols-2">{units.filter((unit) => unit.is_active).map((unit) => { const selected = form.watch("school_unit_ids").includes(unit.id); return <label key={unit.id} className="flex min-h-14 items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 text-sm text-slate-700"><Checkbox checked={selected} onCheckedChange={(checked) => { const current = form.getValues("school_unit_ids"); form.setValue("school_unit_ids", checked ? [...current, unit.id] : current.filter((id) => id !== unit.id), { shouldValidate: true }); }} /><span><b>{unit.code}</b> · {unit.name}</span></label>; })}</div><FieldError message={form.formState.errors.school_unit_ids?.message} /></div>
      <div className="flex justify-end"><Button type="submit" className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white" disabled={mutation.isPending}><Save className="size-4" />{mutation.isPending ? "Menyimpan..." : "Simpan Cakupan"}</Button></div>
    </form>
  </section>;
}
