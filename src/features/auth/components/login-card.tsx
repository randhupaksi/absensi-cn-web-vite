"use client";

import { LoginForm } from "@/features/auth/components/login-form";
import { Badge } from "@/components/ui/badge";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { AppImage as Image } from "@/components/media/app-image";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PortalType } from "@/lib/validations/login-schema";

type LoginCardProps = {
  portal: PortalType;
};

const portalContent = {
  student: {
    badge: "Portal Siswa",
    title: "Absensi CN",
    subtitle: "Masuk dengan NIS untuk melakukan absensi dan melihat riwayat kehadiran.",
    intro: "Akses absensi siswa.",
    introDetail: "Gunakan NIS sekolah dan password akun siswa.",
    formShell:
      "rounded-[1.7rem] border border-white/60 bg-white/42 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md sm:p-5",
    footer: "Copyright 2026 SMK Citra Negara. All rights reserved.",
  },
  staff: {
    badge: "Portal Staff",
    title: "Ruang Staff CN",
    subtitle: "Masuk dengan username untuk wali kelas, BK, dan admin sekolah.",
    intro: "Akses operasional sekolah.",
    introDetail: "Gunakan username staff yang sudah terdaftar oleh admin.",
    formShell:
      "rounded-[1.7rem] border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(236,253,245,0.38))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_18px_48px_rgba(15,118,110,0.08)] backdrop-blur-md sm:p-5",
    footer: "Copyright 2026 SMK Citra Negara. All rights reserved.",
  },
} satisfies Record<PortalType, {
  badge: string;
  title: string;
  subtitle: string;
  intro: string;
  introDetail: string;
  formShell: string;
  footer: string;
}>;

