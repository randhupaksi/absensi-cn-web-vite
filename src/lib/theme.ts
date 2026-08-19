export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "absensi-cn-theme";
const THEME_CHANGE_EVENT = "absensi-cn-theme-change";

type ThemeTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => unknown;
};

function canUsePageThemeTransition() {
  // `startViewTransition` snapshots the complete page. That gives desktop a
  // pleasant crossfade, but it is expensive on mobile GPUs and can cause a
  // delayed, shuttering switch on lower-end devices. Keep the full-page
  // transition for desktop-style pointers only; mobile changes immediately.
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    window.matchMedia("(min-width: 768px) and (pointer: fine)").matches
  );
}

export function getStoredTheme(): AppTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setAppTheme(theme: AppTheme) {
  const root = document.documentElement;
  const applyTheme = () => {
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    themeColor?.setAttribute("content", theme === "dark" ? "#101b2a" : "#047857");

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Privacy modes can deny storage. The selected theme still applies for
      // the current page session.
    }

    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const transitionDocument = document as ThemeTransitionDocument;

  if (canUsePageThemeTransition() && transitionDocument.startViewTransition) {
    try {
      transitionDocument.startViewTransition(applyTheme);
      return;
    } catch {
      // Some embedded browsers expose the API but cannot create a snapshot.
      // Fall through to the lightweight path rather than blocking a theme
      // change.
    }
  }

  // On touch devices, make every themed surface commit in the same frame.
  // This prevents cards, dialogs, charts, and controls with their own CSS
  // transitions from visibly changing one after another.
  root.classList.add("theme-switching-instant");
  applyTheme();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      root.classList.remove("theme-switching-instant");
    });
  });
}

export function subscribeToTheme(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    const theme: AppTheme = event.newValue === "dark" ? "dark" : "light";
    setAppTheme(theme);
    onStoreChange();
  };
  const handleThemeChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}
