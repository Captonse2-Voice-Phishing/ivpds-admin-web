import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Badge, Button, Card, Drawer, Flex, Form, Input, Modal, Popconfirm, Space, Tabs, Tag, Tooltip, Typography, type TableColumnsType } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { queryKeys, reportsApi } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import { toApiPage } from '@/api/pagination';
import { useStatistics } from '@/api/queries';
import type { BlacklistReport, PageResponse, ReportListParams, ReportStatus } from '@/api/types';
import { CallDetailView } from '@/components/CallDetailView';
import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { SearchBox } from '@/components/SearchBox';
import { ReportStatusTag } from '@/components/StatusTags';
import { formatDateTime } from '@/lib/format';
import { REPORT_STATUS_LABELS } from '@/lib/labels';
import { oneOf, useUrlState } from '@/lib/useUrlState';
import { RISK_COLORS, STATUS_COLORS } from '@/theme/theme';

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;
type TabKey = (typeof TABS)[number];

const EMPTY_TEXT: Record<TabKey, string> = {
  PENDING: 'Không còn báo cáo nào chờ duyệt',
  APPROVED: 'Chưa có báo cáo nào được duyệt',
  REJECTED: 'Chưa có báo cáo nào bị từ chối',
  ALL: 'Chưa có báo cáo nào',
};

/** Modal duyệt một báo cáo: chặn số, có thể ghi lý do riêng cho người dùng khi tra cứu. */
function ApproveModal({ report, onClose, onDone }: { report: BlacklistReport | null; onClose: () => void; onDone: () => void }) {
  const [form] = Form.useForm<{ reason?: string }>();
  const { message } = App.useApp();

  useEffect(() => {
    if (report) {
      form.resetFields();
    }
  }, [report, form]);

  const mutation = useMutation<BlacklistReport, ApiError, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => reportsApi.approve(id, reason),
    onSuccess: (saved) => {
      message.success(`Đã chặn số ${saved.phoneNumber}`);
      onDone();
      onClose();
    },
    onError: (error) => {
      message.error(error.message);
      // Báo cáo đã được người khác xử lý hoặc danh sách vừa đổi: tải lại và đóng.
      if (error.status === 409 || error.isNotFound) {
        onDone();
        onClose();
      }
    },
  });

  return (
    <Modal
      title={report ? `Chặn số ${report.phoneNumber}?` : ''}
      open={report !== null}
      okText="Duyệt và chặn số"
      cancelText="Hủy"
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      maskClosable={false}
      forceRender
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary">Lý do của người báo cáo</Typography.Text>
          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {report?.reason || <Typography.Text type="secondary">Không ghi lý do</Typography.Text>}
          </Typography.Paragraph>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => report && mutation.mutate({ id: report.id, reason: values.reason?.trim() || undefined })}
        >
          <Form.Item
            name="reason"
            label="Lý do hiển thị cho người dùng khi tra cứu"
            rules={[{ max: 1000, message: 'Lý do tối đa 1000 ký tự' }]}
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea rows={3} maxLength={1000} showCount placeholder="Bỏ trống để dùng lý do của báo cáo" />
          </Form.Item>
        </Form>
        <Alert
          type="info"
          showIcon
          message="Số sẽ được đưa vào danh sách đen. Mọi báo cáo đang chờ về số này cũng được duyệt."
        />
      </Space>
    </Modal>
  );
}

