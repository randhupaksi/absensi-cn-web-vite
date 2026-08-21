import { apiClient } from "@/services/api/client";
import { retryTransientRequest } from "@/services/api/transient-retry";
import { LoginSchema } from "@/lib/validations/login-schema";
import type { AuthSession } from "@/types/auth";
import { getUserErrorMessage } from "@/lib/user-error-message";
import axios from "axios";

export type AuthLoginResponse = AuthSession;

type ApiAuthSession = {
  access_token: string;
  user: AuthSession["user"];
};

type ChangePasswordPayload = {
  new_password: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  errors?: Record<string, string>;
};

export type LoginRateLimitKind = "locked" | "busy";

export class LoginRateLimitError extends Error {
  readonly kind: LoginRateLimitKind;
  readonly retryAfterSeconds: number;

  constructor(kind: LoginRateLimitKind, retryAfterSeconds: number) {
    super(
      kind === "locked"
        ? "Terlalu banyak percobaan login."
        : "Server sedang ramai menerima login.",
    );
    this.name = "LoginRateLimitError";
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getRetryAfterSeconds(error: unknown) {
  if (!axios.isAxiosError(error)) return 0;
  const value = Number(error.response?.headers?.["retry-after"]);
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 0;
}

function getLoginRateLimitError(error: unknown) {
  if (!axios.isAxiosError<ApiEnvelope<unknown>>(error)) return null;
  const code = error.response?.data?.code;
  if (code !== "LOGIN_LOCKED" && code !== "SERVER_BUSY") return null;
  const retryAfterSeconds = getRetryAfterSeconds(error);
  return new LoginRateLimitError(
    code === "LOGIN_LOCKED" ? "locked" : "busy",
    retryAfterSeconds || (code === "LOGIN_LOCKED" ? 120 : 3),
  );
}

const AUTH_REQUEST_TIMEOUT = 20_000;
const AUTH_MAX_ATTEMPTS = 2;

export async function login(payload: LoginSchema) {
  try {
    const response = await retryTransientRequest(
      () =>
        apiClient.post<ApiEnvelope<ApiAuthSession>>("/auth/login", payload, {
          timeout: AUTH_REQUEST_TIMEOUT,
        }),
      AUTH_MAX_ATTEMPTS,
    );

    return {
      ...response.data,
      data: {
        accessToken: response.data.data.access_token,
        user: response.data.data.user,
      },
    };
  } catch (error) {
    const rateLimitError = getLoginRateLimitError(error);
    if (rateLimitError) throw rateLimitError;
    throw new Error(
      getUserErrorMessage(
        error,
        payload.portal === "student" ? "student" : "login",
      ),
    );
  }
}

export async function changeInitialPassword(payload: ChangePasswordPayload) {
  try {
    const response = await apiClient.post<
      ApiEnvelope<{ must_change_password: false }>
    >("/auth/change-password", payload, {
      timeout: AUTH_REQUEST_TIMEOUT,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getUserErrorMessage(error, "login"));
  }
}
