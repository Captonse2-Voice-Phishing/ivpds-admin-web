import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, Skeleton, Space, Tag } from 'antd';
import { useParams } from 'react-router-dom';
import { queryKeys, usersApi } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import type { AdminUser } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { CallsTable } from '@/components/CallsTable';
import { PageHeader } from '@/components/PageHeader';
import { QueryError } from '@/components/QueryError';
import { RoleTag, UserStatusTag } from '@/components/StatusTags';
import { useCallList } from '@/features/calls/useCallList';
import { formatDateTime } from '@/lib/format';
import { useUrlState } from '@/lib/useUrlState';
import { STATUS_COLORS } from '@/theme/theme';
import { useUserStatus } from './useUserStatus';

const CRUMBS = [{ title: 'Người dùng', to: '/users' }, { title: 'Chi tiết' }];

export function UserDetailPage() {
  const { id = '' } = useParams();
  const url = useUrlState();
  const { user: me } = useAuth();
  const { lock, unlock, pendingId } = useUserStatus();

  const query = useQuery<AdminUser, ApiError>({
    queryKey: [...queryKeys.users, 'detail', id],
    queryFn: () => usersApi.get(id),
  });
  const calls = useCallList({ userId: id }, url.page, url.size);

  if (query.isPending || query.isError) {
    return (
      <>
        <PageHeader title="Chi tiết người dùng" crumbs={CRUMBS} backTo="/users" />
        <Card>
          {query.isPending ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <QueryError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          )}
        </Card>
      </>
    );
  }

  const user = query.data;
  const isMe = user.id === me?.id;

  return (
    <>
      <PageHeader
        title={
          <Space size={12} wrap>
            {user.fullName}
            {isMe && <Tag color="blue">Bạn</Tag>}
            <UserStatusTag status={user.status} />
          </Space>
        }
        crumbs={CRUMBS}
        backTo="/users"
        extra={
          // Không tự khóa được chính mình.
          !isMe &&
          (user.status === 'ACTIVE' ? (
            <Button danger loading={pendingId === user.id} onClick={() => lock(user)}>
              Khóa tài khoản
            </Button>
          ) : (
            <Button type="primary" loading={pendingId === user.id} onClick={() => unlock(user)}>
              Mở khóa
            </Button>
          ))
        }
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="Hồ sơ">
          <Descriptions
            column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
            items={[
              { key: 'email', label: 'Email', children: user.email },
              { key: 'fullName', label: 'Họ tên', children: user.fullName },
              { key: 'phone', label: 'Số điện thoại', children: user.phoneNumber ?? '—' },
              {
                key: 'roles',
                label: 'Vai trò',
                children: user.roles.map((role) => <RoleTag key={role} role={role} />),
              },
              { key: 'status', label: 'Trạng thái', children: <UserStatusTag status={user.status} /> },
              {
                key: 'alert',
                label: 'Cảnh báo danh sách đen',
                children: (
                  <Tag color={user.blacklistAlertEnabled ? STATUS_COLORS.success : STATUS_COLORS.neutral}>
                    {user.blacklistAlertEnabled ? 'Đang bật' : 'Đã tắt'}
                  </Tag>
                ),
              },
              { key: 'createdAt', label: 'Ngày tạo', children: formatDateTime(user.createdAt) },
            ]}
          />
        </Card>
        <Card title="Cuộc gọi của người dùng này">
          <CallsTable
            query={calls}
            page={url.page}
            size={url.size}
            onPageChange={url.setPage}
            showOwner={false}
            emptyText="Người dùng này chưa có cuộc gọi nào"
          />
        </Card>
      </Space>
    </>
  );
}
