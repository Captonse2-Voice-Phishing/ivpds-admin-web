import { PlusOutlined } from '@ant-design/icons';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Flex, Popconfirm, Select, Space, Switch, Typography, type TableColumnsType } from 'antd';
import { useMemo, useState } from 'react';
import { blacklistApi, queryKeys } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import { toApiPage } from '@/api/pagination';
import type { BlacklistEntry, BlacklistListParams, PageResponse } from '@/api/types';
import { BlacklistFormModal } from '@/components/BlacklistFormModal';
import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { SearchBox } from '@/components/SearchBox';
import { formatDateTime } from '@/lib/format';
import { oneOf, useUrlState } from '@/lib/useUrlState';

const ACTIVE_VALUES = ['true', 'false'] as const;

type FormState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; entry: BlacklistEntry };

export function BlacklistPage() {
  const url = useUrlState();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const search = url.get('query');
  const active = oneOf(url.get('active'), ACTIVE_VALUES);
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' });

  const params: BlacklistListParams = {
    query: search,
    active: active === undefined ? undefined : active === 'true',
    page: toApiPage(url.page),
    size: url.size,
  };
  const query = useQuery<PageResponse<BlacklistEntry>, ApiError>({
    queryKey: [...queryKeys.blacklist, 'list', params],
    queryFn: () => blacklistApi.list(params),
    placeholderData: keepPreviousData,
  });

  // Danh sách đen đổi thì thống kê, nhãn ở cuộc gọi và ở báo cáo cũng đổi.
  const refresh = () => {
    for (const key of [queryKeys.blacklist, queryKeys.statistics, queryKeys.calls, queryKeys.reports]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };
  const onError = (error: ApiError) => {
    message.error(error.message);
    if (error.isNotFound) {
      refresh();
    }
  };

  const toggle = useMutation<BlacklistEntry, ApiError, { id: string; active: boolean }>({
    mutationFn: ({ id, active: next }) => blacklistApi.update(id, { active: next }),
    onSuccess: (saved) => {
      message.success(saved.active ? `Đã bật chặn ${saved.phoneNumber}` : `Đã tắt chặn ${saved.phoneNumber}`);
      refresh();
    },
    onError,
  });

  const remove = useMutation<void, ApiError, string>({
    mutationFn: (id) => blacklistApi.remove(id),
    onSuccess: () => {
      message.success('Đã xóa số khỏi danh sách đen');
      refresh();
    },
    onError,
  });

  const columns = useMemo<TableColumnsType<BlacklistEntry>>(
    () => [
      {
        title: 'Số điện thoại',
        key: 'phoneNumber',
        render: (_, entry) => <span className="phone-mono">{entry.phoneNumber}</span>,
      },
      {
        title: 'Lý do',
        key: 'reason',
        width: 360,
        render: (_, entry) =>
          entry.reason ? (
            <Typography.Paragraph ellipsis={{ rows: 2, tooltip: entry.reason }} style={{ margin: 0, maxWidth: 360 }}>
              {entry.reason}
            </Typography.Paragraph>
          ) : (
            <Typography.Text type="secondary">Không ghi lý do</Typography.Text>
          ),
      },
      {
        title: 'Trạng thái',
        key: 'active',
        render: (_, entry) => {
          const loading = toggle.isPending && toggle.variables?.id === entry.id;
          return (
            // Tắt chặn cần xác nhận; bật lại thì không.
            <Popconfirm
              title="Tắt chặn số này?"
              description="Người dùng sẽ không còn được cảnh báo về số này."
              okText="Tắt chặn"
              cancelText="Hủy"
              disabled={!entry.active}
              onConfirm={() => toggle.mutateAsync({ id: entry.id, active: false }).catch(() => undefined)}
            >
              <Switch
                checked={entry.active}
                loading={loading}
                checkedChildren="Đang chặn"
                unCheckedChildren="Đã tắt"
                onChange={(checked) => {
                  if (checked) {
                    toggle.mutate({ id: entry.id, active: true });
                  }
                }}
              />
            </Popconfirm>
          );
        },
      },
      { title: 'Ngày thêm', key: 'createdAt', render: (_, entry) => formatDateTime(entry.createdAt) },
      { title: 'Cập nhật lần cuối', key: 'updatedAt', render: (_, entry) => formatDateTime(entry.updatedAt) },
      {
        title: '',
        key: 'actions',
        fixed: 'right',
        render: (_, entry) => (
          <Space>
            <Button size="small" onClick={() => setFormState({ mode: 'edit', entry })}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa hẳn số này khỏi danh sách?"
              description="Muốn tạm ngừng chặn, hãy tắt thay vì xóa."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => remove.mutateAsync(entry.id).catch(() => undefined)}
            >
              <Button size="small" danger loading={remove.isPending && remove.variables === entry.id}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [toggle, remove],
  );

  return (
    <>
      <PageHeader title="Danh sách đen" crumbs={[{ title: 'Danh sách đen' }]} />
      <Card>
        <Flex vertical gap={16}>
          <Flex justify="space-between" gap={12} wrap>
            <Flex gap={12} wrap>
              <SearchBox value={search} placeholder="Tìm theo số điện thoại" onSearch={(value) => url.update({ query: value })} />
              <Select
                style={{ width: 160 }}
                value={active ?? 'all'}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'true', label: 'Đang chặn' },
                  { value: 'false', label: 'Đã tắt' },
                ]}
                onChange={(value) => url.update({ active: value === 'all' ? undefined : value })}
              />
            </Flex>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormState({ mode: 'add' })}>
              Thêm số
            </Button>
          </Flex>
          <DataTable<BlacklistEntry>
            rowKey="id"
            columns={columns}
            query={query}
            page={url.page}
            size={url.size}
            onPageChange={url.setPage}
            emptyText={search || active ? 'Không có số nào khớp bộ lọc' : 'Danh sách đen đang trống'}
          />
        </Flex>
      </Card>

      <BlacklistFormModal
        open={formState.mode !== 'closed'}
        entry={formState.mode === 'edit' ? formState.entry : null}
        onClose={() => setFormState({ mode: 'closed' })}
      />
    </>
  );
}
