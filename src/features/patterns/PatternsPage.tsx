import { PlusOutlined } from '@ant-design/icons';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Flex, Popconfirm, Select, Space, Switch, Tooltip, type TableColumnsType } from 'antd';
import { useMemo, useState } from 'react';
import { patternsApi, queryKeys } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import { toApiPage } from '@/api/pagination';
import type { PageResponse, PatternListParams, PhishingPattern } from '@/api/types';
import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { SearchBox } from '@/components/SearchBox';
import { IndicatorTag } from '@/components/StatusTags';
import { formatDateTime } from '@/lib/format';
import { PATTERN_INDICATOR_CODES, indicatorLabel } from '@/lib/labels';
import { oneOf, useUrlState } from '@/lib/useUrlState';
import { PatternFormModal } from './PatternFormModal';

const ACTIVE_VALUES = ['true', 'false'] as const;

type FormState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; pattern: PhishingPattern };

export function PatternsPage() {
  const url = useUrlState();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const search = url.get('query');
  const indicatorCode = url.get('indicatorCode');
  const active = oneOf(url.get('active'), ACTIVE_VALUES);
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' });

  const params: PatternListParams = {
    query: search,
    indicatorCode,
    active: active === undefined ? undefined : active === 'true',
    page: toApiPage(url.page),
    size: url.size,
  };
  const query = useQuery<PageResponse<PhishingPattern>, ApiError>({
    queryKey: [...queryKeys.patterns, 'list', params],
    queryFn: () => patternsApi.list(params),
    placeholderData: keepPreviousData,
  });

  // Mẫu đổi thì số "tổng / đang bật" ở Tổng quan cũng đổi.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.patterns });
    void queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
  };
  const onError = (error: ApiError) => {
    message.error(error.message);
    if (error.isNotFound) {
      refresh();
    }
  };

  const toggle = useMutation<PhishingPattern, ApiError, { id: string; active: boolean }>({
    mutationFn: ({ id, active: next }) => patternsApi.update(id, { active: next }),
    onSuccess: (saved) => {
      message.success(saved.active ? 'Đã bật mẫu' : 'Đã tắt mẫu');
      refresh();
    },
    onError,
  });

  const remove = useMutation<void, ApiError, string>({
    mutationFn: (id) => patternsApi.remove(id),
    onSuccess: () => {
      message.success('Đã xóa mẫu');
      refresh();
    },
    onError,
  });

  const columns = useMemo<TableColumnsType<PhishingPattern>>(
    () => [
      {
        title: 'Tên',
        key: 'name',
        render: (_, pattern) =>
          pattern.description ? (
            <Tooltip title={pattern.description} placement="topLeft">
              <strong>{pattern.name}</strong>
            </Tooltip>
          ) : (
            <strong>{pattern.name}</strong>
          ),
      },
      {
        title: 'Cụm từ',
        key: 'pattern',
        render: (_, pattern) => <span className="pattern-phrase">“{pattern.pattern}”</span>,
      },
      {
        title: 'Loại dấu hiệu',
        key: 'indicatorCode',
        render: (_, pattern) => <IndicatorTag code={pattern.indicatorCode} />,
      },
      {
        title: 'Trạng thái',
        key: 'active',
        render: (_, pattern) => (
          <Switch
            checked={pattern.active}
            loading={toggle.isPending && toggle.variables?.id === pattern.id}
            checkedChildren="Đang bật"
            unCheckedChildren="Đã tắt"
            onChange={(checked) => toggle.mutate({ id: pattern.id, active: checked })}
          />
        ),
      },
      { title: 'Ngày tạo', key: 'createdAt', render: (_, pattern) => formatDateTime(pattern.createdAt) },
      {
        title: '',
        key: 'actions',
        fixed: 'right',
        render: (_, pattern) => (
          <Space>
            <Button size="small" onClick={() => setFormState({ mode: 'edit', pattern })}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa mẫu này?"
              description="Muốn tạm ngừng dùng mẫu, hãy tắt thay vì xóa."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => remove.mutateAsync(pattern.id).catch(() => undefined)}
            >
              <Button size="small" danger loading={remove.isPending && remove.variables === pattern.id}>
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
      <PageHeader title="Mẫu lừa đảo" crumbs={[{ title: 'Mẫu lừa đảo' }]} />
      <Alert
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
        message="Mẫu là cụm từ đặc trưng của kẻ lừa đảo. Mẫu đang bật được dùng ngay từ lần phân tích kế tiếp. Mẫu khớp nguyên cụm từ và riêng các mẫu không thể đưa một cuộc gọi lên mức nguy cơ cao."
      />
      <Card>
        <Flex vertical gap={16}>
          <Flex justify="space-between" gap={12} wrap>
            <Flex gap={12} wrap>
              <SearchBox value={search} placeholder="Tìm theo tên, cụm từ" onSearch={(value) => url.update({ query: value })} />
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Loại dấu hiệu"
                style={{ width: 240 }}
                value={indicatorCode}
                options={PATTERN_INDICATOR_CODES.map((code) => ({ value: code, label: indicatorLabel(code) }))}
                onChange={(value: string | undefined) => url.update({ indicatorCode: value })}
              />
              <Select
                style={{ width: 150 }}
                value={active ?? 'all'}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'true', label: 'Đang bật' },
                  { value: 'false', label: 'Đã tắt' },
                ]}
                onChange={(value) => url.update({ active: value === 'all' ? undefined : value })}
              />
            </Flex>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormState({ mode: 'add' })}>
              Thêm mẫu
            </Button>
          </Flex>
          <DataTable<PhishingPattern>
            rowKey="id"
            columns={columns}
            query={query}
            page={url.page}
            size={url.size}
            onPageChange={url.setPage}
            emptyText={search || indicatorCode || active ? 'Không có mẫu nào khớp bộ lọc' : 'Chưa có mẫu lừa đảo nào'}
          />
        </Flex>
      </Card>

      <PatternFormModal
        open={formState.mode !== 'closed'}
        pattern={formState.mode === 'edit' ? formState.pattern : null}
        onClose={() => setFormState({ mode: 'closed' })}
        onSaved={refresh}
      />
    </>
  );
}
