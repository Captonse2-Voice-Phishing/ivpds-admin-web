import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Flex, Progress, Row, Segmented, Skeleton, Space, Statistic, Table, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_STATISTICS_DAYS, useStatistics } from '@/api/queries';
import type { Statistics, SuspectedNumber } from '@/api/types';
import { BlacklistFormModal } from '@/components/BlacklistFormModal';
import { PageHeader } from '@/components/PageHeader';
import { QueryError } from '@/components/QueryError';
import { formatDateTime, formatNumber } from '@/lib/format';
import {
  ANALYSIS_STATUSES,
  ANALYSIS_STATUS_LABELS,
  CALL_SOURCES,
  CALL_SOURCE_LABELS,
  indicatorLabel,
} from '@/lib/labels';
import { oneOf, useUrlState } from '@/lib/useUrlState';
import { PRIMARY_COLOR, RISK_COLORS } from '@/theme/theme';
import { DailyCallsChart, RiskDonutChart } from './charts';

const PERIODS = ['7', '30', '90'] as const;

/** Thẻ số liệu lớn; có `to` thì bấm vào cả thẻ để chuyển trang. */
function StatCard(props: { title: string; value: number; color?: string; note?: ReactNode; to?: string }) {
  const navigate = useNavigate();
  const { to } = props;
  return (
    <Card
      className={to ? 'clickable-card' : undefined}
      role={to ? 'link' : undefined}
      tabIndex={to ? 0 : undefined}
      onClick={to ? () => navigate(to) : undefined}
      onKeyDown={to ? (event) => event.key === 'Enter' && navigate(to) : undefined}
      style={{ height: '100%' }}
    >
      <Statistic
        title={props.title}
        value={props.value}
        valueStyle={{ color: props.color, fontSize: 32, fontWeight: 600 }}
        formatter={(value) => formatNumber(Number(value))}
      />
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {props.note ?? ' '}
      </Typography.Text>
    </Card>
  );
}

/** Danh sách "nhãn — số" trong các thẻ nhỏ ở hàng cuối. */
function CountList({ rows }: { rows: Array<{ label: string; value: number }> }) {
  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      {rows.map((row) => (
        <Flex key={row.label} justify="space-between">
          <Typography.Text>{row.label}</Typography.Text>
          <Typography.Text strong>{formatNumber(row.value)}</Typography.Text>
        </Flex>
      ))}
    </Space>
  );
}

function TopIndicators({ stats }: { stats: Statistics }) {
  const rows = stats.topIndicators;
  if (rows.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dấu hiệu nào được ghi nhận" />;
  }
  const max = Math.max(...rows.map((row) => row.calls), 1);
  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {rows.map((row) => (
        <div key={row.indicator}>
          <Flex justify="space-between">
            <Typography.Text>{indicatorLabel(row.indicator)}</Typography.Text>
            <Typography.Text type="secondary">{formatNumber(row.calls)} cuộc gọi</Typography.Text>
          </Flex>
          {/* Thanh tỉ lệ theo dòng lớn nhất. */}
          <Progress percent={(row.calls / max) * 100} showInfo={false} strokeColor={PRIMARY_COLOR} size="small" />
        </div>
      ))}
    </Space>
  );
}

function SuspectedNumbers({ stats, onBlock }: { stats: Statistics; onBlock: (phoneNumber: string) => void }) {
  return (
    <Table<SuspectedNumber>
      size="small"
      rowKey="phoneNumber"
      dataSource={stats.suspectedNumbers}
      pagination={false}
      scroll={{ x: 'max-content' }}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có số đáng ngờ nào chưa bị chặn" />,
      }}
      columns={[
        {
          title: 'Số điện thoại',
          dataIndex: 'phoneNumber',
          render: (value: string) => <span className="phone-mono">{value}</span>,
        },
        {
          title: 'Cuộc gọi nguy cơ cao',
          dataIndex: 'highRiskCalls',
          align: 'right',
          render: (value: number) => <strong style={{ color: RISK_COLORS.HIGH }}>{formatNumber(value)}</strong>,
        },
        { title: 'Người nhận', dataIndex: 'users', align: 'right', render: (value: number) => formatNumber(value) },
        { title: 'Gần nhất', dataIndex: 'lastCallAt', render: (value: string) => formatDateTime(value) },
        {
          title: '',
          key: 'actions',
          render: (_, row) => (
            <Space>
              <Link to={`/calls?callerNumber=${encodeURIComponent(row.phoneNumber)}&riskLevel=HIGH`}>Xem cuộc gọi</Link>
              <Button size="small" danger onClick={() => onBlock(row.phoneNumber)}>
                Chặn số
              </Button>
            </Space>
          ),
        },
      ]}
    />
  );
}

