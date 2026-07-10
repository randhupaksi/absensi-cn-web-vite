"use client";

import { motion } from "motion/react";

const particles = [
  { left: "12%", top: "24%", delay: 0, size: "size-1.5" },
  { left: "28%", top: "68%", delay: 0.4, size: "size-1" },
  { left: "56%", top: "18%", delay: 0.8, size: "size-1.5" },
  { left: "74%", top: "58%", delay: 0.2, size: "size-1" },
  { left: "86%", top: "30%", delay: 0.6, size: "size-1.5" },
];

export function AmbientParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {particles.map((particle) => (
        <motion.span
          key={`${particle.left}-${particle.top}`}
          className={`absolute transform-gpu rounded-full bg-white/65 shadow-[0_0_20px_rgba(255,255,255,0.6)] will-change-transform ${particle.size}`}
          style={{ left: particle.left, top: particle.top }}
          animate={{ y: [0, -10, 0], opacity: [0.25, 0.8, 0.25], scale: [1, 1.2, 1] }}
          transition={{
            duration: 5.5,
            delay: particle.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
