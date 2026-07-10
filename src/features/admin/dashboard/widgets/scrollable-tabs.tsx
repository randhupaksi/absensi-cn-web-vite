"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

export function ScrollableTabsWrapper({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Scroll kiri"
        onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
        className={`xl:hidden absolute left-0 top-1/2 z-20 flex size-8 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-[0_6px_18px_rgba(16,185,129,0.18)] transition-all duration-200 ${canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronLeft className="size-4 text-emerald-600" />
      </button>

      <div
        ref={scrollRef}
        className="overflow-x-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:overflow-visible"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Scroll kanan"
        onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
        className={`xl:hidden absolute right-0 top-1/2 z-20 flex size-8 translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-[0_6px_18px_rgba(16,185,129,0.18)] transition-all duration-200 ${canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronRight className="size-4 text-emerald-600" />
      </button>

      <div className="pointer-events-none absolute right-0 top-0 h-[calc(100%-10px)] w-20 bg-gradient-to-l from-white via-white/75 to-transparent xl:hidden" />
    </div>
  );
}
