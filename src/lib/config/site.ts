export const siteConfig = {
  name: "Absensi CN",
  description:
    "Frontend web absensi sekolah untuk SMK Citra Negara dengan role siswa, walas, BK, dan admin.",
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
};

export function getApiOrigin() {
  try {
    return new URL(siteConfig.apiBaseUrl).origin;
  } catch {
    return "http://localhost:8080";
  }
}

export function resolveApiAssetUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${getApiOrigin()}${value.startsWith("/") ? value : `/${value}`}`;
}
