import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ApiError, toApiError } from './errors';
import { tokenStore } from './tokenStore';
import type { AuthResponse } from './types';

const BASE_URL = '/api/v1';

/** Client cho mọi API cần đăng nhập: tự gắn access token và tự làm mới token khi gặp 401. */
export const api = axios.create({ baseURL: BASE_URL, timeout: 30_000 });

/** Client cho nhóm API công khai (đăng nhập, refresh, logout...): không gắn token, không tự refresh. */
export const publicApi = axios.create({ baseURL: BASE_URL, timeout: 30_000 });

interface SessionListener {
  /** Vừa nhận cặp token mới (kèm thông tin người dùng). */
  onRefreshed: (auth: AuthResponse) => void;
  /** Refresh thất bại: phiên đã hết, phải đăng nhập lại. */
  onExpired: () => void;
}

let listener: SessionListener = { onRefreshed: () => {}, onExpired: () => {} };

export function setSessionListener(next: SessionListener): void {
  listener = next;
}

// Refresh token chỉ dùng được một lần, nên mọi nơi cần refresh phải dùng chung một lời gọi đang chạy.
let refreshing: Promise<AuthResponse> | null = null;

/** Đổi refresh token lấy cặp token mới. Gọi đồng thời nhiều lần vẫn chỉ gửi một request. */
export function refreshSession(): Promise<AuthResponse> {
  if (refreshing) {
    return refreshing;
  }
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) {
    return Promise.reject(new ApiError(401, 'INVALID_REFRESH_TOKEN'));
  }
  refreshing = publicApi
    .post<AuthResponse>('/auth/refresh', { refreshToken })
    .then((response) => {
      tokenStore.set(response.data);
      listener.onRefreshed(response.data);
      return response.data;
    })
    .catch((error: unknown) => {
      tokenStore.clear();
      throw toApiError(error);
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  if (error.response?.status !== 401 || !config || config._retried) {
    throw toApiError(error);
  }
  config._retried = true;
  try {
    await refreshSession();
  } catch {
    listener.onExpired();
    throw toApiError(error);
  }
  // Gửi lại request ban đầu; interceptor ở trên gắn access token mới.
  return api.request(config);
});

publicApi.interceptors.response.use(undefined, (error: unknown) => {
  throw toApiError(error);
});
