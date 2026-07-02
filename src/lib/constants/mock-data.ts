import { AttendanceRecord } from "@/types/attendance";

export const attendanceHistory: AttendanceRecord[] = [
  {
    id: "att-001",
    studentName: "Raka Pratama",
    className: "XI RPL 1",
    date: "11 Mei 2026",
    checkIn: "06:52",
    checkOut: "15:12",
    status: "hadir",
  },
  {
    id: "att-002",
    studentName: "Nabila Putri",
    className: "XI RPL 1",
    date: "11 Mei 2026",
    checkIn: "07:18",
    checkOut: "15:10",
    status: "telat",
  },
  {
    id: "att-003",
    studentName: "Dimas Alfarizi",
    className: "XI TKJ 2",
    date: "11 Mei 2026",
    checkIn: "-",
    checkOut: "-",
    status: "izin",
  },
  {
    id: "att-004",
    studentName: "Salsa Maharani",
    className: "X AKL 1",
    date: "11 Mei 2026",
    checkIn: "-",
    checkOut: "-",
    status: "sakit",
  },
];
