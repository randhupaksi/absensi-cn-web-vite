import { BookOpenCheck, CircleAlert, Clock3, ShieldCheck } from "lucide-react";
import { AttendanceStatus } from "@/types/attendance";

export const stackHighlights = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "React Query",
  "Axios",
  "React Hook Form",
  "Zod",
  "TanStack Table",
  "Motion",
];

export const roleSummaries = [
  {
    title: "Siswa",
    description:
      "Login, absen masuk dan pulang, melihat riwayat absensi, serta mengajukan izin atau sakit.",
  },
  {
    title: "Wali Kelas",
    description:
      "Memantau siswa berdasarkan kelas, melihat rekap kehadiran, dan memvalidasi izin atau sakit.",
  },
  {
    title: "BK",
    description:
      "Fokus pada siswa bermasalah, pola telat atau alfa berulang, dan catatan pembinaan sederhana.",
  },
  {
    title: "Admin",
    description:
      "Mengelola data user, siswa, kelas, walas, serta memonitor keseluruhan data absensi.",
  },
];

export const roleOptions = [
  { label: "Siswa", value: "siswa" },
  { label: "Wali Kelas", value: "walas" },
  { label: "BK", value: "bk" },
  { label: "Admin", value: "admin" },
] as const;

export const attendanceStatusMap: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  hadir: {
    label: "Hadir",
    className: "rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 hover:bg-emerald-100",
  },
  telat: {
    label: "Telat",
    className: "rounded-full bg-amber-100 px-3 py-1 text-amber-800 hover:bg-amber-100",
  },
  izin: {
    label: "Izin",
    className: "rounded-full bg-sky-100 px-3 py-1 text-sky-800 hover:bg-sky-100",
  },
  sakit: {
    label: "Sakit",
    className: "rounded-full bg-violet-100 px-3 py-1 text-violet-800 hover:bg-violet-100",
  },
  alfa: {
    label: "Alfa",
    className: "rounded-full bg-rose-100 px-3 py-1 text-rose-800 hover:bg-rose-100",
  },
};

export const dashboardStats = [
  {
    label: "Hadir Hari Ini",
    value: "428",
    description: "Total siswa hadir tepat waktu.",
    icon: BookOpenCheck,
    colorClass: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Siswa Telat",
    value: "17",
    description: "Perlu dipantau wali kelas dan BK.",
    icon: Clock3,
    colorClass: "bg-amber-100 text-amber-700",
  },
  {
    label: "Pengajuan Izin",
    value: "12",
    description: "Menunggu validasi dari wali kelas.",
    icon: ShieldCheck,
    colorClass: "bg-sky-100 text-sky-700",
  },
  {
    label: "Siswa Perlu Pembinaan",
    value: "9",
    description: "Terdeteksi dari pola kehadiran bermasalah.",
    icon: CircleAlert,
    colorClass: "bg-rose-100 text-rose-700",
  },
];
