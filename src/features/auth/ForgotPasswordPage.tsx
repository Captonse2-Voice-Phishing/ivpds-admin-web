import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button, Form, Input, Steps } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import type { ApiError } from '@/api/errors';
import { passwordRules } from '@/auth/passwordRules';
import { applyFormErrors } from '@/lib/formErrors';
import { AuthCard } from './AuthCard';

interface EmailValues {
  email: string;
}

interface ResetValues {
  code: string;
  newPassword: string;
}

// Mỗi bước là một thành phần có form riêng: quay lại bước 1 là một form mới hoàn toàn.

/** Bước 1: nhập email để nhận mã. */
function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [form] = Form.useForm<EmailValues>();
  const { message } = App.useApp();

  const request = useMutation<void, ApiError, string>({
    mutationFn: (email) => authApi.forgotPassword(email),
    onSuccess: (_, email) => onSent(email),
    onError: (error) => {
      if (!applyFormErrors(form, error)) {
        message.error(error.message);
      }
    },
  });

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(values) => request.mutate(values.email.trim())}
    >
      <Form.Item
        name="email"
        label="Email của tài khoản"
        rules={[
          { required: true, message: 'Nhập email' },
          { type: 'email', message: 'Email không hợp lệ' },
        ]}
      >
        <Input size="large" autoComplete="username" autoFocus />
      </Form.Item>
      <Button type="primary" htmlType="submit" size="large" block loading={request.isPending}>
        Gửi mã xác nhận
      </Button>
    </Form>
  );
}

/** Bước 2: nhập mã 6 số và mật khẩu mới. */
function ResetStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const [form] = Form.useForm<ResetValues>();
  const { message } = App.useApp();
  const navigate = useNavigate();

  const reset = useMutation<void, ApiError, ResetValues>({
    mutationFn: (values) => authApi.resetPassword({ email, code: values.code, newPassword: values.newPassword }),
    onSuccess: () => {
      message.success('Đã đặt lại mật khẩu. Vui lòng đăng nhập.');
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      if (!applyFormErrors(form, error, { INVALID_RESET_CODE: 'code' })) {
        message.error(error.message);
      }
    },
  });

  return (
    <>
      {/* Backend không tiết lộ email có tồn tại hay không. */}
      <Alert type="info" showIcon message="Nếu email tồn tại, mã đã được gửi" style={{ marginBottom: 16 }} />
      <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => reset.mutate(values)}>
        <Form.Item
          name="code"
          label="Mã xác nhận (6 số)"
          rules={[
            { required: true, message: 'Nhập mã xác nhận' },
            { pattern: /^\d{6}$/, message: 'Mã gồm đúng 6 chữ số' },
          ]}
        >
          <Input.OTP length={6} size="large" formatter={(value) => value.replace(/\D/g, '')} />
        </Form.Item>
        <Form.Item name="newPassword" label="Mật khẩu mới" rules={passwordRules}>
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={reset.isPending}>
          Đặt lại mật khẩu
        </Button>
      </Form>
      <Button type="link" block style={{ marginTop: 8 }} disabled={reset.isPending} onClick={onChangeEmail}>
        Dùng email khác
      </Button>
    </>
  );
}

export function ForgotPasswordPage() {
  // Có email nghĩa là đã qua bước 1.
  const [email, setEmail] = useState<string | null>(null);

  return (
    <AuthCard>
      <Steps
        size="small"
        current={email ? 1 : 0}
        items={[{ title: 'Nhập email' }, { title: 'Đặt mật khẩu mới' }]}
        style={{ marginBottom: 24 }}
      />
      {email === null ? <EmailStep onSent={setEmail} /> : <ResetStep email={email} onChangeEmail={() => setEmail(null)} />}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/login">Quay lại đăng nhập</Link>
      </div>
    </AuthCard>
  );
}
