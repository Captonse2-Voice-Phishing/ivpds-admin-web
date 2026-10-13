import { api, publicApi } from './client';
import type { AuthResponse, ChangePasswordRequest, LoginRequest, ResetPasswordRequest } from './types';

export const authApi = {
  login: (body: LoginRequest) => publicApi.post<AuthResponse>('/auth/login', body).then((r) => r.data),

  /** Thu hồi refresh token. Backend luôn trả 204. */
  logout: (refreshToken: string) => publicApi.post<void>('/auth/logout', { refreshToken }).then(() => undefined),

  /** Luôn trả 204, dù email có tồn tại hay không. */
  forgotPassword: (email: string) => publicApi.post<void>('/auth/forgot-password', { email }).then(() => undefined),

  resetPassword: (body: ResetPasswordRequest) =>
    publicApi.post<void>('/auth/reset-password', body).then(() => undefined),

  /** Đổi mật khẩu; backend đăng xuất mọi phiên sau khi đổi. */
  changePassword: (body: ChangePasswordRequest) =>
    api.post<void>('/auth/change-password', body).then(() => undefined),
};
