"use client";

import type { ApiUserRole, AuthSession, AuthUser, DashboardRole } from "@/types/auth";

const AUTH_STORAGE_KEY = "absensi-cn-auth";
const AUTH_SESSION_EVENT = "absensi-cn-auth-change";
let cachedSessionRaw: string | null = null;
let cachedSessionValue: AuthSession | null = null;

function emitAuthSessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitAuthSessionChange();
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawSession) {
    cachedSessionRaw = null;
    cachedSessionValue = null;
    return null;
  }

  if (rawSession === cachedSessionRaw) {
    return cachedSessionValue;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as AuthSession;
    cachedSessionRaw = rawSession;
    cachedSessionValue = parsedSession;
    return parsedSession;
  } catch {
    cachedSessionRaw = null;
    cachedSessionValue = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthSessionChange();
}

export function subscribeAuthSession(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_SESSION_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_SESSION_EVENT, onStoreChange);
  };
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
