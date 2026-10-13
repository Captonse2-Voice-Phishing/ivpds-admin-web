import { useMutation } from '@tanstack/react-query';
import { App, Form, Input, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import type { ApiError } from '@/api/errors';
import { applyFormErrors } from '@/lib/formErrors';
import { useAuth } from './AuthContext';
import { passwordRules } from './passwordRules';

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const { dropSession } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation<void, ApiError, FormValues>({
    mutationFn: (values) =>
      authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      // Backend đã đăng xuất mọi phiên: xóa phiên ở trình duyệt và về trang đăng nhập.
      message.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
      onClose();
      dropSession();
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      if (!applyFormErrors(form, error, { INVALID_CURRENT_PASSWORD: 'currentPassword' })) {
        message.error(error.message);
      }
    },
  });

  return (
    <Modal
      title="Đổi mật khẩu"
      open={open}
      okText="Đổi mật khẩu"
      cancelText="Hủy"
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
      maskClosable={false}
    >
      <Form form={form} layout="vertical" preserve={false} onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item name="newPassword" label="Mật khẩu mới" rules={passwordRules}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Nhập lại mật khẩu mới"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Nhập lại mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator: (_, value: string | undefined) =>
                !value || value === getFieldValue('newPassword')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Hai mật khẩu không giống nhau')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
