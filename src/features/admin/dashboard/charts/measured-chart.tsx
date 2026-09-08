"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { observeElementResize } from "@/lib/observe-element-resize";

type MeasuredChartProps = {
  className?: string;
  children: (size: { width: number; height: number }) => ReactNode;
};

export function MeasuredChart({ className, children }: MeasuredChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    let frameId: number | undefined;
    const updateSize = () => {
      if (frameId !== undefined) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = undefined;
        const nextWidth = element.clientWidth;
        const nextHeight = element.clientHeight;

        setSize((current) => {
          if (current.width === nextWidth && current.height === nextHeight) {
            return current;
          }

          return {
            width: nextWidth,
            height: nextHeight,
          };
        });
      });
    };

    updateSize();

    const cleanupObserver = observeElementResize(element, updateSize);
    return () => {
      cleanupObserver();
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
