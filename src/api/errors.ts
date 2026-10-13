import { isAxiosError } from 'axios';
import type { ErrorBody, FieldError } from './types';

/** Mã lỗi phía client, khi không nhận được phản hồi của backend. */
export const NETWORK_ERROR = 'NETWORK_ERROR';
/** Đăng nhập đúng nhưng tài khoản không có vai trò ADMIN. */
export const NOT_ADMIN = 'NOT_ADMIN';

const SYSTEM_ERROR = 'Hệ thống gặp lỗi, vui lòng thử lại.';

// Câu tiếng Việt cho từng mã lỗi của backend. Thông báo tiếng Anh của backend không hiện cho người dùng.
const MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa',
  [NOT_ADMIN]: 'Tài khoản này không có quyền quản trị',
  INVALID_REFRESH_TOKEN: 'Phiên đăng nhập đã hết hạn',
  INVALID_RESET_CODE: 'Mã xác nhận không đúng hoặc đã hết hạn',
  INVALID_CURRENT_PASSWORD: 'Mật khẩu hiện tại không đúng',
  VALIDATION_FAILED: 'Dữ liệu nhập chưa hợp lệ',
  MALFORMED_REQUEST: 'Dữ liệu gửi đi không hợp lệ',
  // Tham số sai định dạng (ví dụ id trên URL không phải UUID).
  BAD_REQUEST: 'Yêu cầu không hợp lệ',
  INVALID_PHONE_NUMBER: 'Số điện thoại không hợp lệ (6–15 chữ số)',
  PHONE_NUMBER_ALREADY_BLACKLISTED: 'Số này đã có trong danh sách đen',
  CANNOT_LOCK_OWN_ACCOUNT: 'Bạn không thể khóa chính tài khoản của mình',
  REPORT_ALREADY_REVIEWED: 'Báo cáo này đã được xử lý',
  REPORT_REVIEW_CONFLICT: 'Danh sách vừa thay đổi, vui lòng thử lại',
  UNKNOWN_INDICATOR_CODE: 'Loại dấu hiệu không hợp lệ',
  PATTERN_TOO_SHORT: 'Cụm từ cần ít nhất hai từ',
  INVALID_TIME_ZONE: 'Múi giờ không hợp lệ',
};

/** Câu hiển thị cho một mã lỗi; mã lạ, lỗi hệ thống và lỗi mạng dùng câu chung kèm mã tra cứu. */
export function errorMessage(code: string, requestId?: string | null): string {
  const known = MESSAGES[code];
  if (known) {
    return known;
  }
  if (code.endsWith('_NOT_FOUND') || code === 'NOT_FOUND') {
    return 'Không tìm thấy dữ liệu (có thể đã bị xóa)';
  }
  return requestId ? `${SYSTEM_ERROR} Mã tra cứu: ${requestId}` : SYSTEM_ERROR;
}

/** Lỗi đã chuẩn hóa của mọi lời gọi API; `message` là câu tiếng Việt hiện được cho người dùng. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly fieldErrors: FieldError[];

  constructor(status: number, code: string, requestId: string | null = null, fieldErrors: FieldError[] = []) {
    super(errorMessage(code, requestId));
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.fieldErrors = fieldErrors;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

function isErrorBody(data: unknown): data is ErrorBody {
  return typeof data === 'object' && data !== null && typeof (data as { code?: unknown }).code === 'string';
}

/** Chuyển mọi thứ bị ném ra khi gọi API thành ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAxiosError(error) && error.response) {
    const { status, data } = error.response;
    if (isErrorBody(data)) {
      return new ApiError(status, data.code, data.requestId ?? null, data.fieldErrors ?? []);
    }
    // Phản hồi không theo cấu trúc lỗi của backend (ví dụ proxy báo 502 khi backend chưa chạy).
    return new ApiError(status, status >= 500 ? 'INTERNAL_ERROR' : `HTTP_${status}`);
  }
  return new ApiError(0, NETWORK_ERROR);
}

// Thông báo validation của backend là tiếng Anh; đổi sang tiếng Việt trước khi gắn vào ô của form.
const FIELD_RULES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^must not be (blank|null|empty)$/, () => 'Không được để trống'],
  [/^size must be between (\d+) and (\d+)$/, (m) => `Độ dài phải từ ${m[1]} đến ${m[2]} ký tự`],
  [/well-formed email/, () => 'Email không hợp lệ'],
  [/^must be 6 digits$/, () => 'Mã gồm đúng 6 chữ số'],
  [/^must look like/, () => 'Loại dấu hiệu không hợp lệ'],
];

export function fieldErrorMessage(message: string): string {
  for (const [pattern, toText] of FIELD_RULES) {
    const match = message.match(pattern);
    if (match) {
      return toText(match);
    }
  }
  return 'Giá trị không hợp lệ';
}
