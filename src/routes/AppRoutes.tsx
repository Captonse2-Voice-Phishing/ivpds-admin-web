import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAuth } from '@/auth/RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';

// Mỗi màn hình tải riêng, để trang đăng nhập không phải tải cả thư viện biểu đồ.
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const BlacklistPage = lazy(() => import('@/features/blacklist/BlacklistPage').then((m) => ({ default: m.BlacklistPage })));
const CallDetailPage = lazy(() => import('@/features/calls/CallDetailPage').then((m) => ({ default: m.CallDetailPage })));
const CallsPage = lazy(() => import('@/features/calls/CallsPage').then((m) => ({ default: m.CallsPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PatternsPage = lazy(() => import('@/features/patterns/PatternsPage').then((m) => ({ default: m.PatternsPage })));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const UserDetailPage = lazy(() => import('@/features/users/UserDetailPage').then((m) => ({ default: m.UserDetailPage })));
const UsersPage = lazy(() => import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<Spin style={{ display: 'block', margin: '96px auto' }} />}>
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="calls/:callId" element={<CallDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="blacklist" element={<BlacklistPage />} />
          <Route path="patterns" element={<PatternsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  );
}
