export type AdminDashboardData = {
  attendance_percentage: number;
  counts: {
    total_users: number;
    total_students: number;
    total_teachers: number;
    total_bk: number;
    total_admins: number;
  };
  today_status: {
    present: number;
    permission: number;
    sick: number;
    alpha: number;
  };
  semester_trend: Array<{
    label: string;
    present: number;
    permission: number;
    sick: number;
    alpha: number;
  }>;
  class_performance: Array<{
    class_name: string;
    percentage: number;
    present_text: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    description: string;
    tone: "warning" | "success" | "info" | string;
  }>;
};

export type AdminUser = {
  id: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  nis?: string;
  username?: string;
};

export type AdminUserPayload = {
  name: string;
  role: AdminUser["role"];
  username: string;
  nis: string;
  password: string;
};

export type AdminTeacherProfile = {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  gender?: string;
  is_active: boolean;
};

export type AdminTeacherAccountPayload = {
  name: string;
  username: string;
  password: string;
  gender: string;
  is_active: boolean;
};

export type AdminSubjectSchedule = {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  room_id?: string;
  room_name?: string;
  effective_from?: string;
  effective_until?: string;
  is_active: boolean;
};

export type AdminSubjectScheduleInput = {
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  room_id?: string;
  effective_from?: string;
  effective_until?: string;
  is_active?: boolean;
};

export type AdminTeacherSubjectAssignment = {
  id: string;
  offering_id?: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  school_year_id: string;
  school_year_name: string;
  school_unit_id: string;
  school_unit_code: string;
  assignment_role: "PRIMARY" | "ASSISTANT" | "SUBSTITUTE" | string;
  is_primary: boolean;
  effective_from?: string;
  effective_until?: string;
  is_active: boolean;
  schedules: AdminSubjectSchedule[];
};

export type AdminTeacherSubjectAssignmentPayload = {
  offering_id?: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  school_year_id: string;
  assignment_role?: "PRIMARY" | "ASSISTANT" | "SUBSTITUTE";
  is_primary?: boolean;
  effective_from?: string;
  effective_until?: string;
  is_active: boolean;
  schedules?: AdminSubjectScheduleInput[];
};

export type AdminHomeroomAssignment = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  class_id: string;
  class_name: string;
  school_year_id: string;
  school_year_name: string;
  is_active: boolean;
};

export type AdminHomeroomAssignmentPayload = {
  teacher_id: string;
  class_id: string;
  school_year_id: string;
  is_active: boolean;
};

export type AdminSubject = {
  id: string;
  code: string;
  name: string;
  group?: string;
  description?: string;
  scope: "ALL" | "SMP" | "SMA" | "SMK" | string;
  major_ids: string[];
  is_active: boolean;
  assignment_count: number;
  teacher_count: number;
  class_count: number;
  schedule_count: number;
};

export type AdminSubjectPayload = {
  code: string;
  name: string;
  group: string;
  description: string;
  scope: "ALL" | "SMP" | "SMA" | "SMK";
  major_ids: string[];
  is_active: boolean;
};

export type AdminSubjectScheduleOverview = {
  id: string;
  assignment_id: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  school_year_id: string;
  school_year_name: string;
  school_unit_id: string;
  school_unit_code: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  room_id?: string;
  room_name?: string;
  effective_from?: string;
  effective_until?: string;
  is_active: boolean;
};

export type AdminSubjectScheduleFilters = {
  query?: string;
  teacher_id?: string;
  subject_id?: string;
  class_id?: string;
  school_year_id?: string;
  school_unit_id?: string;
  day?: string;
  status?: string;
};

export type AdminSchoolYear = {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_active: boolean;
};

export type AdminMajor = {
  id: string;
  school_unit_id: string;
  school_unit_code: string;
  code: string;
  name: string;
  program_type: "VOCATIONAL" | "GENERAL" | "SCIENCE" | "SOCIAL" | string;
  is_active: boolean;
};

export type AdminClass = {
  id: string;
  school_unit_id: string;
  school_unit_code: string;
  school_unit_name: string;
  grade: string;
  class_type: "" | "PLUS" | "REGULER" | string;
  name: string;
  major_id: string;
  major_code: string;
  major_name: string;
  school_year_id: string;
  school_year_name: string;
  display_name: string;
  student_count: number;
  subject_assignment_count: number;
  homeroom_assignment_id?: string;
  homeroom_teacher_id?: string;
  homeroom_teacher_name?: string;
  attendance_record_count: number;
  capacity: number;
  is_active: boolean;
};

export type AdminClassPayload = {
  school_unit_id: string;
  grade: string;
  class_type: "" | "PLUS" | "REGULER";
  name: string;
  major_id: string;
  school_year_id: string;
  capacity: number;
  is_active: boolean;
};

export type AdminSchoolUnit = {
  id: string;
  code: string;
  name: string;
  education_level: string;
  is_active: boolean;
};

export type AdminSchoolUnitPayload = Omit<AdminSchoolUnit, "id">;

export type AdminMajorPayload = {
  school_unit_id: string;
  code: string;
  name: string;
  program_type: "VOCATIONAL" | "GENERAL" | "SCIENCE" | "SOCIAL";
  is_active: boolean;
};

export type AdminRoom = {
  id: string;
  school_unit_id: string;
  school_unit_code: string;
  code: string;
  name: string;
  room_type: string;
  capacity: number;
  is_active: boolean;
};

export type AdminRoomPayload = Omit<AdminRoom, "id" | "school_unit_code">;

export type AdminScheduleOverride = {
  id: string;
  schedule_id: string;
  original_date: string;
  override_type: "CANCELLED" | "RESCHEDULED" | "SUBSTITUTE" | "ROOM_CHANGED" | string;
  replacement_date?: string;
  replacement_start_time?: string;
  replacement_end_time?: string;
  replacement_room_id?: string;
  substitute_teacher_id?: string;
  reason: string;
  status: "ACTIVE" | "CANCELLED" | "APPLIED" | string;
};

export type AdminScheduleOverridePayload = Omit<AdminScheduleOverride, "id">;

export type AdminBKUnitScope = {
  id: string;
  user_id: string;
  user_name: string;
  school_unit_id: string;
  school_unit_code: string;
  school_unit_name: string;
};

export type AdminStudent = {
  id: string;
  user_id: string;
  name: string;
  nis: string;
  nisn?: string;
  gender?: string;
  is_active: boolean;
};

export type AdminStudentPayload = {
  name: string;
  nis: string;
  nisn: string;
  password: string;
  gender: string;
  class_id: string;
  is_active: boolean;
};

export type AdminStudentClassMembership = {
  id: string;
  student_id: string;
  student_name: string;
  nis: string;
  class_id: string;
  class_name: string;
  school_year_id: string;
  school_year_name: string;
  status: string;
  joined_at?: string;
  left_at?: string;
  is_active: boolean;
};

export type AdminStudentClassMembershipPayload = {
  student_id: string;
  class_id: string;
  school_year_id: string;
  status: string;
  joined_at: string;
  left_at: string;
  is_active: boolean;
};

export type AdminAttendanceRule = {
  id: string;
  school_year_id: string;
  school_year: string;
  check_in_start: string;
  on_time_until: string;
  late_until: string;
  is_active: boolean;
};

export type AdminAttendanceRulePayload = {
  school_year_id: string;
  check_in_start: string;
  on_time_until: string;
  late_until: string;
  is_active: boolean;
};

export type ImportError = {
  row: number;
  field: string;
  message: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: ImportError[];
};
