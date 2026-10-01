import type { AuthSession } from "../src/types/auth";
import type { StudentDashboard, StudentHistory, StudentProfile, StudentToday } from "../src/types/student";
import type { StaffAttendanceRecord, StaffSubjectAssignment, StaffSubjectCurrentSession, StaffTeacherMe } from "../src/types/staff";
import type { SupportTicket } from "../src/types/support";

// Entirely invented identities. No seed, environment file, backend, or school
// dataset is read to construct these fixtures.
export const NOW = "2026-09-30T07:30:00+07:00";
export const DATE = "2026-09-30";
export const PASSWORD = "Synthetic-password-42!";
export const studentUser = { id: "user-student-e2e", name: "Siswa Sintetis", role: "STUDENT", portal: "student", nis: "99000001", has_bk_scope: false, must_change_password: false } as const;
export const teacherUser = { id: "user-teacher-e2e", name: "Guru Sintetis", role: "TEACHER", portal: "staff", username: "guru.sintetis", has_bk_scope: false, must_change_password: false } as const;
export const adminUser = { id: "user-admin-e2e", name: "Admin Sintetis", role: "ADMIN", portal: "staff", username: "admin.sintetis", has_bk_scope: false, must_change_password: false } as const;
export const sessions = {
  student: { accessToken: "synthetic-student-token", user: studentUser },
  teacher: { accessToken: "synthetic-teacher-token", user: teacherUser },
  bk: { accessToken: "synthetic-bk-token", user: { ...teacherUser, has_bk_scope: true } },
  admin: { accessToken: "synthetic-admin-token", user: adminUser },
} satisfies Record<string, AuthSession>;

