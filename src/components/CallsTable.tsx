import type { UseQueryResult } from '@tanstack/react-query';
import { Space, Tag, Typography, type TableColumnsType } from 'antd';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ApiError } from '@/api/errors';
import type { AdminCall, PageResponse } from '@/api/types';
import { formatDateTime, formatDuration } from '@/lib/format';
import { riskColor } from '@/lib/labels';
import { RISK_COLORS } from '@/theme/theme';
import { DataTable } from './DataTable';
import { CallRiskTag, IndicatorTags, SourceTag } from './StatusTags';

interface Props {
  query: UseQueryResult<PageResponse<AdminCall>, ApiError>;
  page: number;
  size: number;
  onPageChange: (page: number, size: number) => void;
  /** Ẩn cột Người dùng khi bảng nằm trong trang của chính người đó. */
  showOwner?: boolean;
  emptyText?: string;
}

/** Số người gọi, kèm nhãn nếu đang nằm trong danh sách đen. */
export function CallerNumber({ call }: { call: Pick<AdminCall, 'callerNumber' | 'callerBlacklisted'> }) {
  if (!call.callerNumber) {
    return <Typography.Text type="secondary">Không rõ</Typography.Text>;
  }
  return (
    <Space size={8} wrap>
      <span className="phone-mono">{call.callerNumber}</span>
      {call.callerBlacklisted && <Tag color={RISK_COLORS.HIGH}>Trong danh sách đen</Tag>}
    </Space>
  );
}

/** Bảng cuộc gọi dùng lại ở trang Cuộc gọi và trang chi tiết người dùng. */
export function CallsTable({ query, page, size, onPageChange, showOwner = true, emptyText }: Props) {
  const columns = useMemo<TableColumnsType<AdminCall>>(() => {
    const all: TableColumnsType<AdminCall> = [
      { title: 'Thời điểm', key: 'createdAt', width: 150, render: (_, call) => formatDateTime(call.createdAt) },
      {
        title: 'Người dùng',
        key: 'owner',
        render: (_, call) =>
          call.owner ? (
            <div>
              <Link to={`/users/${call.owner.id}`}>{call.owner.fullName}</Link>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {call.owner.email}
                </Typography.Text>
              </div>
            </div>
          ) : (
            '—'
          ),
      },
      { title: 'Số người gọi', key: 'callerNumber', render: (_, call) => <CallerNumber call={call} /> },
      { title: 'Nguồn', key: 'source', render: (_, call) => <SourceTag source={call.source} /> },
      { title: 'Thời lượng', key: 'duration', render: (_, call) => formatDuration(call.durationSeconds) },
      { title: 'Mức rủi ro', key: 'risk', render: (_, call) => <CallRiskTag analysis={call.analysis} /> },
      {
        title: 'Điểm',
        key: 'score',
        align: 'right',
        render: (_, call) => {
          const score = call.analysis?.riskScore;
          if (score === null || score === undefined) {
            return <Typography.Text type="secondary">—</Typography.Text>;
          }
          return (
            <span>
              <strong style={{ color: riskColor(call.analysis?.riskLevel) }}>{score}</strong>
              <Typography.Text type="secondary">/100</Typography.Text>
            </span>
          );
        },
      },
      {
        title: 'Dấu hiệu',
        key: 'indicators',
        render: (_, call) => <IndicatorTags codes={call.analysis?.indicators} max={2} />,
      },
      {
        title: '',
        key: 'actions',
        fixed: 'right',
        render: (_, call) => <Link to={`/calls/${call.callId}`}>Chi tiết</Link>,
      },
    ];
    return showOwner ? all : all.filter((column) => column.key !== 'owner');
  }, [showOwner]);

  return (
    <DataTable<AdminCall>
      rowKey="callId"
      columns={columns}
      query={query}
      page={page}
      size={size}
      onPageChange={onPageChange}
      emptyText={emptyText ?? 'Không có cuộc gọi nào phù hợp'}
      // Dòng mức HIGH có vạch đỏ ở mép trái để nhìn lướt là thấy.
      rowClassName={(call) => (call.analysis?.riskLevel === 'HIGH' ? 'row-high-risk' : '')}
    />
  );
}
