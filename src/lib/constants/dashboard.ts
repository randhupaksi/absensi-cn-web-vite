import {
  BookOpenCheck,
  ChartColumn,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  type LucideIcon,
  NotebookPen,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import type { DashboardRole } from "@/types/auth";

export const roleDashboardConfig: Record<
  DashboardRole,
  {
    title: string;
    subtitle: string;
    badge: string;
    primaryAction: string;
    secondaryAction: string;
    stats: Array<{
      label: string;
      value: string;
      description: string;
      icon: typeof BookOpenCheck;
      colorClass: string;
    }>;
    highlights: string[];
    navigation: Array<{
      label: string;
      href: string;
      icon: LucideIcon;
    }>;
  }
> = {
  siswa: {
    title: "Dashboard siswa untuk absensi harian dan riwayat kehadiran.",
    subtitle:
      "Siswa diarahkan ke ringkasan absensi pribadi, status hari ini, serta akses cepat ke izin atau sakit.",
    badge: "Portal Siswa",
    primaryAction: "Lihat Riwayat Absensi",
    secondaryAction: "Ajukan Izin atau Sakit",
    stats: [
      {
        label: "Status Hari Ini",
        value: "Hadir",
        description: "Absensi masuk sudah tercatat.",
        icon: BookOpenCheck,
        colorClass: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Jam Masuk",
        value: "06:52",
        description: "Masuk tepat sebelum batas waktu.",
        icon: Clock3,
        colorClass: "bg-sky-100 text-sky-700",
      },
      {
        label: "Izin Bulan Ini",
        value: "2",
        description: "Pengajuan izin yang sudah tercatat.",
        icon: ClipboardCheck,
        colorClass: "bg-amber-100 text-amber-700",
      },
      {
        label: "Rekap Kehadiran",
        value: "94%",
        description: "Persentase hadir bulan berjalan.",
        icon: ChartColumn,
        colorClass: "bg-violet-100 text-violet-700",
      },
    ],
    highlights: [
      "Absen masuk dan pulang",
      "Riwayat kehadiran pribadi",
      "Pengajuan izin dan sakit",
    ],
    navigation: [
      { label: "Dashboard Siswa", href: "/dashboard/siswa", icon: LayoutDashboard },
      { label: "Absensi Saya", href: "/dashboard/siswa", icon: ClipboardCheck },
      { label: "Rekap Pribadi", href: "/dashboard/siswa", icon: ChartColumn },
    ],
  },
  walas: {
    title: "Dashboard wali kelas untuk memantau kehadiran per kelas.",
    subtitle:
      "Wali kelas melihat siswa telat, izin, dan rekap kelas yang perlu segera ditindaklanjuti.",
    badge: "Portal Wali Kelas",
    primaryAction: "Pantau Kelas Hari Ini",
    secondaryAction: "Validasi Izin Siswa",
    stats: [
      {
        label: "Siswa Hadir",
        value: "32",
        description: "Total hadir di kelas binaan.",
        icon: Users,
        colorClass: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Siswa Telat",
        value: "4",
        description: "Perlu pengecekan lanjutan.",
        icon: Clock3,
        colorClass: "bg-amber-100 text-amber-700",
      },
      {
        label: "Izin Masuk",
        value: "3",
        description: "Menunggu validasi wali kelas.",
        icon: ShieldCheck,
        colorClass: "bg-sky-100 text-sky-700",
      },
      {
        label: "Rekap Kelas",
        value: "XI RPL 1",
        description: "Kelas utama yang sedang dipantau.",
        icon: BookOpenCheck,
        colorClass: "bg-violet-100 text-violet-700",
      },
    ],
    highlights: [
      "Monitoring absensi per kelas",
      "Validasi izin dan sakit",
      "Deteksi siswa telat atau alfa",
    ],
    navigation: [
      { label: "Dashboard Walas", href: "/dashboard/walas", icon: LayoutDashboard },
      { label: "Absensi Kelas", href: "/dashboard/walas", icon: ClipboardCheck },
      { label: "Data Siswa", href: "/dashboard/walas", icon: Users },
    ],
  },
  bk: {
    title: "Dashboard BK untuk membaca pola keterlambatan dan pembinaan.",
    subtitle:
      "BK diarahkan ke monitoring siswa berulang telat, alfa, dan catatan tindak lanjut sederhana.",
    badge: "Portal BK",
    primaryAction: "Lihat Siswa Prioritas",
    secondaryAction: "Tambah Catatan BK",
    stats: [
      {
        label: "Kasus Aktif",
        value: "9",
        description: "Perlu pembinaan atau pemantauan.",
        icon: Shield,
        colorClass: "bg-rose-100 text-rose-700",
      },
      {
        label: "Telat Berulang",
        value: "5",
        description: "Siswa dengan pola telat konsisten.",
        icon: Clock3,
        colorClass: "bg-amber-100 text-amber-700",
      },
      {
        label: "Catatan Minggu Ini",
        value: "7",
        description: "Intervensi atau pembinaan tercatat.",
        icon: NotebookPen,
        colorClass: "bg-sky-100 text-sky-700",
      },
      {
        label: "Siswa Dipantau",
        value: "14",
        description: "Masuk daftar monitoring BK.",
        icon: Users,
        colorClass: "bg-violet-100 text-violet-700",
      },
    ],
    highlights: [
      "Monitoring siswa bermasalah",
      "Pola telat dan alfa berulang",
      "Catatan pembinaan singkat",
    ],
    navigation: [
      { label: "Dashboard BK", href: "/dashboard/bk", icon: LayoutDashboard },
      { label: "Monitoring BK", href: "/dashboard/bk", icon: Shield },
      { label: "Catatan Siswa", href: "/dashboard/bk", icon: NotebookPen },
    ],
  },
  admin: {
    title: "Dashboard admin untuk kontrol penuh data absensi sekolah.",
    subtitle:
      "Admin membaca statistik global, pengelolaan user, kelas, dan kondisi absensi lintas role dalam satu tempat.",
    badge: "Portal Admin",
    primaryAction: "Kelola Data User",
    secondaryAction: "Lihat Rekap Global",
    stats: [
      {
        label: "Total User",
        value: "124",
        description: "Akun siswa dan staff aktif.",
        icon: UserCog,
        colorClass: "bg-sky-100 text-sky-700",
      },
      {
        label: "Absensi Hari Ini",
        value: "428",
        description: "Total siswa sudah tercatat.",
        icon: ClipboardCheck,
        colorClass: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Perlu Validasi",
        value: "12",
        description: "Izin, sakit, atau data belum sinkron.",
        icon: ShieldCheck,
        colorClass: "bg-amber-100 text-amber-700",
      },
      {
        label: "Kelas Aktif",
        value: "18",
        description: "Seluruh kelas yang sedang dipakai.",
        icon: Users,
        colorClass: "bg-violet-100 text-violet-700",
      },
    ],
    highlights: [
      "Kelola user dan role",
      "Monitoring seluruh absensi",
      "Kontrol data kelas dan rekap",
    ],
    navigation: [
      { label: "Dashboard Admin", href: "/dashboard/admin", icon: LayoutDashboard },
      { label: "Kelola User", href: "/dashboard/admin", icon: UserCog },
      { label: "Rekap Sekolah", href: "/dashboard/admin", icon: ChartColumn },
    ],
  },
};
