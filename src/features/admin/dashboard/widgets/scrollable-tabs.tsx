"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { observeElementResize } from "@/lib/observe-element-resize";

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
    const resizeCleanup = observeElementResize(el, update);
    return () => {
      el.removeEventListener("scroll", update);
      resizeCleanup();
    };
  }, []);

  return (
    <div className="relative h-14 min-h-14 max-h-14 overflow-hidden overscroll-y-none">
      <button
        type="button"
        aria-label="Scroll kiri"
        onClick={() =>
          scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })
        }
        className={`xl:hidden absolute left-0 top-[calc(50%-10px)] z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white/95 transition-[background-color,border-color,opacity,transform] duration-200 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 dark:border-emerald-700 dark:bg-slate-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/60 ${canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronLeft className="size-4 text-emerald-600" />
      </button>

      <div
        ref={scrollRef}
        className="h-full w-full overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden xl:overflow-visible"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Scroll kanan"
        onClick={() =>
          scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })
        }
        className={`xl:hidden absolute right-0 top-[calc(50%-10px)] z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white/95 transition-[background-color,border-color,opacity,transform] duration-200 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 dark:border-emerald-700 dark:bg-slate-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/60 ${canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronRight className="size-4 text-emerald-600" />
      </button>
    </div>
  );
}
