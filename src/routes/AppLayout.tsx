import {
  DashboardOutlined,
  DownOutlined,
  FlagOutlined,
  KeyOutlined,
  LogoutOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Flex, Layout, Menu, Spin, Typography } from 'antd';
import { Suspense, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStatistics } from '@/api/queries';
import { useAuth } from '@/auth/AuthContext';
import { ChangePasswordModal } from '@/auth/ChangePasswordModal';
import { STATUS_COLORS } from '@/theme/theme';

interface Section {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
}

const SECTIONS: Section[] = [
  { key: 'dashboard', path: '/', label: 'Tổng quan', icon: <DashboardOutlined /> },
  { key: 'calls', path: '/calls', label: 'Cuộc gọi', icon: <PhoneOutlined /> },
  { key: 'reports', path: '/reports', label: 'Báo cáo', icon: <FlagOutlined /> },
  { key: 'blacklist', path: '/blacklist', label: 'Danh sách đen', icon: <StopOutlined /> },
  { key: 'patterns', path: '/patterns', label: 'Mẫu lừa đảo', icon: <SafetyCertificateOutlined /> },
  { key: 'users', path: '/users', label: 'Người dùng', icon: <TeamOutlined /> },
];

function currentSection(pathname: string): Section | undefined {
  return SECTIONS.find((s) => (s.path === '/' ? pathname === '/' : pathname.startsWith(s.path)));
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const section = currentSection(location.pathname);
  // Số báo cáo chờ duyệt cho huy hiệu ở thanh bên.
  const pending = useStatistics().data?.blacklistReports.PENDING ?? 0;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        // Dưới 1200px thanh bên tự thu gọn, để ở 992px nội dung vẫn đủ chỗ.
        breakpoint="xl"
        width={228}
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
      >
        <Link to="/" style={{ display: 'block', padding: collapsed ? '18px 0' : '18px 24px', textAlign: collapsed ? 'center' : 'left' }}>
          <Typography.Text strong style={{ color: '#fff', fontSize: collapsed ? 14 : 20, letterSpacing: 1 }}>
            IVPDS
          </Typography.Text>
          {!collapsed && (
            <Typography.Text style={{ color: 'rgba(255,255,255,0.65)', marginInlineStart: 8 }}>Admin</Typography.Text>
          )}
        </Link>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={section ? [section.key] : []}
          items={SECTIONS.map((s) => ({
            key: s.key,
            icon:
              s.key === 'reports' && collapsed ? (
                <Badge dot={pending > 0} color={STATUS_COLORS.warning}>
                  <span style={{ color: 'inherit' }}>{s.icon}</span>
                </Badge>
              ) : (
                s.icon
              ),
            label:
              s.key === 'reports' ? (
                <Link to={s.path}>
                  <Flex justify="space-between" align="center">
                    {s.label}
                    <Badge count={pending} color={STATUS_COLORS.warning} title={`${pending} báo cáo chờ duyệt`} />
                  </Flex>
                </Link>
              ) : (
                <Link to={s.path}>{s.label}</Link>
              ),
          }))}
        />
      </Layout.Sider>

      <Layout>
        <Layout.Header
          style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #f0f0f0' }}
        >
          <Flex justify="space-between" align="center" style={{ height: '100%' }}>
            <Typography.Text strong style={{ fontSize: 16 }}>
              {section?.label ?? 'IVPDS Admin'}
            </Typography.Text>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'password', icon: <KeyOutlined />, label: 'Đổi mật khẩu' },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === 'password') {
                    setChangingPassword(true);
                  } else {
                    void handleLogout();
                  }
                },
              }}
            >
              <Button type="text" loading={loggingOut} style={{ height: 40 }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ marginInlineEnd: 8 }} />
                {user?.fullName ?? user?.email}
                <DownOutlined style={{ fontSize: 10, marginInlineStart: 6 }} />
              </Button>
            </Dropdown>
          </Flex>
        </Layout.Header>

        <Layout.Content style={{ padding: 24 }}>
          {/* Màn hình tải theo yêu cầu: chỉ vùng nội dung chờ, thanh bên và thanh trên giữ nguyên. */}
          <Suspense fallback={<Spin style={{ display: 'block', margin: '96px auto' }} />}>
            <Outlet />
          </Suspense>
        </Layout.Content>
      </Layout>

      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
    </Layout>
  );
}
