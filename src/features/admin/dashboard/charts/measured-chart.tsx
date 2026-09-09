"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { observeElementResize } from "@/lib/observe-element-resize";

type MeasuredChartProps = {
  className?: string;
  children: (size: { width: number; height: number }) => ReactNode;
};

export function MeasuredChart({ className, children }: MeasuredChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
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

    // Measure before the browser paints the mounted chart container. This
    // avoids the visible zero-size frame that used to precede every chart.
    const initialWidth = element.clientWidth;
    const initialHeight = element.clientHeight;
    setSize({ width: initialWidth, height: initialHeight });

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
