const RENDER_MODE_ATTRIBUTE = "data-render-mode";

export type RenderMode = "standard" | "compat";

/**
 * Choose rendering by browser capabilities rather than device model, RAM, or
 * viewport size. A newer browser on an older phone keeps the standard UI,
 * while an outdated WebView receives a stable, lower-compositing version.
 */
export function resolveRenderMode(): RenderMode {
  if (typeof window === "undefined" || !window.CSS?.supports) {
    return "compat";
  }

  const supportsModernColorMix = window.CSS.supports(
    "color",
    "color-mix(in srgb, red, blue)",
  );
  const supportsBackdropFilter =
    window.CSS.supports("backdrop-filter", "blur(1px)") ||
    window.CSS.supports("-webkit-backdrop-filter", "blur(1px)");

  return supportsModernColorMix && supportsBackdropFilter
    ? "standard"
    : "compat";
}

export function applyRenderMode() {
  if (typeof document === "undefined") return "compat" as const;

  const mode = resolveRenderMode();
  document.documentElement.setAttribute(RENDER_MODE_ATTRIBUTE, mode);
  return mode;
}

export function isCompatibilityRenderMode() {
  if (typeof document === "undefined") return true;
  return (
    document.documentElement.getAttribute(RENDER_MODE_ATTRIBUTE) === "compat"
  );
}
