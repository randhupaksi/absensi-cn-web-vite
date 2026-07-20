import type { StaffAttendanceRecord } from "@/types/staff";
import type {
  AttendanceLocationCapture,
  AttendanceLocationEvidence,
  AttendanceLocationPolicy,
} from "@/types/location";

export type StudentProfile = {
  id: string;
  user_id: string;
  name: string;
  nis: string;
  nisn?: string;
  gender?: string;
  is_active: boolean;
  class_id?: string;
  class_name?: string;
  school_unit_id?: string;
  school_unit_code?: string;
  major_code?: string;
  major_name?: string;
  school_year_id?: string;
  school_year_name?: string;
  membership_id?: string;
  membership_status?: string;
};

export type StudentSubmission = AttendanceLocationEvidence & {
  id: string;
  student_id: string;
  student_name: string;
  nis: string;
  class_id?: string;
  class_name?: string;
  type: string;
  reason: string;
  attachment?: string;
  status: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_note?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type StudentStats = {
  total_attendance: number;
  present: number;
  permission: number;
  sick: number;
  alpha: number;
  pending_reviews: number;
  pending_requests: number;
};

export type StudentToday = {
  profile: StudentProfile;
  window: {
    check_in_start: string;
    on_time_until: string;
    late_until: string;
  };
  attendance?: StaffAttendanceRecord;
  is_school_day?: boolean;
  can_submit: boolean;
  cooldown_until?: string;
  current_status: string;
  current_time: string;
  message: string;
  location_policy?: AttendanceLocationPolicy;
};

export type StudentNotification = {
  id: string;
  title: string;
  description: string;
  tone: string;
  created_at?: string;
};

export type StudentDashboard = {
  today: StudentToday;
  stats: StudentStats;
  recent_attendance: StaffAttendanceRecord[];
  recent_submissions: StudentSubmission[];
  notifications: StudentNotification[];
};

export type StudentHistory = {
  profile: StudentProfile;
  stats: StudentStats;
  attendance: StaffAttendanceRecord[];
  submissions: StudentSubmission[];
};

export type StudentDailyReportPayload = {
  type: "HADIR" | "IZIN" | "SAKIT";
  reason?: string;
  photo: File;
  location: AttendanceLocationCapture;
};
