import { apiClient } from "@/services/api/client";
import { LoginSchema } from "@/lib/validations/login-schema";
import type { AuthSession } from "@/types/auth";
import axios from "axios";

export type AuthLoginResponse = AuthSession;

type ApiAuthSession = {
  access_token: string;
  user: AuthSession["user"];
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
};

export async function login(payload: LoginSchema) {
  try {
    const response = await apiClient.post<ApiEnvelope<ApiAuthSession>>(
      "/auth/login",
      payload,
    );

    return {
      ...response.data,
      data: {
        accessToken: response.data.data.access_token,
        user: response.data.data.user,
      },
    };
  } catch (error) {
    if (axios.isAxiosError<ApiEnvelope<never>>(error)) {
      const message =
        error.response?.data?.message ?? "Tidak dapat terhubung ke server login.";
      throw new Error(message);
    }

    throw error;
  }
}
