// Tên tiếng Việt và màu của mọi mã backend trả về. Các màn hình chỉ lấy từ đây, không tự viết lại.

import type { AnalysisStatus, CallSource, ReportStatus, RiskLevel, UserStatus } from '@/api/types';
import { RISK_COLORS, STATUS_COLORS } from '@/theme/theme';

export const RISK_LEVELS: RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW'];

export const RISK_LABELS: Record<RiskLevel, string> = {
  HIGH: 'Nguy cơ cao',
  MEDIUM: 'Đáng ngờ',
  LOW: 'An toàn',
};

export const NO_RESULT_LABEL = 'Chưa có kết quả';

export function riskColor(level: RiskLevel | null | undefined): string {
  return level ? RISK_COLORS[level] : RISK_COLORS.NONE;
}

export function riskLabel(level: RiskLevel | null | undefined): string {
  return level ? RISK_LABELS[level] : NO_RESULT_LABEL;
}

export const ANALYSIS_STATUSES: AnalysisStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

export const ANALYSIS_STATUS_LABELS: Record<AnalysisStatus, string> = {
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang phân tích',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Lỗi',
};

export const ANALYSIS_STATUS_COLORS: Record<AnalysisStatus, string> = {
  PENDING: STATUS_COLORS.neutral,
  PROCESSING: STATUS_COLORS.info,
  COMPLETED: STATUS_COLORS.success,
  FAILED: STATUS_COLORS.danger,
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khóa',
};

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: STATUS_COLORS.success,
  LOCKED: STATUS_COLORS.danger,
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: STATUS_COLORS.warning,
  APPROVED: STATUS_COLORS.success,
  REJECTED: STATUS_COLORS.neutral,
};

export const CALL_SOURCES: CallSource[] = ['RECORDED', 'UPLOADED', 'LIVE'];

export const CALL_SOURCE_LABELS: Record<CallSource, string> = {
  RECORDED: 'Ghi âm trong ứng dụng',
  UPLOADED: 'Tải file lên',
  LIVE: 'Cuộc gọi trực tiếp',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  USER: 'Người dùng',
};

// ---------------------------------------------------------------- dấu hiệu lừa đảo

interface IndicatorInfo {
  label: string;
  hint: string;
}

const INDICATORS: Record<string, IndicatorInfo> = {
  OTP_REQUEST: { label: 'Đòi mã OTP', hint: 'Người gọi yêu cầu đọc mã OTP' },
  MONEY_TRANSFER: { label: 'Yêu cầu chuyển tiền', hint: 'Người gọi yêu cầu chuyển tiền' },
  BANK_IMPERSONATION: { label: 'Giả danh ngân hàng', hint: 'Người gọi tự xưng nhân viên ngân hàng' },
  URGENCY: { label: 'Thúc giục', hint: 'Ép làm ngay, không cho thời gian suy nghĩ' },
  ACCOUNT_LOCK_THREAT: { label: 'Dọa khóa tài khoản', hint: 'Dọa tài khoản sẽ bị khóa' },
  SENSITIVE_INFORMATION: { label: 'Đòi thông tin nhạy cảm', hint: 'Hỏi số thẻ, mật khẩu, CCCD' },
  AUTHORITY_IMPERSONATION: {
    label: 'Giả danh cơ quan chức năng',
    hint: 'Tự xưng công an, viện kiểm sát, tòa án',
  },
  LEGAL_THREAT: { label: 'Đe dọa pháp lý', hint: 'Dọa bắt giữ, khởi tố, liên quan vụ án' },
  HARM_THREAT: { label: 'Đe dọa gây hại', hint: 'Đe dọa gây hại cho người nghe hoặc người thân' },
  SECRECY_DEMAND: { label: 'Yêu cầu giữ bí mật', hint: 'Yêu cầu không nói với ai' },
  REMOTE_ACCESS_REQUEST: { label: 'Yêu cầu điều khiển từ xa', hint: 'Yêu cầu cài ứng dụng, chia sẻ màn hình' },
  FINANCIAL_BAIT: { label: 'Mồi tài chính', hint: 'Trúng thưởng, hoàn tiền, lãi cao' },
  UNUSUAL_PAYMENT: { label: 'Thanh toán bất thường', hint: 'Hình thức thanh toán khác thường' },
  CALL_HANDOFF: { label: 'Chuyển máy', hint: 'Chuyển máy cho "cán bộ" khác' },
  COORDINATED_CALLERS: { label: 'Nhiều người phối hợp', hint: 'Nhiều người phía gọi đến cùng tham gia' },
};

