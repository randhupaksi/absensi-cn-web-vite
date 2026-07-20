import type { AdminSchoolHoliday } from "@/types/admin";

const DAY_IN_MILLISECONDS = 86_400_000;

export function jakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatHolidayPeriod(item: AdminSchoolHoliday) {
  if (item.start_date === item.end_date) return formatSchoolDate(item.start_date);
  return `${formatSchoolDate(item.start_date)} – ${formatSchoolDate(item.end_date)}`;
}

export function holidayDurationDays(item: AdminSchoolHoliday) {
  return Math.round((schoolDateTimestamp(item.end_date) - schoolDateTimestamp(item.start_date)) / DAY_IN_MILLISECONDS) + 1;
}

export function holidayPeriodState(item: AdminSchoolHoliday, today: string) {
  if (!item.is_active) return "Tidak memengaruhi absensi";
  if (item.end_date < today) return "Periode selesai";
  if (item.start_date > today) return "Akan datang";
  return "Sedang berlangsung";
}

export function countEffectiveHolidayDays(items: AdminSchoolHoliday[], year: number) {
  const dates = new Set<string>();
  const lower = `${year}-01-01`;
  const upper = `${year}-12-31`;

  for (const item of items) {
    const start = schoolDateTimestamp(item.start_date < lower ? lower : item.start_date);
    const end = schoolDateTimestamp(item.end_date > upper ? upper : item.end_date);
    for (let timestamp = start; timestamp <= end; timestamp += DAY_IN_MILLISECONDS) {
      const cursor = new Date(timestamp);
      if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) {
        dates.add(cursor.toISOString().slice(0, 10));
      }
    }
  }
  return dates.size;
}

function schoolDateTimestamp(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatSchoolDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(schoolDateTimestamp(value)));
}
