type ResizeCallback = () => void;

/** Safely observes layout changes on browsers with incomplete ResizeObserver support. */
export function observeElementResize(
  element: Element,
  callback: ResizeCallback,
) {
  const resizeObserverConstructor =
    typeof window !== "undefined" ? window.ResizeObserver : undefined;

  if (resizeObserverConstructor) {
    try {
      const observer = new resizeObserverConstructor(callback);
      observer.observe(element);
      return () => observer.disconnect();
    } catch {
      // Fall through to the window resize fallback.
    }
  }

  if (typeof window === "undefined") return () => {};

  window.addEventListener("resize", callback, { passive: true });
  return () => window.removeEventListener("resize", callback);
}
