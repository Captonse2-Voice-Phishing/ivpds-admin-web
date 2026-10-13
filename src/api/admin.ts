import { api } from './client';
import type {
  AdminCall,
  AdminUser,
  BlacklistAddRequest,
  BlacklistEntry,
  BlacklistListParams,
  BlacklistReport,
  BlacklistUpdateRequest,
  CallListParams,
  PageResponse,
  PatternCreateRequest,
  PatternListParams,
  PatternUpdateRequest,
  PhishingPattern,
  ReportListParams,
  Statistics,
  UserListParams,
  UserStatus,
} from './types';

/** Múi giờ dùng để chia ngày trong thống kê và để hiển thị thời gian. */
export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const statisticsApi = {
  get: (days: number) =>
    api.get<Statistics>('/admin/statistics', { params: { days, timeZone: APP_TIME_ZONE } }).then((r) => r.data),
};

export const callsApi = {
  list: (params: CallListParams) =>
    api.get<PageResponse<AdminCall>>('/admin/calls', { params }).then((r) => r.data),
  get: (callId: string) => api.get<AdminCall>(`/admin/calls/${callId}`).then((r) => r.data),
};

export const usersApi = {
  list: (params: UserListParams) =>
    api.get<PageResponse<AdminUser>>('/admin/users', { params }).then((r) => r.data),
  get: (id: string) => api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),
  setStatus: (id: string, status: UserStatus) =>
    api.patch<AdminUser>(`/admin/users/${id}/status`, { status }).then((r) => r.data),
};

export const blacklistApi = {
  list: (params: BlacklistListParams) =>
    api.get<PageResponse<BlacklistEntry>>('/admin/blacklist', { params }).then((r) => r.data),
  add: (body: BlacklistAddRequest) => api.post<BlacklistEntry>('/admin/blacklist', body).then((r) => r.data),
  update: (id: string, body: BlacklistUpdateRequest) =>
    api.patch<BlacklistEntry>(`/admin/blacklist/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/admin/blacklist/${id}`).then(() => undefined),
};

export const reportsApi = {
  list: (params: ReportListParams) =>
    api.get<PageResponse<BlacklistReport>>('/admin/blacklist/reports', { params }).then((r) => r.data),
  /** Duyệt: chặn số và duyệt luôn mọi báo cáo đang chờ về số đó. Bỏ trống lý do thì dùng lý do của báo cáo. */
  approve: (id: string, reason?: string) =>
    api
      .post<BlacklistReport>(`/admin/blacklist/reports/${id}/approve`, reason ? { reason } : {})
      .then((r) => r.data),
  reject: (id: string) => api.post<BlacklistReport>(`/admin/blacklist/reports/${id}/reject`).then((r) => r.data),
};

export const patternsApi = {
  list: (params: PatternListParams) =>
    api.get<PageResponse<PhishingPattern>>('/admin/phishing-patterns', { params }).then((r) => r.data),
  create: (body: PatternCreateRequest) =>
    api.post<PhishingPattern>('/admin/phishing-patterns', body).then((r) => r.data),
  update: (id: string, body: PatternUpdateRequest) =>
    api.patch<PhishingPattern>(`/admin/phishing-patterns/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/admin/phishing-patterns/${id}`).then(() => undefined),
};

// Khóa truy vấn dùng chung, để sau mỗi thao tác làm mới đúng nhóm dữ liệu liên quan.
export const queryKeys = {
  statistics: ['statistics'] as const,
  calls: ['calls'] as const,
  users: ['users'] as const,
  blacklist: ['blacklist'] as const,
  reports: ['reports'] as const,
  patterns: ['patterns'] as const,
};