export function ReportsPage() {
  const url = useUrlState();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const tab: TabKey = oneOf(url.get('status'), TABS) ?? 'PENDING';
  const search = url.get('query');
  const [approving, setApproving] = useState<BlacklistReport | null>(null);
  const [drawerCallId, setDrawerCallId] = useState<string | null>(null);

  const params: ReportListParams = {
    status: tab === 'ALL' ? undefined : (tab satisfies ReportStatus),
    query: search,
    page: toApiPage(url.page),
    size: url.size,
  };
  const query = useQuery<PageResponse<BlacklistReport>, ApiError>({
    queryKey: [...queryKeys.reports, 'list', params],
    queryFn: () => reportsApi.list(params),
    placeholderData: keepPreviousData,
  });
  const pendingCount = useStatistics().data?.blacklistReports.PENDING;

  // Xử lý báo cáo làm thay đổi báo cáo, danh sách đen, thống kê (huy hiệu ở thanh bên) và nhãn ở cuộc gọi.
  const refreshAfterReview = () => {
    for (const key of [queryKeys.reports, queryKeys.blacklist, queryKeys.statistics, queryKeys.calls]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const reject = useMutation<BlacklistReport, ApiError, string>({
    mutationFn: (id) => reportsApi.reject(id),
    onSuccess: () => {
      message.success('Đã từ chối báo cáo');
      refreshAfterReview();
    },
    onError: (error) => {
      message.error(error.message);
      if (error.status === 409 || error.isNotFound) {
        refreshAfterReview();
      }
    },
  });

  const columns = useMemo<TableColumnsType<BlacklistReport>>(
    () => [
      {
        title: 'Số bị báo cáo',
        key: 'phoneNumber',
        render: (_, report) => (
          <Space size={8} wrap>
            <span className="phone-mono">{report.phoneNumber}</span>
            {report.blacklisted && <Tag color={RISK_COLORS.HIGH}>Đã chặn</Tag>}
          </Space>
        ),
      },
      {
        title: 'Số người báo cáo',
        key: 'reportsForNumber',
        render: (_, report) =>
          // Từ 2 người trở lên: làm nổi bật.
          report.reportsForNumber >= 2 ? (
            <Space size={6}>
              <Badge count={report.reportsForNumber} color={RISK_COLORS.HIGH} overflowCount={999} />
              <Typography.Text strong>người</Typography.Text>
            </Space>
          ) : (
            `${report.reportsForNumber} người`
          ),
      },
      {
        title: 'Lý do',
        key: 'reason',
        width: 320,
        render: (_, report) =>
          report.reason ? (
            <Tooltip title={report.reason} placement="topLeft">
              <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 320 }}>
                {report.reason}
              </Typography.Paragraph>
            </Tooltip>
          ) : (
            <Typography.Text type="secondary">Không ghi lý do</Typography.Text>
          ),
      },
      {
        title: 'Cuộc gọi liên quan',
        key: 'call',
        render: (_, report) =>
          report.callId ? (
            <Button type="link" style={{ padding: 0 }} onClick={() => setDrawerCallId(report.callId)}>
              Xem cuộc gọi
            </Button>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      { title: 'Ngày báo cáo', key: 'createdAt', render: (_, report) => formatDateTime(report.createdAt) },
      { title: 'Trạng thái', key: 'status', render: (_, report) => <ReportStatusTag status={report.status} /> },
      {
        title: '',
        key: 'actions',
        fixed: 'right',
        render: (_, report) =>
          report.status === 'PENDING' && (
            <Space>
              <Button type="primary" size="small" onClick={() => setApproving(report)}>
                Duyệt
              </Button>
              <Popconfirm
                title="Từ chối báo cáo này?"
                description="Các báo cáo khác về số này không bị ảnh hưởng."
                okText="Từ chối"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={() => reject.mutateAsync(report.id).catch(() => undefined)}
              >
                <Button size="small" danger loading={reject.isPending && reject.variables === report.id}>
                  Từ chối
                </Button>
              </Popconfirm>
            </Space>
          ),
      },
    ],
    [reject],
  );

  return (
    <>
      <PageHeader title="Báo cáo số lừa đảo" crumbs={[{ title: 'Báo cáo' }]} />
      <Card>
        <Tabs
          activeKey={tab}
          onChange={(key) => url.update({ status: key === 'PENDING' ? undefined : key })}
          tabBarExtraContent={
            <SearchBox value={search} placeholder="Tìm theo số điện thoại" onSearch={(value) => url.update({ query: value })} />
          }
          items={TABS.map((key) => ({
            key,
            label:
              key === 'PENDING' ? (
                <Flex align="center" gap={8}>
                  {REPORT_STATUS_LABELS.PENDING}
                  <Badge count={pendingCount ?? 0} color={STATUS_COLORS.warning} overflowCount={999} />
                </Flex>
              ) : key === 'ALL' ? (
                'Tất cả'
              ) : (
                REPORT_STATUS_LABELS[key]
              ),
          }))}
        />
        <DataTable<BlacklistReport>
          rowKey="id"
          columns={columns}
          query={query}
          page={url.page}
          size={url.size}
          onPageChange={url.setPage}
          emptyText={search ? 'Không có báo cáo nào khớp số đang tìm' : EMPTY_TEXT[tab]}
        />
      </Card>

      <ApproveModal report={approving} onClose={() => setApproving(null)} onDone={refreshAfterReview} />

      {/* Xem cuộc gọi liên quan mà không rời trang. */}
      <Drawer
        title="Chi tiết cuộc gọi"
        width={720}
        open={drawerCallId !== null}
        onClose={() => setDrawerCallId(null)}
        destroyOnHidden
      >
        {drawerCallId && <CallDetailView key={drawerCallId} callId={drawerCallId} />}
      </Drawer>
    </>
  );
}
