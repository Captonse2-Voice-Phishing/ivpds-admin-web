import { Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Chỉ cho vào khi đã đăng nhập bằng tài khoản quản trị; chưa thì về /login và nhớ trang đang mở. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <Spin fullscreen tip="Đang khôi phục phiên đăng nhập..." />;
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}

/** Trang đăng nhập và quên mật khẩu: đã đăng nhập thì vào thẳng trang quản trị. */
export function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <Spin fullscreen tip="Đang khôi phục phiên đăng nhập..." />;
  }
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }
  return <Outlet />;
}
