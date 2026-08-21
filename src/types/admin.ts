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

export type AdminAttendanceAnalyticsFilters = {
  date_from?: string;
  date_to?: string;
  school_year_id?: string;
  grade?: string;
  major_id?: string;
  class_id?: string;
  student_query?: string;
  sort?: "attendance_asc" | "attendance_desc" | "usage_asc" | "usage_desc";
  page?: number;
  page_size?: number;
};

export type AdminAnalyticsPerformance = {
  id: string;
  name: string;
  total_students: number;
  expected: number;
  present: number;
  permission: number;
  sick: number;
  alpha: number;
  not_attended: number;
  attendance_percentage: number;
  system_usage_percentage: number;
};

export type AdminAttendanceAnalytics = {
  period: {
    date_from: string;
    date_to: string;
    school_days: number;
    is_temporary: boolean;
    generated_at: string;
    data_freshness: string;
  };
  filters: {
    school_year_id: string;
    school_year_name: string;
    grade?: string;
    major_id?: string;
    class_id?: string;
  };
  summary: {
    total_students: number;
    total_classes: number;
    attendance_opportunities: number;
    recorded_attendance: number;
    attendance_percentage: number;
    system_usage_percentage: number;
    not_attended: number;
    alpha: number;
  };
  status_breakdown: {
    present: number;
    permission: number;
    sick: number;
    alpha: number;
    not_attended: number;
  };
  trend: Array<{
    date: string;
    label: string;
    expected: number;
    present: number;
    permission: number;
    sick: number;
    alpha: number;
    not_attended: number;
    attendance_percentage: number;
    system_usage_percentage: number;
  }>;
  grades: AdminAnalyticsPerformance[];
  majors: AdminAnalyticsPerformance[];
  classes: Array<
    AdminAnalyticsPerformance & {
      grade: string;
      major_id: string;
      major_code: string;
    }
  >;
  students: {
    rows: Array<{
      student_id: string;
      student_name: string;
      nis: string;
      class_id: string;
      class_name: string;
      grade: string;
      major_id: string;
      major_code: string;
      expected: number;
      present: number;
      permission: number;
      sick: number;
      alpha: number;
      not_attended: number;
      attendance_percentage: number;
      system_usage_percentage: number;
    }>;
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
  operational: {
    total_subject_sessions: number;
    finalized_subject_sessions: number;
    pending_subject_sessions: number;
    validation_percentage: number;
  };
};

export type AdminSchoolHolidayType =
  "NATIONAL" | "COLLECTIVE_LEAVE" | "SCHOOL" | "SYSTEM_MAINTENANCE";

export type AdminSchoolHoliday = {
  id: string;
  name: string;
  holiday_type: AdminSchoolHolidayType;
  start_date: string;
  end_date: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AdminSchoolHolidayPayload = {
  name: string;
  holiday_type: AdminSchoolHolidayType;
  start_date: string;
  end_date: string;
  description: string;
  is_active: boolean;
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
  class_id: string;
  class_name: string;
  school_unit_id?: string;
  school_unit_code?: string;
  effective_from?: string;
  effective_until?: string;
  is_active: boolean;
};

export type AdminSubjectScheduleInput = {
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  class_id: string;
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
  /** @deprecated Use classes/schedules as the class source of truth. */
  class_id?: string;
  /** @deprecated Use classes/schedules as the class source of truth. */
  class_name?: string;
  classes?: Array<{
    id: string;
    name: string;
    school_unit_id?: string;
    school_unit_code?: string;
  }>;
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
  /** Legacy compatibility only. New writes use schedules[].class_id. */
  class_id?: string;
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

export type AdminScheduleOverride = {
  id: string;
  schedule_id: string;
  original_date: string;
  override_type: "CANCELLED" | "RESCHEDULED" | "SUBSTITUTE" | string;
  replacement_date?: string;
  replacement_start_time?: string;
  replacement_end_time?: string;
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
