"use client";

import { AttendanceStatusBadge } from "@/components/attendance/attendance-status-badge";
import { AttendanceRecord } from "@/types/attendance";
import { ColumnDef } from "@tanstack/react-table";

export const attendanceColumns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: "studentName",
    header: "Nama Siswa",
  },
  {
    accessorKey: "className",
    header: "Kelas",
  },
  {
    accessorKey: "date",
    header: "Tanggal",
  },
  {
    accessorKey: "checkIn",
    header: "Masuk",
  },
  {
    accessorKey: "checkOut",
    header: "Pulang",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <AttendanceStatusBadge status={row.original.status} />
    ),
  },
];
