export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export function isBlank(value: unknown) {
  return value === undefined || value === null || String(value).trim().length === 0;
}

export function hasFieldErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

export function validateRequired<T extends string>(
  errors: FieldErrors<T>,
  field: T,
  value: unknown,
  label: string,
) {
  if (isBlank(value)) {
    errors[field] = `${label} wajib diisi.`;
  }
}

export function validateMinLength<T extends string>(
  errors: FieldErrors<T>,
  field: T,
  value: string,
  minLength: number,
  label: string,
  options?: { allowEmpty?: boolean },
) {
  const trimmed = value.trim();
  if (options?.allowEmpty && trimmed.length === 0) return;
  if (trimmed.length < minLength) {
    errors[field] = `${label} minimal ${minLength} karakter.`;
  }
}

export function validateExactDigits<T extends string>(
  errors: FieldErrors<T>,
  field: T,
  value: string,
  digitCount: number,
  label: string,
  options?: { allowEmpty?: boolean },
) {
  const trimmed = value.trim();
  if (options?.allowEmpty && trimmed.length === 0) return;
  if (!new RegExp(`^\\d{${digitCount}}$`).test(trimmed)) {
    errors[field] = `${label} harus berisi ${digitCount} digit angka.`;
  }
}

export function validatePhone<T extends string>(
  errors: FieldErrors<T>,
  field: T,
  value: string,
  label: string,
  options?: { allowEmpty?: boolean },
) {
  const trimmed = value.trim();
  if (options?.allowEmpty && trimmed.length === 0) return;
  if (!/^0\d{9,14}$/.test(trimmed)) {
    errors[field] = `${label} harus berupa nomor Indonesia, contoh 081234567890.`;
  }
}

export function validateYear<T extends string>(
  errors: FieldErrors<T>,
  field: T,
  value: number,
  label: string,
) {
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(value) || value < 2000 || value > currentYear + 1) {
    errors[field] = `${label} harus berupa tahun valid.`;
  }
}

export function validateDate<T extends string>(
  errors: FieldErrors<T>,
  field: T,
  value: string,
  label: string,
  options?: { allowEmpty?: boolean },
) {
  const trimmed = value.trim();
  if (options?.allowEmpty && trimmed.length === 0) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || Number.isNaN(new Date(`${trimmed}T00:00:00`).getTime())) {
    errors[field] = `${label} harus dipilih dengan format tanggal yang valid.`;
  }
}

export function validateTime<T extends string>(
  errors: FieldErrors<T>,
  field: T,
  value: string,
  label: string,
) {
  if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value.trim())) {
    errors[field] = `${label} harus memakai format HH:mm:ss, contoh 06:30:00.`;
  }
}
