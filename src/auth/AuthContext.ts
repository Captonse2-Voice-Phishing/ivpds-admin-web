import { createContext, useContext } from 'react';
import type { UserSummary } from '@/api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: UserSummary | null;
  /** Đăng nhập; ném ApiError (kể cả NOT_ADMIN khi tài khoản không có quyền quản trị). */
  login: (email: string, password: string) => Promise<void>;
  /** Đăng xuất: thu hồi refresh token ở backend rồi xóa phiên ở trình duyệt. */
  logout: () => Promise<void>;
  /** Xóa phiên ở trình duyệt mà không gọi backend (sau khi đổi mật khẩu, backend đã thu hồi mọi phiên). */
  dropSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return value;
}

export const ADMIN_ROLE = 'ADMIN';
