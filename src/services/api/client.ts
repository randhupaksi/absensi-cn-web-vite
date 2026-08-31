import axios from "axios";
import { siteConfig } from "@/lib/config/site";
import {
  clearAuthSession,
  getAuthSession,
  getLoginPathForCurrentContext,
} from "@/lib/auth";
import { reportApiFailure, reportApiSuccess } from "@/lib/system-status-events";

export const apiClient = axios.create({
  baseURL: siteConfig.apiBaseUrl,
  timeout: 110_000,
  headers: {
    "Content-Type": "application/json",
  },
});

function createTraceparent() {
  const randomHex = (length: number) => {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  return `00-${randomHex(32)}-${randomHex(16)}-01`;
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    config.headers.traceparent = createTraceparent();
  }
  const session = getAuthSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    reportApiSuccess();
    return response;
  },
  (error) => {
    reportApiFailure(error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? "";
      const isLoginRequest = requestUrl.includes("/auth/login");
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const isLoginRoute = currentPath.startsWith("/login");
      const loginPath = getLoginPathForCurrentContext(currentPath);

      if (!isLoginRequest) {
        clearAuthSession();
      }

      if (typeof window !== "undefined" && !isLoginRequest && !isLoginRoute) {
        window.location.href = loginPath;
      }
    }

    return Promise.reject(error);
  },
);
