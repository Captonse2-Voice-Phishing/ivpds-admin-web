import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';
import { Link } from 'react-router-dom';
import type { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { applyFormErrors } from '@/lib/formErrors';
import { AuthCard } from './AuthCard';

interface FormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const [form] = Form.useForm<FormValues>();
  const { login } = useAuth();

  // Đăng nhập xong thì GuestOnly tự chuyển vào trang quản trị (hoặc trang đang mở dở).
  const mutation = useMutation<void, ApiError, FormValues>({
    mutationFn: (values) => login(values.email.trim(), values.password),
    onError: (error) => {
      applyFormErrors(form, error);
    },
  });

  // Lỗi của từng ô đã hiện dưới ô đó; các lỗi còn lại hiện bằng Alert trong thẻ.
  const alert = mutation.error && mutation.error.fieldErrors.length === 0 ? mutation.error.message : null;

  return (
    <AuthCard>
      {alert && <Alert type="error" showIcon message={alert} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input prefix={<MailOutlined />} size="large" autoComplete="username" autoFocus />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
          <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={mutation.isPending}>
          Đăng nhập
        </Button>
      </Form>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/forgot-password">Quên mật khẩu?</Link>
      </div>
    </AuthCard>
  );
}
