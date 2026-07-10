"use client";

import { AppImage as Image } from "@/components/media/app-image";
import { motion } from "motion/react";
import { Menu } from "lucide-react";

type StaffTopbarProps = {
  userName: string;
  userLabel: string;
  title: string;
  eyebrow?: string;
  onToggleSidebar: () => void;
};

export function StaffTopbar({
  userName,
  userLabel,
  title,
  eyebrow = "Role Dashboard",
  onToggleSidebar,
}: StaffTopbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="sticky top-3 z-20 rounded-[24px] border border-white/70 bg-white/75 p-3 shadow-[0_20px_55px_rgba(153,161,179,0.12)] backdrop-blur-xl sm:top-4 sm:rounded-[30px] sm:p-4"
    >
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 sm:size-11 lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80 sm:text-xs sm:tracking-[0.22em]">
              {eyebrow}
            </p>

            <h1 className="mt-0.5 truncate text-[1.15rem] font-semibold tracking-[-0.04em] text-slate-900 sm:mt-1 sm:text-[1.7rem]">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <div className="flex max-w-[142px] items-center gap-2 rounded-full border border-slate-200/80 bg-white px-2 py-1.5 shadow-[0_12px_24px_rgba(148,163,184,0.12)] sm:max-w-none sm:gap-3 sm:px-3 sm:py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 sm:size-11">
              <Image
                src="/images/optimized/logo-cn.png"
                alt={`Avatar ${userLabel}`}
                width={34}
                height={34}
                priority
                className="rounded-full"
                style={{ width: "auto", height: "auto" }}
              />
            </div>

            <div className="min-w-0 pr-1 sm:pr-2">
              <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                {userName}
              </p>

              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {userLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}