/** Các mã dùng được cho mẫu lừa đảo: mọi mã trừ COORDINATED_CALLERS (mã này chỉ để hiển thị). */
export const PATTERN_INDICATOR_CODES: string[] = Object.keys(INDICATORS).filter(
  (code) => code !== 'COORDINATED_CALLERS',
);

/** Tên hiển thị của dấu hiệu; mã lạ thì hiện nguyên mã. */
export function indicatorLabel(code: string): string {
  return INDICATORS[code]?.label ?? code;
}

export function indicatorHint(code: string): string | undefined {
  return INDICATORS[code]?.hint;
}

// ---------------------------------------------------------------- lỗi phân tích

const UNKNOWN_ANALYSIS_ERROR = 'Phân tích gặp lỗi không xác định';

const ANALYSIS_ERROR_GROUPS: Array<[string[], string]> = [
  [['NO_SPEECH_DETECTED'], 'Không nhận ra lời nói trong ghi âm'],
  [['INVALID_AUDIO', 'EMPTY_AUDIO'], 'File ghi âm không đọc được'],
  [['AUDIO_TOO_LONG', 'AUDIO_TOO_LARGE', 'PAYLOAD_TOO_LARGE'], 'Ghi âm vượt giới hạn cho phép'],
  [['CALL_HAS_NO_AUDIO', 'AUDIO_OBJECT_MISSING'], 'Cuộc gọi không còn file ghi âm'],
  [['STT_UNAVAILABLE', 'STT_FAILED'], 'Nhận dạng giọng nói gặp lỗi'],
  [['NLP_MODEL_UNAVAILABLE'], 'Model đánh giá rủi ro chưa sẵn sàng'],
  [['AUDIO_PROCESSING_UNAVAILABLE', 'AUDIO_PROCESSING_TIMEOUT'], 'Xử lý âm thanh gặp lỗi'],
  [['AI_SERVICE_UNAVAILABLE', 'AI_SERVICE_TIMEOUT', 'AI_SERVICE_ERROR'], 'Dịch vụ AI không phản hồi'],
  [
    ['AI_SERVICE_AUTH_FAILED', 'AI_REQUEST_REJECTED', 'AI_INVALID_RESPONSE'],
    'Lỗi cấu hình giữa backend và dịch vụ AI',
  ],
  [['STORAGE_UNAVAILABLE'], 'Kho lưu trữ không phản hồi'],
  [['ANALYSIS_QUEUE_FULL'], 'Hàng chờ phân tích đã đầy'],
  [['ANALYSIS_INTERRUPTED'], 'Phân tích bị gián đoạn do hệ thống khởi động lại'],
  [['LIVE_CALL_NOT_STARTED'], 'Cuộc gọi trực tiếp được mở nhưng không có âm thanh'],
  [
    ['LIVE_SESSION_LIMIT', 'LIVE_SESSION_OVERLOADED', 'LIVE_SESSION_FAILED'],
    'Phân tích trực tiếp quá tải hoặc gặp lỗi',
  ],
];

const ANALYSIS_ERRORS = new Map<string, string>(
  ANALYSIS_ERROR_GROUPS.flatMap(([codes, text]) => codes.map((code): [string, string] => [code, text])),
);

/** Câu hiển thị cho `analysis.errorCode`. */
export function analysisErrorText(code: string | null | undefined): string {
  return (code && ANALYSIS_ERRORS.get(code)) || UNKNOWN_ANALYSIS_ERROR;
}
