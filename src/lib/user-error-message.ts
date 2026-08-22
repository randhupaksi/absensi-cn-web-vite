import axios from "axios";

export type ErrorContext =
  "login" | "student" | "staff" | "admin" | "attendance" | "upload" | "report";

type ApiErrorBody = {
  code?: string;
  message?: string;
  errors?: Record<string, string>;
  request_id?: string;
};

const fallbackMessages: Record<ErrorContext, string> = {
  login: "Login belum dapat diproses. Silakan coba lagi.",
  student: "Data siswa belum dapat dimuat. Silakan coba lagi.",
  staff: "Permintaan belum dapat diproses. Silakan coba lagi.",
  admin: "Permintaan admin belum dapat diproses. Silakan coba lagi.",
  attendance: "Absensi belum dapat diproses. Silakan coba lagi.",
  upload: "Berkas belum berhasil dikirim. Silakan coba lagi.",
  report: "Laporan belum dapat diproses. Silakan coba lagi.",
};

const codeMessages: Record<string, string> = {
  ACCESS_DENIED: "Kamu tidak memiliki izin untuk melakukan tindakan ini.",
  ATTENDANCE_ALREADY_RECORDED: "Absensi hari ini sudah tercatat.",
  ATTENDANCE_ALREADY_SUBMITTED: "Absensi hari ini sudah dikirim.",
  ATTENDANCE_DATA_UNAVAILABLE:
    "Data absensi sedang belum dapat diakses. Silakan coba lagi.",
  ATTENDANCE_HOLIDAY: "Absensi tidak dibuka pada hari libur.",
  ATTENDANCE_LOCATION_INVALID:
    "Data lokasi belum valid. Aktifkan lokasi lalu coba lagi.",
  ATTENDANCE_NOT_OPEN: "Absensi belum dibuka atau sudah ditutup.",
  ATTENDANCE_PHOTO_INVALID:
    "Foto absensi belum valid. Ambil foto baru lalu coba lagi.",
  ATTENDANCE_PHOTO_REQUIRED: "Foto absensi wajib diambil sebelum dikirim.",
  ATTENDANCE_PHOTO_TOO_LARGE:
    "Ukuran foto terlalu besar. Ambil foto baru dengan kualitas standar.",
  ATTENDANCE_REASON_REQUIRED: "Keterangan wajib diisi untuk izin atau sakit.",
  ATTENDANCE_TYPE_INVALID: "Jenis absensi belum valid.",
  AUTHENTICATION_REQUIRED: "Sesi login sudah berakhir. Silakan masuk kembali.",
  BAD_GATEWAY: "Layanan sekolah belum dapat dijangkau. Silakan coba lagi.",
  GATEWAY_TIMEOUT: "Respons server terlalu lama. Silakan coba lagi.",
  INTERNAL_ERROR: "Sistem mengalami kendala saat memproses permintaan.",
  PAYLOAD_TOO_LARGE:
    "Ukuran berkas terlalu besar. Pilih berkas yang lebih kecil.",
  RATE_LIMITED: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  RESOURCE_NOT_FOUND: "Data yang diminta tidak ditemukan.",
  SERVER_BUSY:
    "Server sedang menerima banyak permintaan. Tunggu sebentar lalu coba lagi.",
  SERVICE_UNAVAILABLE: "Layanan sedang tidak tersedia. Silakan coba lagi.",
  SYSTEM_MAINTENANCE:
    "Sistem sedang melakukan pembaruan. Tunggu sekitar 30 detik lalu coba lagi.",
  VALIDATION_FAILED: "Ada data yang belum sesuai. Periksa kembali isian kamu.",
};

export type UserErrorDetails = {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
  retryAfterSeconds?: number;
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
  return value ? ` "${value}"` : "";
}

function duplicateMessage(
  message: string,
  endpoint: string,
  requestData?: unknown,
) {
  const value = message.toLowerCase();
  const duplicateEntry = message
    .match(/duplicate entry ['"]?([^'"]+)/i)?.[1]
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
  return getUserErrorDetails(error, context).message;
}

export function getUserErrorDetails(
  error: unknown,
  context: ErrorContext = "staff",
): UserErrorDetails {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status;
    const body = error.response?.data;
    const code = body?.code;
    const endpoint = error.config?.url ?? "";
    const requestData = error.config?.data;
    const requestId =
      body?.request_id ?? readHeader(error.response?.headers?.["x-request-id"]);
    const retryAfterSeconds = readPositiveNumber(
      error.response?.headers?.["retry-after"],
    );

    if (status === 401) {
      if (context === "login" || endpoint.includes("/auth/login")) {
        return {
          message:
            endpoint.includes("/student") || context === "student"
              ? "NIS atau password salah"
              : "Username atau password salah",
          code,
          status,
          requestId,
        };
      }
      return {
        message: codeMessages.AUTHENTICATION_REQUIRED,
        code,
        status,
        requestId,
      };
    }
    if (code && codeMessages[code]) {
      return {
        message: codeMessages[code],
        code,
        status,
        requestId,
        retryAfterSeconds,
      };
    }
    if (status === 403)
      return { message: codeMessages.ACCESS_DENIED, code, status, requestId };
    if (status === 404)
      return {
        message: codeMessages.RESOURCE_NOT_FOUND,
        code,
        status,
        requestId,
      };
    if (status === 409) {
      const message = body?.message ?? "";
      return {
        message: duplicateMessage(message, endpoint, requestData),
        code,
        status,
        requestId,
      };
    }
    if (status === 413)
      return {
        message: codeMessages.PAYLOAD_TOO_LARGE,
        code,
        status,
        requestId,
      };
    if (status === 429)
      return {
        message: codeMessages.RATE_LIMITED,
        code,
        status,
        requestId,
        retryAfterSeconds,
      };

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
    if (message) return { message, code, status, requestId, retryAfterSeconds };
    return {
      message: fallbackMessages[context],
      code,
      status,
      requestId,
      retryAfterSeconds,
    };
  }

  if (error instanceof Error) {
    const message = humanizeMessage(error.message, context);
    if (message) return { message };
  }
  return { message: fallbackMessages[context] };
}

function readHeader(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readPositiveNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
