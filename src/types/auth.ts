export type ApiUserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type DashboardRole = "siswa" | "walas" | "bk" | "admin";
export type UserRole = DashboardRole;

export type AuthUser = {
  id: string;
  name: string;
  role: ApiUserRole;
  portal: "student" | "staff";
  has_bk_scope: boolean;
  nis?: string;
  username?: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};
