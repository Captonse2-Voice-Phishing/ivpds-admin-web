// Kiểu dữ liệu của mọi request và response, theo đúng hợp đồng API của backend.

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type CallSource = 'RECORDED' | 'UPLOADED' | 'LIVE';
export type UserStatus = 'ACTIVE' | 'LOCKED';
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Tham số phân trang gửi lên backend; `page` bắt đầu từ 0. */
export interface PageParams {
  page: number;
  size: number;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface FieldError {
  field: string;
  message: string;
}

/** Cấu trúc lỗi chung của backend. */
export interface ErrorBody {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string | null;
  requestId: string | null;
  fieldErrors?: FieldError[] | null;
}

// ---------------------------------------------------------------- đăng nhập

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ---------------------------------------------------------------- thống kê

export interface IndicatorCount {
  indicator: string;
  calls: number;
}

export interface SuspectedNumber {
  phoneNumber: string;
  highRiskCalls: number;
  users: number;
  lastCallAt: string;
}

export interface DailyCount {
  date: string;
  calls: number;
  high: number;
  medium: number;
  low: number;
  unanalysed: number;
}

export interface Statistics {
  generatedAt: string;
  periodDays: number;
  timeZone: string;
  users: { total: number; active: number; locked: number; newInPeriod: number };
  calls: { total: number; newInPeriod: number } & Record<CallSource, number>;
  analysesByStatus: Record<AnalysisStatus, number>;
  callsByRiskLevel: Record<RiskLevel, number>;
  topIndicators: IndicatorCount[];
  blacklist: { total: number; active: number };
  blacklistReports: Record<ReportStatus, number>;
  phishingPatterns: { total: number; active: number };
  suspectedNumbers: SuspectedNumber[];
  daily: DailyCount[];
}

// ---------------------------------------------------------------- cuộc gọi

export interface AnalysisDetails {
  sttModel: string | null;
  modelProbability: number | null;
  nlpModelVersion: string | null;
  rulesetVersion: string | null;
  riskEngineVersion: string | null;
}

export interface AnalysisSummary {
  id: string;
  status: AnalysisStatus;
  errorCode: string | null;
  errorMessage: string | null;
  completedAt: string | null;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  confidence: number | null;
  indicators: string[] | null;
  /** Chỉ có ở API chi tiết. */
  transcript: string | null;
  /** Chỉ có ở API chi tiết. */
  details: AnalysisDetails | null;
}

export interface CallOwner {
  id: string;
  email: string;
  fullName: string;
}

export interface AdminCall {
  callId: string;
  callerNumber: string | null;
  callerBlacklisted: boolean;
  calledAt: string | null;
  source: CallSource;
  createdAt: string;
  durationSeconds: number | null;
  analysis: AnalysisSummary | null;
  owner: CallOwner | null;
}

export interface CallListParams extends PageParams {
  riskLevel?: RiskLevel;
  status?: AnalysisStatus;
  userId?: string;
  from?: string;
  to?: string;
  callerNumber?: string;
}

// ---------------------------------------------------------------- người dùng

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  status: UserStatus;
  roles: string[];
  blacklistAlertEnabled: boolean;
  createdAt: string;
}

export interface UserListParams extends PageParams {
  query?: string;
  status?: UserStatus;
}

// ---------------------------------------------------------------- danh sách đen

export interface BlacklistEntry {
  id: string;
  phoneNumber: string;
  reason: string | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlacklistListParams extends PageParams {
  query?: string;
  active?: boolean;
}

export interface BlacklistAddRequest {
  phoneNumber: string;
  reason?: string;
}

export interface BlacklistUpdateRequest {
  reason?: string;
  active?: boolean;
}

// ---------------------------------------------------------------- báo cáo số lừa đảo

export interface BlacklistReport {
  id: string;
  phoneNumber: string;
  reporterId: string;
  callId: string | null;
  reason: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reportsForNumber: number;
  blacklisted: boolean;
}

export interface ReportListParams extends PageParams {
  status?: ReportStatus;
  query?: string;
}

// ---------------------------------------------------------------- mẫu lừa đảo

export interface PhishingPattern {
  id: string;
  name: string;
  indicatorCode: string;
  pattern: string;
  description: string | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatternListParams extends PageParams {
  query?: string;
  indicatorCode?: string;
  active?: boolean;
}

export interface PatternCreateRequest {
  name: string;
  indicatorCode: string;
  pattern: string;
  description?: string;
}

export interface PatternUpdateRequest {
  name?: string;
  indicatorCode?: string;
  pattern?: string;
  /** Chuỗi rỗng nghĩa là xóa mô tả. */
  description?: string;
  active?: boolean;
}
