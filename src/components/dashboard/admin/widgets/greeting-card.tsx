"use client";

import { motion } from "motion/react";
import { BadgeCheck, CalendarDays, RadioTower } from "lucide-react";

type GreetingCardProps = {
  adminName: string;
};

const badges = [
  { label: "Hari ini", icon: CalendarDays },
  { label: "Sistem aktif", icon: BadgeCheck },
  { label: "Data real-time lokal", icon: RadioTower },
];

export function GreetingCard({ adminName }: GreetingCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="overflow-hidden rounded-[34px] border border-white/75 bg-[linear-gradient(135deg,#fffdf9_0%,#f8f4ea_48%,#eef9f3_100%)] p-6 shadow-[0_24px_60px_rgba(150,163,184,0.14)]"
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.72fr]">
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

        <div className="relative min-h-[180px] overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,198,103,0.35),transparent_36%),linear-gradient(180deg,#f7faf7_0%,#ebf4ef_100%)]">
          <div className="absolute -right-6 top-4 size-28 rounded-full bg-amber-200/75 blur-2xl" />
          <div className="absolute inset-x-12 bottom-10 h-4 rounded-full bg-slate-300/35 blur-xl" />
          <div className="absolute bottom-7 left-8 h-20 w-20 rounded-[26px] bg-emerald-100/90" />
          <div className="absolute bottom-10 left-22 h-24 w-24 rounded-[30px] border-[14px] border-slate-300/80 border-b-transparent border-l-transparent rotate-12" />
          <div className="absolute bottom-8 right-18 h-24 w-11 rounded-full bg-[#ff962d]" />
          <div className="absolute bottom-18 right-20 h-16 w-9 rounded-full bg-[#252348]" />
          <div className="absolute bottom-26 right-24 h-11 w-11 rounded-full bg-[#ffcfb2]" />
        </div>
      </div>
    </motion.article>
  );
}
