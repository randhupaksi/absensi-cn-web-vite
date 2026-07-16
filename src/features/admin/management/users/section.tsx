"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import {
  ActionButtons,
  AddButton,
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCell,
  DataTableHeadRow,
  DataTableRow,
  MobileDataCard,
  MobileDataField,
  MobileDataFooter,
  MobileDataHeader,
  MobileDataList,
  SearchFilterBar,
  SectionTabSwitch,
  StatCard,
  getInitials,
  usePagination,
} from "@/features/admin/management/shared/section-ui";
import {
  UserCreateModal,
  UserEditModal,
  UserRoleBadge,
  roleDescription,
} from "@/features/admin/management/users/modals";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
} from "@/services/admin.service";
import type { AdminUser, AdminUserPayload } from "@/types/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  LayoutPanelTop,
  LineChart,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

type UserSectionProps = {
  users: AdminUser[];
  isLoading?: boolean;
  errorMessage?: string;
};

type UserTab = "all" | "admins" | "teachers";

export function UserSection({
  users,
  isLoading = false,
  errorMessage,
}: UserSectionProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [activeTab, setActiveTab] = useState<UserTab>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.success("Akun baru berhasil ditambahkan.");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUserPayload }) =>
      updateAdminUser(id, payload),
    onSuccess: () => {
      toast.success("Akun staff berhasil diperbarui.");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("Akun staff berhasil dihapus.");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const staffUsers = useMemo(
    () => users.filter((user) => user.role !== "STUDENT"),
    [users],
  );

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    const base = staffUsers.filter((user) => {
      if (activeTab === "admins") return user.role === "ADMIN";
      if (activeTab === "teachers") return user.role === "TEACHER";
      return true;
    });

    return base.filter(
      (user) =>
        normalizedQuery.length === 0 ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.role.toLowerCase().includes(normalizedQuery) ||
        (user.username ?? "").toLowerCase().includes(normalizedQuery),
    );
  }, [activeTab, normalizedQuery, staffUsers]);

  const { pageItems: pageUsers, pagination: usersPagination } = usePagination(filteredUsers);

  const kpiCards = [
    {
      label: "Akun Staff",
      value: staffUsers.length,
      icon: UsersRound,
      accentClass: "from-emerald-500 via-teal-500 to-cyan-500",
    },
    {
      label: "Admin",
      value: staffUsers.filter((user) => user.role === "ADMIN").length,
      icon: ShieldCheck,
      accentClass: "from-teal-500 via-emerald-500 to-green-500",
    },
    {
      label: "Akun Guru",
      value: staffUsers.filter((user) => user.role === "TEACHER").length,
      icon: GraduationCap,
      accentClass: "from-amber-400 via-orange-400 to-emerald-500",
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,253,252,0.94)_52%,rgba(245,252,249,0.96)_100%)] p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute right-[-80px] top-[-110px] h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[12%] h-52 w-52 rounded-full bg-emerald-100/30 blur-3xl" />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserTab)}>
        <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-8 sm:gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                <LayoutPanelTop className="size-3.5" />
                Role Workspace
              </div>

              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Role Management
                </h2>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  Kelola akun administrator dan identitas dasar guru. Penugasan operasional
                  guru dikelola dari workspace Guru.
                </p>
              </div>
            </div>

            <div className="lg:w-[390px]">
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/75 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#effcf6_0%,#e0f7ee_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <LineChart className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Ringkasan distribusi role</p>
                  <p className="text-xs leading-5 text-slate-500">
                    Fokus ke sebaran role dan akun staff yang dipakai lintas modul sistem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 items-start gap-3 xl:grid-cols-3">
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
              { value: "all", label: "Semua Akun", icon: UsersRound },
              { value: "admins", label: "Administrator", icon: ShieldCheck },
              { value: "teachers", label: "Guru", icon: GraduationCap },
            ]}
          />
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <EmptyState icon={ShieldCheck} title="Data admin belum bisa dimuat" description={errorMessage} compact />
          </div>
        ) : null}

        <div className="mt-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-xs font-medium text-slate-400">
              {staffUsers.length} akun staff dengan role operasional tersedia
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <SearchFilterBar value={query} onChange={setQuery} placeholder="Cari nama, role, username" />

              <AddButton label="Administrator" onClick={() => setModalOpen(true)} />
            </div>
          </div>
        </div>

          {(["all", "admins", "teachers"] as UserTab[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <DataTableCard
                isLoading={isLoading}
                columnCount={6}
                isEmpty={filteredUsers.length === 0}
                emptyTitle="Belum ada role staff"
                emptyDescription="Tambahkan administrator di sini atau akun guru dari workspace Guru."
                icon={ShieldCheck}
                pagination={usersPagination}
                mobileView={
                  <MobileDataList>
                    {pageUsers.map((user) => (
                      <MobileDataCard key={user.id}>
                        <MobileDataHeader
                          leading={
                            <span className="flex size-10 items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                              {getInitials(user.name)}
                            </span>
                          }
                          title={user.name}
                          badge={<UserRoleBadge role={user.role} />}
                        />
                        <div className="mt-4 space-y-3">
                          <MobileDataField label="Username" value={user.username || "-"} />
                          <MobileDataField label="Identifier" value={user.username || user.nis || "-"} />
                          <MobileDataField label="Akses" value={roleDescription(user.role)} />
                        </div>
                        <MobileDataFooter>
                          <ActionButtons
                            onEdit={() => setEditingUser(user)}
                            onDelete={() => setDeleteTarget(user)}
                            isDeletePending={deleteUserMutation.isPending}
                          />
                        </MobileDataFooter>
                      </MobileDataCard>
                    ))}
                  </MobileDataList>
                }
              >
                <DataTable>
                  <DataTableHeadRow labels={["Nama", "Role", "Username", "Identifier", "Akses", "Aksi"]} />
                  <DataTableBody>
                    {pageUsers.map((user) => (
                      <DataTableRow key={user.id}>
                        <DataTableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#effcf6_0%,#dcfce7_100%)] text-xs font-semibold text-emerald-700">
                              {getInitials(user.name)}
                            </span>
                            <div>
                              <p className="font-medium text-slate-700">{user.name}</p>
                            </div>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <UserRoleBadge role={user.role} />
                        </DataTableCell>
                        <DataTableCell>{user.username || "-"}</DataTableCell>
                        <DataTableCell>{user.username || user.nis || "-"}</DataTableCell>
                        <DataTableCell>{roleDescription(user.role)}</DataTableCell>
                        <DataTableCell>
                          <ActionButtons
                            onEdit={() => setEditingUser(user)}
                            onDelete={() => setDeleteTarget(user)}
                            isDeletePending={deleteUserMutation.isPending}
                          />
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableCard>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {modalOpen && (
        <UserCreateModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          isPending={createUserMutation.isPending}
          onSubmit={(payload) => createUserMutation.mutate(payload)}
        />
      )}
      {editingUser && (
        <UserEditModal
          key={editingUser.id}
          user={editingUser}
          open
          onOpenChange={(open) => { if (!open) setEditingUser(null); }}
          isPending={updateUserMutation.isPending}
          onSubmit={(payload) => updateUserMutation.mutate({ id: editingUser.id, payload })}
        />
      )}
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Role Staff?"
        description={
          deleteTarget
            ? `Akun "${deleteTarget.name}" dengan role ${deleteTarget.role} akan dihapus permanen.`
            : "Akun staff ini akan dihapus permanen."
        }
        isPending={deleteUserMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteUserMutation.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}
