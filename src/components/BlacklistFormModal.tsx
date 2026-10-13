import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { blacklistApi, queryKeys } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import type { BlacklistEntry } from '@/api/types';
import { applyFormErrors } from '@/lib/formErrors';

interface FormValues {
  phoneNumber: string;
  reason?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Có `entry` là sửa lý do của dòng đó; không có là thêm số mới. */
  entry?: BlacklistEntry | null;
  /** Số điền sẵn khi thêm (từ trang Tổng quan hoặc chi tiết cuộc gọi). */
  initialPhoneNumber?: string;
}

/** Số hợp lệ có 6–15 chữ số; cho phép dấu +, khoảng trắng, chấm, gạch vì backend tự chuẩn hóa. */
function isValidPhone(value: string): boolean {
  if (!/^\+?[\d\s.()-]+$/.test(value.trim())) {
    return false;
  }
  const digits = value.replace(/\D/g, '').length;
  return digits >= 6 && digits <= 15;
}

/** Form thêm số vào danh sách đen hoặc sửa lý do; dùng ở Danh sách đen, Tổng quan và chi tiết cuộc gọi. */
export function BlacklistFormModal({ open, onClose, entry, initialPhoneNumber }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const editing = Boolean(entry);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        phoneNumber: entry?.phoneNumber ?? initialPhoneNumber ?? '',
        reason: entry?.reason ?? '',
      });
    }
  }, [open, entry, initialPhoneNumber, form]);

  const mutation = useMutation<BlacklistEntry, ApiError, FormValues>({
    mutationFn: (values) => {
      const reason = values.reason?.trim() ?? '';
      // Sửa: gửi cả chuỗi rỗng để xóa lý do. Thêm: bỏ trống thì không gửi.
      return entry
        ? blacklistApi.update(entry.id, { reason })
        : blacklistApi.add({ phoneNumber: values.phoneNumber.trim(), reason: reason || undefined });
    },
    onSuccess: (saved) => {
      message.success(editing ? 'Đã cập nhật lý do' : `Đã thêm ${saved.phoneNumber} vào danh sách đen`);
      // Số bị chặn làm thay đổi danh sách đen, thống kê, nhãn ở cuộc gọi và ở báo cáo.
      for (const key of [queryKeys.blacklist, queryKeys.statistics, queryKeys.calls, queryKeys.reports]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      onClose();
    },
    onError: (error) => {
      const shown = applyFormErrors(form, error, {
        INVALID_PHONE_NUMBER: 'phoneNumber',
        PHONE_NUMBER_ALREADY_BLACKLISTED: 'phoneNumber',
      });
      if (!shown) {
        message.error(error.message);
      }
    },
  });

  return (
    <Modal
      title={editing ? 'Sửa lý do chặn' : 'Thêm số vào danh sách đen'}
      open={open}
      okText={editing ? 'Lưu' : 'Thêm số'}
      cancelText="Hủy"
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      afterClose={() => form.resetFields()}
      maskClosable={false}
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="phoneNumber"
          label="Số điện thoại"
          extra={editing ? undefined : 'Ví dụ: 0901234567 hoặc +84901234567'}
          rules={
            editing
              ? undefined
              : [
                  { required: true, whitespace: true, message: 'Nhập số điện thoại' },
                  {
                    validator: (_, value: string | undefined) =>
                      !value?.trim() || isValidPhone(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('Số điện thoại không hợp lệ (6–15 chữ số)')),
                  },
                ]
          }
        >
          <Input readOnly={editing} variant={editing ? 'filled' : 'outlined'} className="phone-mono" inputMode="tel" />
        </Form.Item>
        <Form.Item
          name="reason"
          label="Lý do"
          extra="Lý do này hiển thị cho người dùng khi tra cứu"
          rules={[{ max: 1000, message: 'Lý do tối đa 1000 ký tự' }]}
        >
          <Input.TextArea rows={4} maxLength={1000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
