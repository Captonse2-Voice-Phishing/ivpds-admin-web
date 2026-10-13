import type { FormInstance } from 'antd';
import { fieldErrorMessage, type ApiError } from '@/api/errors';

/**
 * Gắn lỗi của backend vào đúng ô của form.
 * `codeFields` cho biết mã lỗi nghiệp vụ nào thuộc về ô nào (ví dụ INVALID_PHONE_NUMBER → phoneNumber).
 * Trả về true nếu đã gắn được vào ít nhất một ô; false thì nơi gọi hiện lỗi bằng message.
 */
export function applyFormErrors<T extends object>(
  form: FormInstance<T>,
  error: ApiError,
  codeFields: Record<string, keyof T & string> = {},
): boolean {
  // Chỉ các ô đang hiện trên form; lỗi của trường khác để nơi gọi báo bằng message.
  const known = new Set(Object.keys(form.getFieldsValue() as object));
  const fields: Array<{ name: string; errors: string[] }> = [];

  for (const fieldError of error.fieldErrors) {
    if (known.has(fieldError.field)) {
      fields.push({ name: fieldError.field, errors: [fieldErrorMessage(fieldError.message)] });
    }
  }
  const codeField = codeFields[error.code];
  if (codeField) {
    fields.push({ name: codeField, errors: [error.message] });
  }
  if (fields.length === 0) {
    return false;
  }
  // Kiểu tên trường của antd rất sâu với form tổng quát; tên ở đây đã được kiểm tra ở trên.
  (form as unknown as FormInstance<Record<string, unknown>>).setFields(fields);
  return true;
}
