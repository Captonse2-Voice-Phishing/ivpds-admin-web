import { Card, Flex, Typography } from 'antd';
import type { ReactNode } from 'react';
import { PRIMARY_COLOR } from '@/theme/theme';

/** Khung chung của trang đăng nhập và quên mật khẩu: thẻ căn giữa trên nền xanh đậm. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: 24, background: PRIMARY_COLOR }}>
      <Card style={{ width: 420, maxWidth: '100%' }} styles={{ body: { padding: 32 } }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={1} style={{ margin: 0, color: PRIMARY_COLOR, letterSpacing: 2 }}>
            IVPDS
          </Typography.Title>
          <Typography.Text type="secondary">
            Hệ thống phát hiện lừa đảo qua cuộc gọi — Trang quản trị
          </Typography.Text>
        </div>
        {children}
      </Card>
    </Flex>
  );
}
