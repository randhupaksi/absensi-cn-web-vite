export type AttendanceStatus = "hadir" | "telat" | "izin" | "sakit" | "alfa";

export type AttendanceRecord = {
  id: string;
  studentName: string;
  className: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
};