export const profile: StudentProfile = {
  id: "student-e2e", user_id: studentUser.id, name: studentUser.name, nis: studentUser.nis,
  nisn: "9900000001", gender: "L", is_active: true, class_id: "class-e2e", class_name: "X PPLG E2E",
  school_unit_id: "unit-e2e", school_unit_code: "SMK", school_year_id: "year-e2e", school_year_name: "2026/2027",
  major_code: "PPLG", major_name: "Program Sintetis", membership_status: "ACTIVE",
};
export const summary = { present: 1, permission: 0, sick: 0, alpha: 0, repeated_alpha: [] };
export const stats = { total_attendance: 1, present: 1, permission: 0, sick: 0, alpha: 0, pending_reviews: 1, pending_requests: 0 };
export const attendance: StaffAttendanceRecord = {
  id: "attendance-e2e", student_id: profile.id, student_name: profile.name, nis: profile.nis,
  class_id: profile.class_id!, class_name: profile.class_name!, school_unit_id: "unit-e2e", school_unit_code: "SMK",
  major_id: "major-e2e", major_code: "PPLG", school_year_id: "year-e2e", school_year_name: "2026/2027",
  attendance_date: DATE, check_in_at: "2026-09-30T06:45:00+07:00", status: "hadir", notes: "Catatan sintetis E2E",
  photo_url: "/uploads/e2e/photo.png", location_status: "permission_denied",
};
export const today: StudentToday = {
  profile, window: { check_in_start: "06:00:00", on_time_until: "07:00:00", late_until: "09:00:00" },
  is_school_day: true, can_submit: true, current_status: "belum_absen", current_time: NOW,
  message: "Silakan melakukan absensi sintetis.", location_policy: { configured: false },
};
export const completedToday: StudentToday = { ...today, can_submit: false, current_status: "hadir", attendance, message: "Absensi sudah tercatat." };
export const dashboard: StudentDashboard = { today, stats, recent_attendance: [], recent_submissions: [], notifications: [], unread_notifications: 0 };
export const history: StudentHistory = { profile, stats, attendance: [attendance], submissions: [] };
export const homeroom = { assignment_id: "homeroom-e2e", teacher_id: "teacher-e2e", class_id: "class-e2e", class_name: profile.class_name!, school_year_id: "year-e2e", school_year_name: "2026/2027", is_active: true };
export const teacherMe: StaffTeacherMe = { user_id: teacherUser.id, teacher_id: "teacher-e2e", name: teacherUser.name, username: teacherUser.username, is_homeroom_teacher: true, has_subject_assignments: true, active_homeroom: homeroom };
export const studentSummary = { ...profile, present_count: 1, permission_count: 0, sick_count: 0, alpha_count: 0 };
export const bkClass = { class_id: "class-e2e", class_name: profile.class_name!, school_unit_id: "unit-e2e", school_unit_code: "SMK", school_year_id: "year-e2e", school_year_name: "2026/2027" };
export const submission = { id: "submission-e2e", student_id: profile.id, student_name: profile.name, nis: profile.nis, class_id: "class-e2e", class_name: profile.class_name!, type: "IZIN", reason: "Keperluan sintetis keluarga", status: "menunggu", created_at: NOW };
export const submissionCounts = { total: 1, pending: 1, approved: 0, rejected: 0, with_attachment: 0 };
export const counseling = { id: "note-e2e", student_id: profile.id, student_name: profile.name, nis: profile.nis, class_id: "class-e2e", class_name: profile.class_name!, created_by: teacherUser.id, created_by_name: teacherUser.name, title: "Pendampingan Sintetis", note: "Catatan pembinaan sintetis untuk pengujian.", created_at: NOW, updated_at: NOW };
export const assignment: StaffSubjectAssignment = {
  id: "assignment-e2e", subject_id: "subject-e2e", subject_code: "E2E-MTK", subject_name: "Matematika Sintetis",
  classes: [{ id: "class-e2e", name: profile.class_name!, school_unit_id: "unit-e2e", school_unit_code: "SMK" }],
  school_year_id: "year-e2e", school_year_name: "2026/2027", school_unit_id: "unit-e2e", school_unit_code: "SMK",
  assignment_role: "PRIMARY", is_primary: true, is_active: true,
  schedules: [{ id: "schedule-e2e", hari: "rabu", jam_mulai: "07:00", jam_selesai: "09:00", class_id: "class-e2e", class_name: profile.class_name!, is_active: true }],
};
export const subjectSession: StaffSubjectCurrentSession = { session_id: "session-e2e", assignment, schedule_id: "schedule-e2e", hari: "rabu", jam_mulai: "07:00", jam_selesai: "09:00", tanggal: DATE, status: "belum_divalidasi", topic: "Topik Sintetis", notes: "", opened_late: false };
export const subjectRecord = { student_id: profile.id, student_name: profile.name, nis: profile.nis, status_pagi: "hadir", status_mapel: "hadir", is_editable: true, is_edited: false };
export const ticket: SupportTicket = {
  reference_code: "E2E-TICKET-0001", requester_name: profile.name, portal: "student", account_identifier: profile.nis,
  category: "PASSWORD_RECOVERY", subject: "Pemulihan akun sintetis", status: "WAITING_ADMIN", priority: "NORMAL",
  last_message_at: NOW, last_message_by: "REQUESTER", unread: false, created_at: NOW, updated_at: NOW,
  messages: [{ id: "message-e2e", sender_role: "REQUESTER", sender_name: profile.name, body: "Saya lupa password akun sintetis.", created_at: NOW }],
  messages_page: { offset: 0, limit: 50, has_more: false }, password_reset: { status: "PENDING" },
};
export const accessCode = "TEST-CODE-0001";
export const schoolYear = { id: "year-e2e", name: "2026/2027", start_year: 2026, end_year: 2027, is_active: true };
export const schoolUnit = { id: "unit-e2e", code: "SMK", name: "Sekolah Sintetis", education_level: "SMK", is_active: true };
export const major = { id: "major-e2e", school_unit_id: "unit-e2e", school_unit_code: "SMK", code: "PPLG", name: "Program Sintetis", program_type: "VOCATIONAL", is_active: true };
export const classroom = { id: "class-e2e", school_unit_id: "unit-e2e", school_unit_code: "SMK", school_unit_name: schoolUnit.name, grade: "X", class_type: "REGULER", name: profile.class_name, display_name: profile.class_name, major_id: major.id, major_code: major.code, major_name: major.name, school_year_id: schoolYear.id, school_year_name: schoolYear.name, student_count: 1, homeroom_teacher: teacherUser.name, is_active: true };
export const subject = { id: "subject-e2e", code: "E2E-MTK", name: "Matematika Sintetis", scope: "ALL", group: "Umum", description: "Data sintetis", major_ids: [], is_active: true, assignment_count: 1, teacher_count: 1, class_count: 1, schedule_count: 1 };
export const holiday = { id: "holiday-e2e", name: "Libur Sintetis", holiday_type: "SCHOOL", start_date: "2026-10-01", end_date: "2026-10-02", description: "Jadwal sintetis E2E", is_active: true };
export const adminDashboard = { attendance_percentage: 100, counts: { total_users: 3, total_students: 1, total_teachers: 1, total_bk: 0, total_admins: 1 }, today_status: summary, semester_trend: [], class_performance: [], announcements: [{ id: "announcement-e2e", title: "Pengumuman Sintetis", description: "Hanya data uji browser", tone: "info" }] };
export const analytics = {
  period: { date_from: DATE, date_to: DATE, school_days: 1, is_temporary: false, generated_at: NOW, data_freshness: "Terkini" },
  filters: { school_year_id: schoolYear.id, school_year_name: schoolYear.name },
  summary: { total_students: 0, total_classes: 0, attendance_opportunities: 0, recorded_attendance: 0, attendance_percentage: 0, system_usage_percentage: 0, not_attended: 0, alpha: 0 },
  status_breakdown: { ...summary, not_attended: 0 }, trend: [], grades: [], majors: [], classes: [],
  students: { rows: [], page: 1, page_size: 20, total_items: 0, total_pages: 0 },
  operational: { total_subject_sessions: 0, finalized_subject_sessions: 0, pending_subject_sessions: 0, validation_percentage: 0 },
};

