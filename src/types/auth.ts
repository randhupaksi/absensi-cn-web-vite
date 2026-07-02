export type ApiUserRole = "STUDENT" | "TEACHER" | "BK" | "ADMIN";

export type DashboardRole = "siswa" | "walas" | "bk" | "admin";
export type UserRole = DashboardRole;

export type AuthUser = {
  id: string;
  name: string;
  role: ApiUserRole;
  portal: "student" | "staff";
  nis?: string;
  username?: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};