export function DashboardPage() {
  const url = useUrlState();
  const days = Number(oneOf(url.get('days'), PERIODS) ?? DEFAULT_STATISTICS_DAYS);
  const query = useStatistics(days);
  const [blockNumber, setBlockNumber] = useState<string | null>(null);
  const stats = query.data;

  const header = (
    <PageHeader
      title="Tổng quan"
      crumbs={[{ title: 'Tổng quan' }]}
      extra={
        <>
          <Segmented
            value={String(days)}
            options={PERIODS.map((value) => ({ value, label: `${value} ngày` }))}
            onChange={(value) => url.update({ days: value === String(DEFAULT_STATISTICS_DAYS) ? undefined : value })}
          />
          <Button icon={<ReloadOutlined />} loading={query.isFetching} onClick={() => void query.refetch()}>
            Làm mới
          </Button>
        </>
      }
    />
  );

  if (!stats) {
    return (
      <>
        {header}
        {query.isError ? (
          <Card>
            <QueryError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          </Card>
        ) : (
          <Card>
            <Skeleton active paragraph={{ rows: 12 }} />
          </Card>
        )}
      </>
    );
  }

  return (
    <>
      {header}
      {/* Mờ đi khi đang tải số liệu của kỳ khác. */}
      <Space
        direction="vertical"
        size={16}
        style={{ width: '100%', opacity: query.isPlaceholderData ? 0.55 : 1, transition: 'opacity 0.2s' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Cuộc gọi nguy cơ cao"
              value={stats.callsByRiskLevel.HIGH}
              color={RISK_COLORS.HIGH}
              note="Bấm để xem danh sách"
              to="/calls?riskLevel=HIGH"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Báo cáo chờ duyệt"
              value={stats.blacklistReports.PENDING}
              color={RISK_COLORS.MEDIUM}
              note="Bấm để xử lý"
              to="/reports"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Tổng cuộc gọi"
              value={stats.calls.total}
              note={`+${formatNumber(stats.calls.newInPeriod)} trong kỳ`}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Người dùng"
              value={stats.users.total}
              note={`${formatNumber(stats.users.newInPeriod)} mới trong kỳ · ${formatNumber(stats.users.locked)} bị khóa`}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={`Cuộc gọi theo ngày (${stats.periodDays} ngày)`} style={{ height: '100%' }}>
              <DailyCallsChart daily={stats.daily} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Tỉ lệ mức rủi ro" style={{ height: '100%' }}>
              <RiskDonutChart counts={stats.callsByRiskLevel} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="Dấu hiệu lừa đảo phổ biến" style={{ height: '100%' }}>
              <TopIndicators stats={stats} />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card
              title={
                <div style={{ padding: '10px 0' }}>
                  Số đáng ngờ chưa bị chặn
                  <div>
                    <Typography.Text type="secondary" italic style={{ fontSize: 12, fontWeight: 400, whiteSpace: 'normal' }}>
                      Gợi ý từ kết quả phân tích tự động, cần xem xét trước khi chặn.
                    </Typography.Text>
                  </div>
                </div>
              }
              style={{ height: '100%' }}
            >
              <SuspectedNumbers stats={stats} onBlock={setBlockNumber} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="Nguồn cuộc gọi" size="small" style={{ height: '100%' }}>
              <CountList rows={CALL_SOURCES.map((s) => ({ label: CALL_SOURCE_LABELS[s], value: stats.calls[s] ?? 0 }))} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Trạng thái phân tích" size="small" style={{ height: '100%' }}>
              <CountList
                rows={ANALYSIS_STATUSES.map((s) => ({
                  label: ANALYSIS_STATUS_LABELS[s],
                  value: stats.analysesByStatus[s] ?? 0,
                }))}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Danh sách đen và mẫu lừa đảo" size="small" style={{ height: '100%' }}>
              <CountList
                rows={[
                  { label: 'Số trong danh sách đen', value: stats.blacklist.total },
                  { label: 'Số đang chặn', value: stats.blacklist.active },
                  { label: 'Mẫu lừa đảo', value: stats.phishingPatterns.total },
                  { label: 'Mẫu đang bật', value: stats.phishingPatterns.active },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Số liệu lúc {formatDateTime(stats.generatedAt)}, múi giờ {stats.timeZone}
        </Typography.Text>
      </Space>

      <BlacklistFormModal
        open={blockNumber !== null}
        onClose={() => setBlockNumber(null)}
        initialPhoneNumber={blockNumber ?? undefined}
      />
    </>
  );
}
