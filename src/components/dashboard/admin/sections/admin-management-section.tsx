"use client";

import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import {
  ActionButtons,
  DataTableCard,
  StatCard,
  getInitials,
} from "@/components/dashboard/admin/sections/section-ui";
import {
  AdminCreateModal,
  AdminEditModal,
} from "@/components/dashboard/admin/sections/admin-management-modals";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAdminUser, deleteAdminUser, updateAdminUser } from "@/services/admin.service";
import type { AdminUser, AdminUserPayload } from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  KeyRound,
  LayoutPanelTop,
  LineChart,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type AdminManagementSectionProps = {
  users: AdminUser[];
  isLoading?: boolean;
  errorMessage?: string;
};

export function AdminManagementSection({
  users,
  isLoading = false,
  errorMessage,
}: AdminManagementSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const createAdminMutation = useMutation({
    mutationFn: (payload: AdminUserPayload) => createAdminUser(payload),
    onSuccess: () => {
      toast.success("Akun admin berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUserPayload }) =>
      updateAdminUser(id, payload),
    onSuccess: () => {
      toast.success("Akun admin berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAdminMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("Akun admin berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const adminUsers = useMemo(
    () => users.filter((user) => user.role === "ADMIN"),
    [users],
  );

  const filteredAdmins = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return adminUsers.filter(
      (user) =>
        normalizedQuery.length === 0 ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        (user.username ?? "").toLowerCase().includes(normalizedQuery),
    );
  }, [adminUsers, deferredQuery]);

  const kpiCards = [
    {
      label: "Total Admin",
      value: adminUsers.length,
      icon: ShieldCheck,
      accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
    },
    {
      label: "Siap Login",
      value: adminUsers.filter((user) => Boolean(user.username?.trim())).length,
      icon: BadgeCheck,
      accentClass: "from-teal-500 via-emerald-500 to-green-500",
    },
    {
      label: "Akun Terfilter",
      value: filteredAdmins.length,
      icon: Search,
      accentClass: "from-sky-500 via-cyan-500 to-emerald-500",
    },
    {
      label: "Kontrol Sistem",
      value: adminUsers.length,
      icon: KeyRound,
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
                Admin Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Admin Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Kelola akun administrator inti yang memiliki kontrol tertinggi pada dashboard
                  dan master data sekolah.
                </p>
              </div>
            </div>

            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <LineChart className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Ringkasan akun administrator</p>
                  <p className="text-xs leading-5 text-slate-500">
                    Fokus ke akun dengan otoritas tertinggi untuk akses pengelolaan sistem.
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
              {adminUsers.length} akun administrator aktif dalam struktur role sistem
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
                  placeholder="Cari nama admin atau username"
                  className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[240px]"
                />
              </div>

              <Button
                variant="outline"
                className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950"
                onClick={() => setModalOpen(true)}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
                  <Plus className="size-4" />
                </span>
                Tambah
              </Button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState icon={ShieldCheck} title="Data admin belum bisa dimuat" description={errorMessage} compact />
          </div>
        ) : null}

        <div className="mt-5">
          <DataTableCard
            isLoading={isLoading}
            columnCount={5}
            isEmpty={filteredAdmins.length === 0}
            emptyTitle="Akun admin tidak ditemukan"
            emptyDescription="Coba ubah pencarian atau tambahkan akun administrator baru."
            icon={ShieldCheck}
          >
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-[#f3fbf6] text-sm text-slate-700">
                  {["Administrator", "Username", "Role", "Akses", "Aksi"].map((label) => (
                    <th key={label} className={`border-b border-emerald-100/90 px-4 py-4 font-medium first:rounded-tl-[24px] last:rounded-tr-[24px] ${label === "Aksi" ? "text-center" : ""}`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((user) => (
                  <tr key={user.id} className="bg-white text-sm text-slate-600 transition hover:bg-emerald-50/30">
                    <td className="border-t border-slate-100 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                          {getInitials(user.name)}
                        </span>
                        <div>
                          <p className="font-medium text-slate-700">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4">{user.username || "-"}</td>
                    <td className="border-t border-slate-100 px-4 py-4">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        ADMIN
                      </Badge>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-4">Kontrol penuh dashboard dan master data</td>
                    <td className="border-t border-slate-100 px-4 py-4">
                      <ActionButtons
                        onEdit={() => setEditingUser(user)}
                        onDelete={() => setDeleteTarget(user)}
                        isDeletePending={deleteAdminMutation.isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableCard>
        </div>
      </section>

      <AdminCreateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        isPending={createAdminMutation.isPending}
        onSubmit={(payload) => createAdminMutation.mutate(payload)}
      />
      <AdminEditModal
        key={editingUser?.id ?? "admin-edit-closed"}
        user={editingUser}
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        isPending={updateAdminMutation.isPending}
        onSubmit={(payload) => {
          if (!editingUser) return;
          updateAdminMutation.mutate({ id: editingUser.id, payload });
        }}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Admin?"
        description={
          deleteTarget
            ? `Akun administrator "${deleteTarget.name}" akan dihapus permanen.`
            : "Akun administrator ini akan dihapus permanen."
        }
        isPending={deleteAdminMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteAdminMutation.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}
