import axios from "axios";

export type ErrorContext =
  "login" | "student" | "staff" | "admin" | "attendance" | "upload" | "report";

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string>;
};

const fallbackMessages: Record<ErrorContext, string> = {
  login: "Ada gangguan pada sistem login. Silakan coba lagi beberapa saat.",
  student:
    "Ada gangguan pada sistem portal siswa. Silakan coba lagi beberapa saat.",
  staff:
    "Ada gangguan pada sistem dashboard staff. Silakan coba lagi beberapa saat.",
  admin:
    "Ada gangguan pada sistem dashboard admin. Silakan coba lagi beberapa saat.",
  attendance:
    "Ada gangguan pada sistem absensi. Silakan coba lagi beberapa saat.",
  upload:
    "Ada gangguan pada sistem unggah berkas. Silakan coba lagi beberapa saat.",
  report: "Ada gangguan pada sistem laporan. Silakan coba lagi beberapa saat.",
};

function looksTechnical(message: string) {
  return (
    /\b(error|exception|invalid credentials|invalid request|invalid input|validation failed|internal server|timeout|network|sql|mysql|gorm|duplicate entry|not found|already exists|unauthorized|forbidden|bad request)\b/i.test(
      message,
    ) || /https?:\/\/|\b\d{3}\b/.test(message)
  );
}

const fieldLabels: Record<string, string> = {
  nis: "NIS",
  username: "Username",
  name: "Nama",
  code: "Kode",
  email: "Email",
  password: "Password",
  new_password: "Password baru",
  school_year: "Tahun ajaran",
};

function readRequestValue(data: unknown, field: string) {
  if (!data) return undefined;
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const value = data.get(field);
    return typeof value === "string" ? value.trim() || undefined : undefined;
  }
  if (typeof data === "string") {
    try {
      return readRequestValue(JSON.parse(data), field);
    } catch {
      return undefined;
    }
  }
  if (typeof data === "object") {
    const value = (data as Record<string, unknown>)[field];
    return typeof value === "string" || typeof value === "number"
      ? String(value).trim() || undefined
      : undefined;
  }
  return undefined;
}

function quoted(value: string | undefined) {
  return value ? ` \"${value}\"` : "";
}

function duplicateMessage(
  message: string,
  endpoint: string,
  requestData?: unknown,
) {
  const value = message.toLowerCase();
  const duplicateEntry = message
    .match(/duplicate entry ['\"]?([^'\"]+)/i)?.[1]
    ?.trim();
  const nis = readRequestValue(requestData, "nis") ?? duplicateEntry;
  const username = readRequestValue(requestData, "username") ?? duplicateEntry;
  if (
    /\busername\b/.test(value) ||
    (username && /duplicate entry/i.test(value))
  ) {
    return `Username${quoted(username)} sudah digunakan.`;
  }
  if (
    /\bnis\b/.test(value) ||
    (endpoint.includes("/students") && /duplicate entry/i.test(value))
  ) {
    return `NIS dengan nomor${quoted(nis)} sudah terdaftar.`;
  }
  if (/teacher profile/.test(value))
    return "Akun guru tersebut sudah memiliki profil.";
  if (/teacher subject assignment/.test(value))
    return "Penugasan mata pelajaran guru tersebut sudah ada.";
  if (/homeroom/.test(value))
    return "Penugasan wali kelas untuk data tersebut sudah ada.";
  if (/student class membership/.test(value))
    return "Siswa tersebut sudah terdaftar pada kelas ini.";
  if (/school holiday/.test(value))
    return "Libur sekolah dengan nama dan periode tersebut sudah ada.";
  if (/\bclass\b/.test(value))
    return "Kelas untuk jurusan dan tahun ajaran tersebut sudah ada.";
  if (/duplicate day and start time/.test(value))
    return "Jadwal pada hari dan jam mulai tersebut sudah ada.";
  if (endpoint.includes("/school-years"))
    return "Tahun ajaran tersebut sudah ada.";
  if (endpoint.includes("/school-units"))
    return "Unit sekolah tersebut sudah ada.";
  if (endpoint.includes("/majors")) return "Jurusan tersebut sudah ada.";
  if (endpoint.includes("/subjects"))
    return "Mata pelajaran tersebut sudah ada.";
  if (endpoint.includes("/classes")) return "Kelas tersebut sudah ada.";
  if (endpoint.includes("/students")) return "Data siswa tersebut sudah ada.";
  return "Data tersebut sudah ada. Periksa kembali isian Anda.";
}

function humanizeMessage(
  message: string,
  context: ErrorContext,
  endpoint = "",
  field?: string,
  requestData?: unknown,
) {
  const normalized = message.trim();
  if (!normalized) return undefined;
  if (/sudah (terdaftar|digunakan)|already exists|duplicate/i.test(normalized))
    return duplicateMessage(normalized, endpoint, requestData);
  if (/is required/i.test(normalized) && field)
    return `${fieldLabels[field] ?? "Data"} wajib diisi.`;
  if (/is invalid|must be valid/i.test(normalized) && field)
    return `${fieldLabels[field] ?? "Data"} belum valid. Periksa kembali isian Anda.`;
  if (looksTechnical(normalized)) return undefined;
  return normalized;
}

export function getUserErrorMessage(
  error: unknown,
  context: ErrorContext = "staff",
) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status;
    const body = error.response?.data;
    const endpoint = error.config?.url ?? "";
    const requestData = error.config?.data;

    if (status === 401) {
      if (context === "login" || endpoint.includes("/auth/login")) {
        return endpoint.includes("/student") || context === "student"
          ? "NIS atau password salah."
          : "Username atau password salah.";
      }
      return "Sesi login sudah berakhir. Silakan masuk kembali.";
    }
    if (status === 403)
      return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
    if (status === 404) return "Data yang diminta tidak ditemukan.";
    if (status === 409) {
      const message = body?.message ?? "";
      return duplicateMessage(message, endpoint, requestData);
    }
    if (status === 413)
      return "Ukuran berkas terlalu besar. Silakan pilih berkas yang lebih kecil.";
    if (status === 429)
      return "Terlalu banyak percobaan. Silakan tunggu sebentar lalu coba lagi.";

    const validationMessage = Object.entries(body?.errors ?? {})
      .map(([field, value]) =>
        humanizeMessage(value, context, endpoint, field, requestData),
      )
      .find(Boolean);
    const message =
      humanizeMessage(
        body?.message ?? "",
        context,
        endpoint,
        undefined,
        requestData,
      ) ?? validationMessage;
    if (message) return message;
    return fallbackMessages[context];
  }

  if (error instanceof Error) {
    const message = humanizeMessage(error.message, context);
    if (message) return message;
  }
  return fallbackMessages[context];
}
