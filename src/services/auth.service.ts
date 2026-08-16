import { apiClient } from "@/services/api/client";
import { retryTransientRequest } from "@/services/api/transient-retry";
import { LoginSchema } from "@/lib/validations/login-schema";
import type { AuthSession } from "@/types/auth";
import { getUserErrorMessage } from "@/lib/user-error-message";

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
  errors?: Record<string, string>;
};

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
    throw new Error(getUserErrorMessage(error, "login"));
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
