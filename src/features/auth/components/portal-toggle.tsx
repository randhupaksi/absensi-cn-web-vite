"use client";

import { PortalType } from "@/lib/validations/login-schema";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { GraduationCap, Shield } from "lucide-react";

type PortalToggleProps = {
  value: PortalType;
  onChange: (value: PortalType) => void;
};

const items = [
  {
    label: "Portal Siswa",
    value: "student" as const,
    icon: GraduationCap,
  },
  {
    label: "Portal Staff",
    value: "staff" as const,
    icon: Shield,
  },
];

export function PortalToggle({ value, onChange }: PortalToggleProps) {
  return (
    <div className="relative grid grid-cols-2 rounded-[1.25rem] border border-white/60 bg-white/58 p-2 shadow-[0_16px_36px_rgba(16,24,40,0.05)] backdrop-blur-xl">
      <motion.div
        layout
        className={cn(
          "absolute bottom-2 top-2 w-[calc(50%-0.75rem)] rounded-[0.95rem] bg-[linear-gradient(135deg,rgba(26,160,119,0.98),rgba(111,201,136,0.96))] shadow-[0_12px_30px_rgba(20,154,115,0.28)]",
          value === "student" ? "left-2" : "left-[calc(50%+0.25rem)]",
        )}
        transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.9 }}
      />
      {items.map((item) => {
        const Icon = item.icon;
        const active = value === item.value;

        return (
          <motion.button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            whileHover={{ scale: active ? 1 : 1.01, y: active ? 0 : -0.5 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className={cn(
              "relative z-10 mx-1 my-0.5 flex h-10 items-center justify-center gap-2 rounded-[0.9rem] px-3 text-sm font-semibold transition-all duration-300 ease-out",
              active
                ? "text-white"
                : "text-slate-600 hover:bg-emerald-100/92 hover:text-emerald-800 hover:shadow-[0_10px_24px_rgba(36,140,103,0.1)]",
            )}
          >
            <motion.span
              animate={{ scale: active ? 1.04 : 1, y: active ? -0.5 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <Icon className="size-4" />
            </motion.span>
            <span className="truncate">{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
