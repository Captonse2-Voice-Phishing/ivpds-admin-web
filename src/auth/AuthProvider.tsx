import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { refreshSession, setSessionListener } from '@/api/client';
import { ApiError, NOT_ADMIN } from '@/api/errors';
import { tokenStore } from '@/api/tokenStore';
import type { UserSummary } from '@/api/types';
import { ADMIN_ROLE, AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';

const isAdmin = (user: UserSummary) => user.roles.includes(ADMIN_ROLE);

/** Thu hồi refresh token ở backend; lỗi ở bước này không chặn việc đăng xuất phía trình duyệt. */
async function revoke(refreshToken: string | null): Promise<void> {
  if (!refreshToken) {
    return;
  }
  try {
    await authApi.logout(refreshToken);
  } catch {
    // Token có thể đã hết hạn hoặc backend không phản hồi: phiên ở trình duyệt vẫn bị xóa.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.getRefresh() ? 'loading' : 'anonymous'));
  const [user, setUser] = useState<UserSummary | null>(null);

  const dropSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  // Token được làm mới ở tầng API: cập nhật người dùng; refresh thất bại: về trang đăng nhập.
  useEffect(() => {
    setSessionListener({
      onRefreshed: (auth) => {
        if (isAdmin(auth.user)) {
          setUser(auth.user);
          setStatus('authenticated');
        }
      },
      onExpired: dropSession,
    });
    return () => setSessionListener({ onRefreshed: () => {}, onExpired: () => {} });
  }, [dropSession]);

  // Mở trang mà còn refresh token: refresh trước khi hiện giao diện.
  useEffect(() => {
    if (!tokenStore.getRefresh()) {
      return;
    }
    let cancelled = false;
    refreshSession()
      .then(async (auth) => {
        if (!isAdmin(auth.user)) {
          await revoke(auth.refreshToken);
          if (!cancelled) {
            dropSession();
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          dropSession();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dropSession]);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await authApi.login({ email, password });
    if (!isAdmin(auth.user)) {
      // Không cho vào và thu hồi luôn token vừa nhận.
      await revoke(auth.refreshToken);
      throw new ApiError(403, NOT_ADMIN);
    }
    tokenStore.set(auth);
    setUser(auth.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await revoke(tokenStore.getRefresh());
    dropSession();
  }, [dropSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, dropSession }),
    [status, user, login, logout, dropSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
