import { useMutation } from '@tanstack/react-query';
import { App, Form, Input, Modal, Select, Typography } from 'antd';
import { useEffect } from 'react';
import { patternsApi } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import type { PhishingPattern } from '@/api/types';
import { applyFormErrors } from '@/lib/formErrors';
import { PATTERN_INDICATOR_CODES, indicatorLabel } from '@/lib/labels';

interface FormValues {
  name: string;
  indicatorCode: string;
  pattern: string;
  description?: string;
}

interface Props {
  open: boolean;
  /** Có `pattern` là sửa; không có là thêm mới. */
  pattern?: PhishingPattern | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Đếm từ như backend: dấu câu không tính là từ. */
function wordCount(phrase: string): number {
  return phrase
    .normalize('NFC')
    .split(/[^\p{L}\p{N}_]+/u)
    .filter(Boolean).length;
}

const INDICATOR_OPTIONS = PATTERN_INDICATOR_CODES.map((code) => ({ value: code, label: indicatorLabel(code) }));

export function PatternFormModal({ open, pattern, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const editing = Boolean(pattern);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (pattern) {
        form.setFieldsValue({
          name: pattern.name,
          indicatorCode: pattern.indicatorCode,
          pattern: pattern.pattern,
          description: pattern.description ?? '',
        });
      }
    }
  }, [open, pattern, form]);

  const mutation = useMutation<PhishingPattern, ApiError, FormValues>({
    mutationFn: (values) => {
      const body = {
        name: values.name.trim(),
        indicatorCode: values.indicatorCode,
        pattern: values.pattern.trim(),
      };
      const description = values.description?.trim() ?? '';
      // Sửa: chuỗi rỗng nghĩa là xóa mô tả. Thêm: bỏ trống thì không gửi.
      return pattern
        ? patternsApi.update(pattern.id, { ...body, description })
        : patternsApi.create({ ...body, description: description || undefined });
    },
    onSuccess: () => {
      message.success(editing ? 'Đã cập nhật mẫu' : 'Đã thêm mẫu');
      onSaved();
      onClose();
    },
    onError: (error) => {
      const shown = applyFormErrors(form, error, {
        PATTERN_TOO_SHORT: 'pattern',
        UNKNOWN_INDICATOR_CODE: 'indicatorCode',
      });
      if (!shown) {
        message.error(error.message);
      }
    },
  });

  return (
    <Modal
      title={editing ? 'Sửa mẫu lừa đảo' : 'Thêm mẫu lừa đảo'}
      width={560}
      open={open}
      okText={editing ? 'Lưu' : 'Thêm mẫu'}
      cancelText="Hủy"
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      maskClosable={false}
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="name"
          label="Tên mẫu"
          rules={[
            { required: true, whitespace: true, message: 'Nhập tên mẫu' },
            { max: 150, message: 'Tên mẫu tối đa 150 ký tự' },
          ]}
        >
          <Input maxLength={150} />
        </Form.Item>
        <Form.Item name="indicatorCode" label="Loại dấu hiệu" rules={[{ required: true, message: 'Chọn loại dấu hiệu' }]}>
          <Select
            showSearch
            placeholder="Chọn loại dấu hiệu"
            options={INDICATOR_OPTIONS}
            // Tìm theo cả tên tiếng Việt và mã.
            filterOption={(input, option) =>
              `${option?.label ?? ''} ${option?.value ?? ''}`.toLowerCase().includes(input.trim().toLowerCase())
            }
            optionRender={(option) => (
              <div>
                <div>{option.label}</div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {option.value}
                </Typography.Text>
              </div>
            )}
          />
        </Form.Item>
        <Form.Item
          name="pattern"
          label="Cụm từ"
          extra="Viết đúng như cách kẻ lừa đảo nói, ví dụ: tài khoản sẽ bị khóa"
          rules={[
            { required: true, whitespace: true, message: 'Nhập cụm từ' },
            { max: 200, message: 'Cụm từ tối đa 200 ký tự' },
            {
              validator: (_, value: string | undefined) =>
                !value?.trim() || wordCount(value) >= 2
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('Cụm từ cần ít nhất hai từ; một từ đơn lẻ sẽ khớp quá nhiều câu bình thường.'),
                    ),
            },
          ]}
        >
          <Input maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="description" label="Mô tả" rules={[{ max: 2000, message: 'Mô tả tối đa 2000 ký tự' }]}>
          <Input.TextArea rows={3} maxLength={2000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
