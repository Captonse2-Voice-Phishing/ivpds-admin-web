import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { ApiError, NETWORK_ERROR, errorMessage, fieldErrorMessage, toApiError } from './errors';
import { analysisErrorText } from '@/lib/labels';

function axiosError(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

describe('ánh xạ mã lỗi của backend sang câu tiếng Việt', () => {
  it('mã nghiệp vụ có câu riêng', () => {
    expect(errorMessage('INVALID_PHONE_NUMBER')).toBe('Số điện thoại không hợp lệ (6–15 chữ số)');
    expect(errorMessage('PHONE_NUMBER_ALREADY_BLACKLISTED')).toBe('Số này đã có trong danh sách đen');
    expect(errorMessage('CANNOT_LOCK_OWN_ACCOUNT')).toBe('Bạn không thể khóa chính tài khoản của mình');
    expect(errorMessage('REPORT_ALREADY_REVIEWED')).toBe('Báo cáo này đã được xử lý');
    expect(errorMessage('REPORT_REVIEW_CONFLICT')).toBe('Danh sách vừa thay đổi, vui lòng thử lại');
    expect(errorMessage('UNKNOWN_INDICATOR_CODE')).toBe('Loại dấu hiệu không hợp lệ');
    expect(errorMessage('PATTERN_TOO_SHORT')).toBe('Cụm từ cần ít nhất hai từ');
    expect(errorMessage('INVALID_TIME_ZONE')).toBe('Múi giờ không hợp lệ');
    expect(errorMessage('UNAUTHORIZED')).toBe('Phiên đăng nhập đã hết hạn');
    expect(errorMessage('FORBIDDEN')).toBe('Bạn không có quyền thực hiện thao tác này');
  });

  it('mọi mã *_NOT_FOUND dùng chung một câu', () => {
    const text = 'Không tìm thấy dữ liệu (có thể đã bị xóa)';
    expect(errorMessage('CALL_NOT_FOUND')).toBe(text);
    expect(errorMessage('USER_NOT_FOUND')).toBe(text);
    expect(errorMessage('BLACKLIST_ENTRY_NOT_FOUND')).toBe(text);
    expect(errorMessage('PHISHING_PATTERN_NOT_FOUND')).toBe(text);
  });

  it('lỗi hệ thống và mã lạ kèm mã tra cứu', () => {
    expect(errorMessage('INTERNAL_ERROR', 'req-1')).toBe('Hệ thống gặp lỗi, vui lòng thử lại. Mã tra cứu: req-1');
    expect(errorMessage('SOMETHING_NEW', 'req-2')).toBe('Hệ thống gặp lỗi, vui lòng thử lại. Mã tra cứu: req-2');
    expect(errorMessage(NETWORK_ERROR)).toBe('Hệ thống gặp lỗi, vui lòng thử lại.');
  });
});

describe('toApiError', () => {
  it('đọc mã, mã tra cứu và lỗi từng trường từ phản hồi của backend', () => {
    const error = toApiError(
      axiosError(400, {
        timestamp: '2026-10-10T06:15:30.123Z',
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed.',
        path: '/api/v1/admin/phishing-patterns',
        requestId: 'abc',
        fieldErrors: [{ field: 'pattern', message: 'must not be blank' }],
      }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.requestId).toBe('abc');
    expect(error.fieldErrors).toEqual([{ field: 'pattern', message: 'must not be blank' }]);
    // Không hiện thông báo tiếng Anh của backend.
    expect(error.message).toBe('Dữ liệu nhập chưa hợp lệ');
  });

  it('không có phản hồi thì là lỗi mạng', () => {
    const error = toApiError(new AxiosError('Network Error', AxiosError.ERR_NETWORK));
    expect(error.code).toBe(NETWORK_ERROR);
    expect(error.status).toBe(0);
  });

  it('phản hồi 5xx không theo cấu trúc của backend là lỗi hệ thống', () => {
    expect(toApiError(axiosError(502, '<html>Bad Gateway</html>')).code).toBe('INTERNAL_ERROR');
  });
});

describe('thông báo của từng trường và lỗi phân tích', () => {
  it('đổi thông báo validation sang tiếng Việt', () => {
    expect(fieldErrorMessage('must not be blank')).toBe('Không được để trống');
    expect(fieldErrorMessage('size must be between 8 and 72')).toBe('Độ dài phải từ 8 đến 72 ký tự');
    expect(fieldErrorMessage('anything else')).toBe('Giá trị không hợp lệ');
  });

  it('mã lỗi phân tích có câu tương ứng, mã lạ dùng câu chung', () => {
    expect(analysisErrorText('NO_SPEECH_DETECTED')).toBe('Không nhận ra lời nói trong ghi âm');
    expect(analysisErrorText('EMPTY_AUDIO')).toBe('File ghi âm không đọc được');
    expect(analysisErrorText('AI_SERVICE_TIMEOUT')).toBe('Dịch vụ AI không phản hồi');
    expect(analysisErrorText('LIVE_SESSION_OVERLOADED')).toBe('Phân tích trực tiếp quá tải hoặc gặp lỗi');
    expect(analysisErrorText('WHATEVER')).toBe('Phân tích gặp lỗi không xác định');
    expect(analysisErrorText(null)).toBe('Phân tích gặp lỗi không xác định');
  });
});
