import { UserRole } from "@/types/auth";

export type Student = {
  id: string;
  nis: string;
  name: string;
  className: string;
};

export type UserProfile = {
  id: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
};
