"use client";

import { AppImage as Image } from "@/components/media/app-image";
import { AppLink as Link } from "@/components/router/app-link";
import {
  BookOpenCheck,
  ClipboardList,
  Building2,
  ChartColumnBig,
  FileClock,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
  UserCog,
  Users,
} from "lucide-react";

export type StaffSidebarItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type StaffSidebarProps = {
  items: StaffSidebarItem[];
  activePath: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export function StaffSidebar({
  items,
  activePath,
  isOpen,
  onClose,
  onLogout,
}: StaffSidebarProps) {
  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[278px] flex-col rounded-r-[32px] bg-[linear-gradient(180deg,#1f7a65_0%,#176655_54%,#154f44_100%)] p-5 text-white shadow-[0_24px_64px_rgba(15,74,59,0.28)] transition-transform duration-300 ease-in-out will-change-transform lg:w-[272px] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-2 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-16 items-center justify-center">
                <Image
                  src="/images/optimized/logo-cn.png"
                  alt="Logo SMK Citra Negara"
                  width={52}
                  height={52}
                  priority
                  className="object-contain"
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">
                  SMK Citra Negara
                </p>
                <p className="mt-1 text-sm leading-5 text-emerald-50/78">
                  Pusat kendali absensi dan data sekolah
                </p>
              </div>
            </div>
            <div className="mt-5 h-px w-full bg-white/14" />
          </div>

          <nav className="mt-3 flex-1 space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-[22px] px-3 py-3.5 transition duration-200 ${
                    isActive
                      ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-white/78 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-[18px] transition ${
                      isActive
                        ? "bg-white/18 text-white"
                        : "bg-white/8 text-white/85 group-hover:bg-white/14"
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={onLogout}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ffd3c1] px-5 text-sm font-semibold text-[#6d3a2d] transition duration-200 hover:scale-[1.03] hover:bg-rose-500 hover:text-white hover:shadow-[0_8px_22px_rgba(225,60,40,0.35)] active:scale-[0.98]"
            >
              <LogOut className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-rotate-6" />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export const adminSidebarItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Guru", href: "/dashboard/admin/teachers", icon: GraduationCap },
  { label: "Manajemen Mapel", href: "/dashboard/admin/subjects", icon: BookOpenCheck },
  { label: "Siswa", href: "/dashboard/admin/students", icon: Users },
  { label: "Kelas", href: "/dashboard/admin/classes", icon: Building2 },
  { label: "Admin", href: "/dashboard/admin/admins", icon: ShieldCheck },
  { label: "Manajemen Role", href: "/dashboard/admin/users", icon: UserCog },
] satisfies StaffSidebarItem[];

export const walasSidebarItems = [
  { label: "Dashboard", href: "/dashboard/walas", icon: LayoutDashboard },
  { label: "Siswa Kelas", href: "/dashboard/walas/students", icon: Users },
  {
    label: "Absensi Kelas",
    href: "/dashboard/walas/attendance",
    icon: ClipboardList,
  },
  {
    label: "Pengajuan",
    href: "/dashboard/walas/submissions",
    icon: FileClock,
  },
] satisfies StaffSidebarItem[];

export const guruMapelSidebarItems = [
  { label: "Daftar Hadir", href: "/dashboard/walas/mapel", icon: BookOpenCheck },
  { label: "Riwayat Sesi", href: "/dashboard/walas/mapel/history", icon: History },
  { label: "Rekap Mapel", href: "/dashboard/walas/mapel/recap", icon: ChartColumnBig },
] satisfies StaffSidebarItem[];

export function buildWalasSidebarItems(opts: {
  isHomeroomTeacher: boolean;
  hasSubjectAssignments: boolean;
}): StaffSidebarItem[] {
  const items: StaffSidebarItem[] = [];
  if (opts.isHomeroomTeacher) {
    items.push(
      { label: "Dashboard", href: "/dashboard/walas", icon: LayoutDashboard },
      { label: "Siswa Kelas", href: "/dashboard/walas/students", icon: Users },
      { label: "Absensi Kelas", href: "/dashboard/walas/attendance", icon: ClipboardList },
      { label: "Pengajuan", href: "/dashboard/walas/submissions", icon: FileClock },
    );
  }
  if (opts.hasSubjectAssignments) {
    items.push(...guruMapelSidebarItems);
  }
  if (items.length === 0) {
    items.push({ label: "Dashboard", href: "/dashboard/walas", icon: LayoutDashboard });
  }
  return items;
}

export const bkSidebarItems = [
  { label: "Dashboard", href: "/dashboard/bk", icon: LayoutDashboard },
  { label: "Siswa", href: "/dashboard/bk/students", icon: Users },
  { label: "Absensi", href: "/dashboard/bk/attendance", icon: BookOpenCheck },
  {
    label: "Konseling",
    href: "/dashboard/bk/counseling",
    icon: FileClock,
  },
  { label: "Pengajuan", href: "/dashboard/bk/submissions", icon: ClipboardList },
] satisfies StaffSidebarItem[];

export const studentSidebarItems = [
  { label: "Dashboard", href: "/dashboard/siswa", icon: LayoutDashboard },
  { label: "Histori Absen", href: "/dashboard/siswa/history", icon: History },
  { label: "Profile", href: "/dashboard/siswa/profile", icon: UserRound },
] satisfies StaffSidebarItem[];
