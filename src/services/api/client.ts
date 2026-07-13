import axios from "axios";
import { siteConfig } from "@/lib/config/site";
import { clearAuthSession, getAuthSession } from "@/lib/auth";

export const apiClient = axios.create({
  baseURL: siteConfig.apiBaseUrl,
  timeout: 110_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const session = getAuthSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? "";
      const isLoginRequest = requestUrl.includes("/auth/login");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isLoginRoute = currentPath.startsWith("/login");

      if (!isLoginRequest) {
        clearAuthSession();
      }

      if (typeof window !== "undefined" && !isLoginRequest && !isLoginRoute) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
