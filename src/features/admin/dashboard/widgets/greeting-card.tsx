"use client";

import { motion } from "motion/react";
import { AppLink as Link } from "@/components/router/app-link";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarDays,
  GraduationCap,
  RadioTower,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

type GreetingCardProps = {
  adminName: string;
};

const badges = [
  { label: "Hari ini", icon: CalendarDays },
  { label: "Sistem aktif", icon: BadgeCheck },
  { label: "Data real-time lokal", icon: RadioTower },
];

const quickActions = [
  {
    label: "Kelola Guru",
    href: "/dashboard/admin/teachers",
    icon: GraduationCap,
    iconClass: "bg-sky-50 text-sky-700 group-hover:bg-sky-100",
  },
  {
    label: "Kelola Siswa",
    href: "/dashboard/admin/students",
    icon: Users,
    iconClass: "bg-amber-50 text-amber-700 group-hover:bg-amber-100",
  },
  {
    label: "Manajemen Mapel",
    href: "/dashboard/admin/subjects",
    icon: BookOpenCheck,
    iconClass: "bg-violet-50 text-violet-700 group-hover:bg-violet-100",
  },
  {
    label: "Struktur Akademik",
    href: "/dashboard/admin/classes",
    icon: Building2,
    iconClass: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
  },
  {
    label: "Kelola Admin",
    href: "/dashboard/admin/admins",
    icon: ShieldCheck,
    iconClass: "bg-rose-50 text-rose-700 group-hover:bg-rose-100",
  },
  {
    label: "Role dan Akses",
    href: "/dashboard/admin/users",
    icon: UserCog,
    iconClass: "bg-cyan-50 text-cyan-700 group-hover:bg-cyan-100",
  },
];

export function GreetingCard({ adminName }: GreetingCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="overflow-hidden rounded-[34px] border border-white/75 bg-[linear-gradient(135deg,#fffdf9_0%,#f8f4ea_48%,#eef9f3_100%)] p-6 shadow-[0_24px_60px_rgba(150,163,184,0.14)]"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.72fr]">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.15rem]">
              Halo, {adminName}!
            </p>
            <p className="max-w-xl text-sm leading-7 text-slate-600 md:text-[15px]">
              Pantau kehadiran siswa, kelola data sekolah, dan jaga kualitas
              absensi dari satu dashboard yang ringkas dan nyaman dipakai setiap
              hari.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {badges.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/75 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm"
                >
                  <Icon className="size-3.5 text-emerald-600" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="relative hidden min-h-[180px] overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,198,103,0.35),transparent_36%),linear-gradient(180deg,#f7faf7_0%,#ebf4ef_100%)] md:block">
          <div className="absolute -right-6 top-4 size-28 rounded-full bg-amber-200/75 blur-2xl" />
          <div className="absolute inset-x-12 bottom-10 h-4 rounded-full bg-slate-300/35 blur-xl" />
          <div className="absolute bottom-7 left-8 h-20 w-20 rounded-[26px] bg-emerald-100/90" />
          <div className="absolute bottom-10 left-22 h-24 w-24 rounded-[30px] border-[14px] border-slate-300/80 border-b-transparent border-l-transparent rotate-12" />
          <div className="absolute bottom-8 right-18 h-24 w-11 rounded-full bg-[#ff962d]" />
          <div className="absolute bottom-18 right-20 h-16 w-9 rounded-full bg-[#252348]" />
          <div className="absolute bottom-26 right-24 h-11 w-11 rounded-full bg-[#ffcfb2]" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {quickActions.map(({ label, href, icon: Icon, iconClass }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-14 items-center justify-between gap-3 rounded-[20px] border border-white/80 bg-white/74 px-3 py-3 text-xs font-semibold text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-emerald-800 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)] sm:px-3.5 sm:text-sm"
          >
            <span className="inline-flex min-w-0 items-center gap-2 sm:gap-2.5">
              <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-2xl transition sm:size-9 ${iconClass}`}>
                <Icon className="size-4" />
              </span>
              <span className="truncate">{label}</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
          </Link>
        ))}
      </div>
    </motion.article>
  );
}
