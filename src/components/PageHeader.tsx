import { ArrowLeftOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Flex, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export interface Crumb {
  title: string;
  to?: string;
}

interface Props {
  title: ReactNode;
  crumbs: Crumb[];
  /** Đường dẫn của nút quay lại; không có thì không hiện nút. */
  backTo?: string;
  extra?: ReactNode;
}

/** Đầu mỗi trang: Breadcrumb, tiêu đề và các nút bên phải. */
export function PageHeader({ title, crumbs, backTo, extra }: Props) {
  const navigate = useNavigate();
  return (
    <div style={{ marginBottom: 16 }}>
      <Breadcrumb
        items={[{ title: 'Trang quản trị', to: '/' }, ...crumbs].map((crumb) => ({
          title: crumb.to ? <Link to={crumb.to}>{crumb.title}</Link> : crumb.title,
        }))}
      />
      <Flex justify="space-between" align="center" gap={16} wrap style={{ marginTop: 8 }}>
        <Flex align="center" gap={12} wrap>
          {backTo && (
            <Button
              icon={<ArrowLeftOutlined />}
              aria-label="Quay lại"
              // Có lịch sử trong ứng dụng thì quay lại đúng trang trước (giữ bộ lọc), không thì về trang cha.
              onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(backTo))}
            />
          )}
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
        </Flex>
        {extra && (
          <Flex align="center" gap={8} wrap>
            {extra}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
