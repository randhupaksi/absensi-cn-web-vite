"use client";

import { motion } from "motion/react";

const shapes = [
  {
    className:
      "left-[7%] top-[15%] h-24 w-24 rounded-full border border-white/45 bg-white/18 shadow-[0_22px_70px_rgba(35,110,80,0.08)]",
    duration: 11,
  },
  {
    className:
      "right-[10%] top-[16%] h-14 w-14 rounded-full border border-white/40 bg-emerald-100/20 shadow-[0_18px_60px_rgba(35,110,80,0.06)]",
    duration: 9,
  },
  {
    className:
      "left-[42%] bottom-[18%] h-32 w-32 rounded-full border border-white/35 bg-white/14 shadow-[0_18px_60px_rgba(35,110,80,0.08)]",
    duration: 13,
  },
  {
    className:
      "right-[18%] bottom-[12%] h-16 w-16 rounded-[1.65rem] border border-lime-100/40 bg-lime-100/18 shadow-[0_18px_50px_rgba(160,190,90,0.08)]",
    duration: 10,
  },
];

export function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {shapes.map((shape, index) => (
        <motion.div
          key={shape.className}
          className={`absolute hidden transform-gpu will-change-transform lg:block ${shape.className}`}
          animate={{
            y: [0, -14 - index * 2, 0],
            x: [0, index % 2 === 0 ? 10 : -10, 0],
            rotate: [0, index % 2 === 0 ? 4 : -4, 0],
          }}
          transition={{
            duration: shape.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