// Explicit read contracts shared by page flows. Mutations have no permissive
// fallback: every mutation must be registered by the test that exercises it.
export function defaultReads(): Record<string, unknown> {
  return structuredClone({
    "/public/attendance-window": { ...today.window, current_time: NOW, is_school_day: true, can_submit: true },
    "/student/today": today, "/student/dashboard": dashboard, "/student/profile": profile,
    "/student/history": history, "/student/submissions": [], "/student/notifications": [],
    "/teacher/me": teacherMe, "/teacher/homeroom": homeroom,
    "/teacher/homeroom/dashboard": { homeroom, total_students: 1, today: summary, students_needing_attention: [], recent_submissions: [] },
    "/teacher/homeroom/students": [studentSummary],
    [`/teacher/homeroom/students/${profile.id}`]: { student: studentSummary, attendance_summary: summary, attendance_period: { total: 1, from_date: DATE, until_date: DATE }, recent_attendance: [attendance], recent_submissions: [] },
    "/teacher/homeroom/attendance-overview": { homeroom, date: DATE, summary, records: [attendance] },
    "/teacher/homeroom/submissions-overview": { homeroom, counts: submissionCounts, records: [submission] },
    "/teacher/subject-assignments": [assignment], "/teacher/subject/current-session": subjectSession,
    "/teacher/subject/schedule-day-status": { date: DATE, is_school_day: true },
    "/teacher/subject/attendance": { session: subjectSession, records: [subjectRecord] },
    "/teacher/subject/sessions": { assignment, sessions: [{ ...subjectSession, is_recorded: true, class_id: "class-e2e", class_name: profile.class_name, can_open_late: false, hadir: 1, izin: 0, sakit: 0, alfa: 0 }] },
    "/teacher/subject/recap": { assignment, total_pertemuan: 1, students: [{ ...subjectRecord, class_id: "class-e2e", class_name: profile.class_name, hadir: 1, izin: 0, sakit: 0, alfa: 0 }] },
    "/bk/dashboard": { total_students: 1, students_need_attention: 0, total_counseling_notes: 1, pending_submissions: 1, today: summary, top_risk_students: [], recent_submissions: [], recent_counseling_notes: [], classes: [bkClass] },
    "/bk/students-overview": { counts: { total: 1, active: 1, need_attention: 0, total_alpha: 0, with_counseling_notes: 1 }, students: [studentSummary], classes: [bkClass] },
    [`/bk/students/${profile.id}`]: { student: studentSummary, attendance_summary: summary, recent_attendance: [attendance], recent_submissions: [], counseling_notes: [counseling] },
    "/bk/attendance-overview": { date: DATE, summary, records: [attendance], classes: [bkClass] },
    "/bk/submissions-overview": { counts: submissionCounts, records: [submission], classes: [bkClass] },
    "/bk/counseling-overview": { counts: { total_notes: 1, students_covered: 1, classes_covered: 1, recent_week_notes: 1 }, records: [counseling], students: [studentSummary], classes: [bkClass] },
    "/support/tickets": { tickets: [], total: 0 }, "/support/notifications": { notifications: [], unread_count: 0 },
    "/admin/support/tickets": { tickets: [], total: 0 },
    "/support/push/public-key": { public_key: "", enabled: false }, "/admin/support/push/public-key": { public_key: "", enabled: false }, "/public/support/push/public-key": { public_key: "", enabled: false },
    "/admin/dashboard": adminDashboard, "/admin/analytics/attendance": analytics,
    "/admin/users": [studentUser, teacherUser, adminUser], "/admin/students": [profile],
    "/admin/teacher-profiles": [{ id: "teacher-e2e", user_id: teacherUser.id, name: teacherUser.name, username: teacherUser.username, is_active: true }],
    "/admin/classes": [classroom], "/admin/majors": [major], "/admin/school-units": [schoolUnit], "/admin/school-years": [schoolYear],
    "/admin/subjects": [subject], "/admin/school-holidays": [holiday],
    "/admin/student-class-memberships": [], "/admin/attendance-rules": [], "/admin/teacher-subject-assignments": [],
    "/admin/subject-schedules": [], "/admin/schedule-overrides": [], "/admin/homeroom-assignments": [], "/admin/bk-unit-scopes": [],
  });
}
