export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "absensi-cn-theme";
const THEME_CHANGE_EVENT = "absensi-cn-theme-change";

let themeTransitionTimer: number | undefined;
let themeTransitionId = 0;

export function getStoredTheme(): AppTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setAppTheme(theme: AppTheme) {
  const root = document.documentElement;
  const currentTheme = getStoredTheme();
  const transitionId = ++themeTransitionId;

  if (currentTheme === theme && !root.classList.contains("theme-switching")) {
    return;
  }

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

  if (themeTransitionTimer !== undefined) {
    window.clearTimeout(themeTransitionTimer);
  }

  // The overlay hides the palette commit, so every surface can switch in the
  // same frame without a per-component cascade or a costly page snapshot.
  root.style.setProperty(
    "--theme-transition-overlay",
    theme === "dark" ? "#0b1320" : "#f8fafc",
  );
  root.classList.remove("theme-switching-fade");
  root.classList.add("theme-switching", "theme-switching-instant");

  // Commit the palette in the same task as the click. Waiting for a frame and
  // forcing layout here was noticeably slower on dashboard pages with charts,
  // tables, and many themed surfaces.
  applyTheme();

  window.requestAnimationFrame(() => {
    if (transitionId !== themeTransitionId) return;
    root.classList.add("theme-switching-fade");
    themeTransitionTimer = window.setTimeout(() => {
      if (transitionId !== themeTransitionId) return;
      root.classList.remove(
        "theme-switching",
        "theme-switching-fade",
        "theme-switching-instant",
      );
      root.style.removeProperty("--theme-transition-overlay");
      themeTransitionTimer = undefined;
    }, 220);
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