export function LoginCard({ portal }: LoginCardProps) {
  const content = portalContent[portal];
  const prefersReducedMotion = useReducedMotion();
  const [supportsInteractiveTilt, setSupportsInteractiveTilt] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const glowX = useSpring(useMotionValue(50), { stiffness: 200, damping: 24 });
  const glowY = useSpring(useMotionValue(50), { stiffness: 200, damping: 24 });
  const frameRef = useRef<number | null>(null);
  const boundsRef = useRef<DOMRect | null>(null);

  const cardTransform = useMotionTemplate`perspective(1600px) translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  const glowPosition = useMotionTemplate`${glowX}% ${glowY}%`;

  useEffect(() => {
    const tiltQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const touchQuery = window.matchMedia("(hover: none)");

    const updateSupport = () => {
      setSupportsInteractiveTilt(tiltQuery.matches);
      setIsTouchDevice(touchQuery.matches);
    };

    updateSupport();
    tiltQuery.addEventListener("change", updateSupport);
    touchQuery.addEventListener("change", updateSupport);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      tiltQuery.removeEventListener("change", updateSupport);
      touchQuery.removeEventListener("change", updateSupport);
    };
  }, []);

  return (
    <motion.section
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
      onMouseEnter={(event) => {
        if (!supportsInteractiveTilt || prefersReducedMotion) {
          return;
        }

        boundsRef.current = event.currentTarget.getBoundingClientRect();
      }}
      onMouseMove={(event) => {
        if (!supportsInteractiveTilt || prefersReducedMotion) {
          return;
        }

        const rect = boundsRef.current ?? event.currentTarget.getBoundingClientRect();
        boundsRef.current = rect;

        const clientX = event.clientX;
        const clientY = event.clientY;

        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
        }

        frameRef.current = requestAnimationFrame(() => {
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          const rotateXValue = (y / rect.height - 0.5) * -2.4;
          const rotateYValue = (x / rect.width - 0.5) * 2.4;

          rotateX.set(rotateXValue);
          rotateY.set(rotateYValue);
          glowX.set((x / rect.width) * 100);
          glowY.set((y / rect.height) * 100);
        });
      }}
      onMouseLeave={() => {
        boundsRef.current = null;
        rotateX.set(0);
        rotateY.set(0);
        glowX.set(50);
        glowY.set(50);
      }}
    >
      <div className="absolute inset-0 rounded-[2.2rem] bg-[linear-gradient(135deg,rgba(62,184,129,0.14),rgba(255,255,255,0.16),rgba(162,215,140,0.08))] blur-lg" />
      <motion.div
        style={{
          transform: !supportsInteractiveTilt || prefersReducedMotion ? "none" : cardTransform,
          willChange: supportsInteractiveTilt && !prefersReducedMotion ? "transform" : "auto",
        }}
        className="relative transform-gpu backface-hidden overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/62 p-5 shadow-[0_28px_90px_rgba(22,85,58,0.14)] backdrop-blur-md sm:p-7 lg:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0))]" />
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={
            !supportsInteractiveTilt || prefersReducedMotion
              ? undefined
              : {
                  backgroundImage:
                    "radial-gradient(circle at var(--spotlight), rgba(255,255,255,0.34), transparent 28%)",
                  ["--spotlight" as string]: glowPosition,
                }
          }
        />
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-[-20%] w-1/2 transform-gpu bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.22),transparent)] will-change-transform"
          animate={prefersReducedMotion || isTouchDevice ? undefined : { x: ["-30%", "180%"] }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", repeatDelay: 2.4 }
          }
        />

        <div className="relative space-y-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="rounded-full border border-white/70 bg-white/65 px-3.5 py-1 text-emerald-800 shadow-sm hover:bg-white/65">
                  <Sparkles className="size-4" />
                  {content.badge}
                </Badge>
                <div className="flex items-center gap-4 sm:gap-5">
                  <motion.div
                    whileHover={supportsInteractiveTilt ? { y: -2, scale: 1.02 } : undefined}
                    transition={supportsInteractiveTilt ? { type: "spring", stiffness: 240, damping: 18 } : undefined}
                    className="relative shrink-0"
                  >
                    <div className="absolute inset-0 rounded-full bg-emerald-200/30 blur-md" />
                    <motion.div
                      animate={prefersReducedMotion || isTouchDevice ? undefined : { y: [0, -3, 0] }}
                      transition={
                        prefersReducedMotion
                          ? undefined
                          : {
                              type: "tween",
                              ease: "easeInOut",
                              duration: 6.4,
                              repeat: Number.POSITIVE_INFINITY,
                            }
                      }
                      className="relative h-22 w-22"
                    >
                      <Image
                        src="/images/optimized/logo-cn.png"
                        alt="Logo SMK Citra Negara"
                        fill
                        sizes="88px"
                        className="object-contain drop-shadow-[0_10px_22px_rgba(22,85,58,0.14)]"
                        priority
                      />
                    </motion.div>
                  </motion.div>

                  <div className="space-y-1.5">
                    <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                      {content.title}
                    </h1>
                    <p className="max-w-sm text-sm leading-6 text-slate-600 sm:text-[15px]">
                      {content.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={supportsInteractiveTilt ? { y: -2, scale: 1.03 } : undefined}
                transition={supportsInteractiveTilt ? { type: "spring", stiffness: 240, damping: 18 } : undefined}
                className="hidden md:block"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-[1.6rem] bg-emerald-200/45 blur-md" />
                  <div className="relative rounded-[1.45rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.62))] p-3.5 shadow-[0_16px_38px_rgba(16,24,40,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md">
                    <ShieldCheck className="size-[1.05rem] text-emerald-700" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">
                {content.intro}
              </p>
              <p className="text-sm text-slate-500">
                {content.introDetail}
              </p>
            </div>

          </div>

          <div className={content.formShell}>
            <LoginForm key={portal} portal={portal} />
          </div>

          <div className="flex items-center justify-center gap-3 text-center text-xs text-slate-500">
            <p>{content.footer}</p>
           
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
