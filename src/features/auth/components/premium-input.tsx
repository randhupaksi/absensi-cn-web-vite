"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { ComponentProps, useState } from "react";

type PremiumInputProps = ComponentProps<typeof Input> & {
  icon: LucideIcon;
  trailing?: React.ReactNode;
};

export function PremiumInput({
  className,
  icon: Icon,
  trailing,
  onFocus,
  onBlur,
  ...props
}: PremiumInputProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      animate={{
        y: focused ? -2 : hovered ? -1 : 0,
        boxShadow: focused
          ? "0 24px 54px rgba(36, 140, 103, 0.16)"
          : hovered
            ? "0 18px 38px rgba(36, 140, 103, 0.1)"
            : "0 10px 24px rgba(16, 24, 40, 0.05)",
      }}
      transition={{ type: "spring", stiffness: 250, damping: 24 }}
      className="group relative rounded-[1.2rem]"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[1.2rem]"
        animate={{
          opacity: focused ? 1 : hovered ? 0.86 : 0.42,
          boxShadow: focused
            ? "inset 0 0 0 1px rgba(94, 198, 146, 0.9)"
            : hovered
              ? "inset 0 0 0 1px rgba(94, 198, 146, 0.55)"
              : "inset 0 0 0 1px rgba(255,255,255,0.6)",
        }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
        animate={{ opacity: focused ? 1 : hovered ? 0.82 : 0.48 }}
      />
      <motion.div
        animate={{
          scale: focused ? 1.12 : hovered ? 1.06 : 1,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-none absolute left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-emerald-800"
      >
        <Icon className="size-[1.05rem] text-emerald-800" strokeWidth={2.6} />
      </motion.div>
      <Input
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={cn(
          "h-12 rounded-[1.2rem] border border-white/60 bg-white/76 pl-11 text-[14px] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-12px_30px_rgba(255,255,255,0.2)] backdrop-blur-md transition duration-300 placeholder:text-slate-400 hover:border-emerald-300/85 hover:bg-white/88 focus-visible:border-emerald-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-200/55",
          trailing ? "pr-12" : "",
          className,
        )}
      />
      {trailing ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>
      ) : null}
    </motion.div>
  );
}
