import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Avatar, Button, Card, Flex, Segmented, Space, Tag, Typography, type TableColumnsType } from 'antd';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { queryKeys, usersApi } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import { toApiPage } from '@/api/pagination';
import type { AdminUser, PageResponse, UserListParams, UserStatus } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { SearchBox } from '@/components/SearchBox';
import { RoleTag, UserStatusTag } from '@/components/StatusTags';
import { formatDateTime } from '@/lib/format';
import { USER_STATUS_LABELS } from '@/lib/labels';
import { oneOf, useUrlState } from '@/lib/useUrlState';
import { PRIMARY_COLOR } from '@/theme/theme';
import { useUserStatus } from './useUserStatus';

const STATUSES: UserStatus[] = ['ACTIVE', 'LOCKED'];

export function UsersPage() {
  const url = useUrlState();
  const { user: me } = useAuth();
  const search = url.get('query');
  const status = oneOf<UserStatus>(url.get('status'), STATUSES);
  const { lock, unlock, pendingId } = useUserStatus();

  const params: UserListParams = { query: search, status, page: toApiPage(url.page), size: url.size };
  const query = useQuery<PageResponse<AdminUser>, ApiError>({
    queryKey: [...queryKeys.users, 'list', params],
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<TableColumnsType<AdminUser>>(
    () => [
      {
        title: 'Người dùng',
        key: 'user',
        render: (_, user) => (
          <Flex align="center" gap={12}>
            <Avatar style={{ background: PRIMARY_COLOR, flexShrink: 0 }}>
              {(user.fullName || user.email).trim().charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Space size={8}>
                <Link to={`/users/${user.id}`}>{user.fullName}</Link>
                {user.id === me?.id && <Tag color="blue">Bạn</Tag>}
              </Space>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {user.email}
                </Typography.Text>
              </div>
            </div>
          </Flex>
        ),
      },
      {
        title: 'Số điện thoại',
        key: 'phoneNumber',
        render: (_, user) => user.phoneNumber ?? <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: 'Vai trò',
        key: 'roles',
        render: (_, user) => user.roles.map((role) => <RoleTag key={role} role={role} />),
      },
      { title: 'Trạng thái', key: 'status', render: (_, user) => <UserStatusTag status={user.status} /> },
      { title: 'Ngày tạo', key: 'createdAt', render: (_, user) => formatDateTime(user.createdAt) },
      {
        title: '',
        key: 'actions',
        fixed: 'right',
        render: (_, user) => (
          <Space>
            <Link to={`/users/${user.id}`}>Chi tiết</Link>
            {/* Không tự khóa được chính mình. */}
            {user.id !== me?.id &&
              (user.status === 'ACTIVE' ? (
                <Button size="small" danger loading={pendingId === user.id} onClick={() => lock(user)}>
                  Khóa
                </Button>
              ) : (
                <Button size="small" loading={pendingId === user.id} onClick={() => unlock(user)}>
                  Mở khóa
                </Button>
              ))}
          </Space>
        ),
      },
    ],
    [me?.id, pendingId, lock, unlock],
  );

  return (
    <>
      <PageHeader title="Người dùng" crumbs={[{ title: 'Người dùng' }]} />
      <Card>
        <Flex vertical gap={16}>
          <Flex gap={12} wrap>
            <SearchBox value={search} placeholder="Tìm theo email, họ tên" onSearch={(value) => url.update({ query: value })} />
            <Segmented
              value={status ?? 'ALL'}
              options={[
                { value: 'ALL', label: 'Tất cả' },
                ...STATUSES.map((s) => ({ value: s, label: USER_STATUS_LABELS[s] })),
              ]}
              onChange={(value) => url.update({ status: value === 'ALL' ? undefined : value })}
            />
          </Flex>
          <DataTable<AdminUser>
            rowKey="id"
            columns={columns}
            query={query}
            page={url.page}
            size={url.size}
            onPageChange={url.setPage}
            emptyText={search || status ? 'Không có người dùng nào khớp bộ lọc' : 'Chưa có người dùng nào'}
          />
        </Flex>
      </Card>
    </>
  );
}
