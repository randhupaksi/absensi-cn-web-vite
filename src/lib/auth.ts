"use client";

import type { ApiUserRole, AuthSession, DashboardRole } from "@/types/auth";

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

export function mapApiRoleToDashboardRole(role: ApiUserRole): DashboardRole {
  switch (role) {
    case "STUDENT":
      return "siswa";
    case "TEACHER":
      return "walas";
    case "BK":
      return "bk";
    case "ADMIN":
      return "admin";
  }
}

export function getDashboardPathForRole(role: ApiUserRole) {
  const dashboardRole = mapApiRoleToDashboardRole(role);
  return `/dashboard/${dashboardRole}`;
}

export function getDashboardLabel(role: ApiUserRole) {
  switch (role) {
    case "STUDENT":
      return "Siswa";
    case "TEACHER":
      return "Guru";
    case "BK":
      return "BK";
    case "ADMIN":
      return "Admin";
  }
}
