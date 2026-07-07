"use client";

import type { ApiUserRole, AuthSession, AuthUser, DashboardRole } from "@/types/auth";

const AUTH_STORAGE_KEY = "absensi-cn-auth";

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getDefaultDashboardRole(user: AuthUser): DashboardRole {
  switch (user.role) {
    case "STUDENT":
      return "siswa";
    case "TEACHER":
      return user.has_bk_scope ? "bk" : "walas";
    case "ADMIN":
      return "admin";
  }
}

export function getDashboardPathForUser(user: AuthUser) {
  if (user.role === "TEACHER") {
    return "/dashboard/teacher";
  }
  const dashboardRole = getDefaultDashboardRole(user);
  return `/dashboard/${dashboardRole}`;
}

export function canAccessDashboardRole(user: AuthUser, dashboardRole: DashboardRole) {
  switch (dashboardRole) {
    case "siswa":
      return user.role === "STUDENT";
    case "admin":
      return user.role === "ADMIN";
    case "walas":
      return user.role === "TEACHER";
    case "bk":
      return user.role === "TEACHER" && user.has_bk_scope;
  }
}

export function getDashboardLabel(role: ApiUserRole) {
  switch (role) {
    case "STUDENT":
      return "Siswa";
    case "TEACHER":
      return "Guru";
    case "ADMIN":
      return "Admin";
  }
}
