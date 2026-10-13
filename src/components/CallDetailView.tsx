import { CopyOutlined, StopOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Card, Collapse, Descriptions, Empty, Flex, Progress, Result, Skeleton, Space, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { callsApi, queryKeys } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import type { AdminCall, AnalysisSummary } from '@/api/types';
import { formatDateTime, formatDuration, formatPercent } from '@/lib/format';
import { analysisErrorText, riskColor, riskLabel } from '@/lib/labels';
import { BlacklistFormModal } from './BlacklistFormModal';
import { CallerNumber } from './CallsTable';
import { QueryError } from './QueryError';
import { AnalysisStatusTag, CallRiskTag, IndicatorTags, SourceTag } from './StatusTags';

function useCallDetail(callId: string | undefined) {
  return useQuery<AdminCall, ApiError>({
    queryKey: [...queryKeys.calls, 'detail', callId],
    queryFn: () => callsApi.get(callId ?? ''),
    enabled: Boolean(callId),
    // Đang phân tích thì tự tải lại để thấy kết quả khi xong.
    refetchInterval: (query) => {
      const status = query.state.data?.analysis?.status;
      return status === 'PENDING' || status === 'PROCESSING' ? 5000 : false;
    },
  });
}

/** Thẻ kết luận: điểm, mức rủi ro, độ chắc chắn và dấu hiệu; hoặc trạng thái lỗi / chưa phân tích. */
function ConclusionCard({ analysis }: { analysis: AnalysisSummary | null }) {
  if (!analysis) {
    return (
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Cuộc gọi chưa được phân tích" />
      </Card>
    );
  }
  if (analysis.status === 'FAILED') {
    // Phân tích lỗi: không hiện điểm hay mức rủi ro.
    return (
      <Card>
        <Result
          status="error"
          title="Phân tích không thành công"
          subTitle={analysisErrorText(analysis.errorCode)}
          extra={
            analysis.errorCode && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Mã lỗi: {analysis.errorCode}
              </Typography.Text>
            )
          }
        />
      </Card>
    );
  }
  if (analysis.status !== 'COMPLETED') {
    return (
      <Card>
        <Flex vertical align="center" gap={12} style={{ padding: 24 }}>
          <AnalysisStatusTag status={analysis.status} large />
          <Typography.Text type="secondary">Kết quả sẽ hiện ở đây khi phân tích xong.</Typography.Text>
        </Flex>
      </Card>
    );
  }
  const color = riskColor(analysis.riskLevel);
  return (
    <Card style={{ borderColor: color, borderWidth: 2 }}>
      <Flex gap={32} align="center" wrap>
        <Progress
          type="dashboard"
          percent={analysis.riskScore ?? 0}
          strokeColor={color}
          size={150}
          format={() => (
            <span style={{ color }}>
              <strong style={{ fontSize: 34 }}>{analysis.riskScore ?? '—'}</strong>
              <span style={{ fontSize: 16 }}>/100</span>
            </span>
          )}
        />
        <Flex vertical gap={10} style={{ flex: 1, minWidth: 260 }}>
          <Typography.Title level={2} style={{ margin: 0, color }}>
            {riskLabel(analysis.riskLevel)}
          </Typography.Title>
          <Typography.Text>
            Độ chắc chắn của kết luận: <strong>{formatPercent(analysis.confidence)}</strong>
          </Typography.Text>
          {analysis.indicators && analysis.indicators.length > 0 ? (
            <IndicatorTags codes={analysis.indicators} />
          ) : (
            <Typography.Text type="secondary">Không phát hiện dấu hiệu lừa đảo nào.</Typography.Text>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

function TranscriptCard({ transcript }: { transcript: string | null | undefined }) {
  const { message } = App.useApp();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcript ?? '');
      message.success('Đã sao chép transcript');
    } catch {
      message.error('Trình duyệt không cho phép sao chép');
    }
  };

  return (
    <Card
      title="Transcript"
      extra={
        transcript && (
          <Button icon={<CopyOutlined />} onClick={() => void copy()}>
            Sao chép
          </Button>
        )
      }
    >
      {transcript ? (
        <div className="transcript-box">{transcript}</div>
      ) : (
        <Typography.Text type="secondary">Không có transcript</Typography.Text>
      )}
    </Card>
  );
}

function TechnicalCard({ analysis }: { analysis: AnalysisSummary }) {
  const details = analysis.details;
  const text = (value: string | null | undefined) => value || '—';
  return (
    <Collapse
      items={[
        {
          key: 'tech',
          label: 'Chi tiết kỹ thuật',
          children: (
            <>
              <Descriptions
                column={1}
                size="small"
                items={[
                  {
                    key: 'prob',
                    label: 'Xác suất lừa đảo của NLP Model',
                    children: formatPercent(details?.modelProbability, 2),
                  },
                  { key: 'stt', label: 'Model nhận dạng giọng nói', children: text(details?.sttModel) },
                  { key: 'nlp', label: 'Phiên bản NLP Model', children: text(details?.nlpModelVersion) },
                  { key: 'rules', label: 'Rule Engine', children: text(details?.rulesetVersion) },
                  { key: 'risk', label: 'Risk Engine', children: text(details?.riskEngineVersion) },
                ]}
              />
              <Typography.Paragraph type="secondary" italic style={{ margin: '12px 0 0' }}>
                Xác suất của model là một thành phần của điểm rủi ro, không phải điểm rủi ro.
              </Typography.Paragraph>
            </>
          ),
        },
      ]}
    />
  );
}

interface Props {
  callId: string;
  /** Vùng đầu trang do nơi dùng quyết định (trang riêng có Breadcrumb, Drawer thì không). */
  renderHeader?: (call: AdminCall, actions: ReactNode) => ReactNode;
  /** Đầu trang khi chưa có dữ liệu (đang tải hoặc lỗi). */
  fallbackHeader?: ReactNode;
}

/**
 * Nội dung chi tiết một cuộc gọi; dùng ở trang /calls/:callId và trong Drawer của trang Báo cáo.
 * Không có trình phát hay nút tải ghi âm: quản trị viên không được nghe ghi âm của người dùng.
 */
export function CallDetailView({ callId, renderHeader, fallbackHeader }: Props) {
  const query = useCallDetail(callId);
  const [blocking, setBlocking] = useState(false);

  if (query.isPending || query.isError) {
    return (
      <>
        {fallbackHeader}
        <Card>
          {query.isPending ? (
            <Skeleton active paragraph={{ rows: 12 }} />
          ) : (
            <QueryError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          )}
        </Card>
      </>
    );
  }
  const call = query.data;
  const analysis = call.analysis;
  // Ẩn nút chặn khi không có số hoặc số đã bị chặn.
  const canBlock = Boolean(call.callerNumber) && !call.callerBlacklisted;

  const actions = canBlock ? (
    <Button danger icon={<StopOutlined />} onClick={() => setBlocking(true)}>
      Chặn số này
    </Button>
  ) : null;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader ? (
        renderHeader(call, actions)
      ) : (
        <Flex justify="space-between" align="center" gap={12} wrap>
          <Space size={12} wrap>
            <CallerNumber call={call} />
            <CallRiskTag analysis={analysis} large />
          </Space>
          {actions}
        </Flex>
      )}

      <ConclusionCard analysis={analysis} />

      <Card title="Thông tin cuộc gọi">
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
          items={[
            {
              key: 'owner',
              label: 'Người dùng',
              children: call.owner ? (
                <Link to={`/users/${call.owner.id}`}>
                  {call.owner.fullName} ({call.owner.email})
                </Link>
              ) : (
                '—'
              ),
            },
            { key: 'caller', label: 'Số người gọi', children: <CallerNumber call={call} /> },
            { key: 'source', label: 'Nguồn', children: <SourceTag source={call.source} /> },
            { key: 'createdAt', label: 'Thời điểm gửi', children: formatDateTime(call.createdAt) },
            { key: 'calledAt', label: 'Thời điểm cuộc gọi', children: formatDateTime(call.calledAt) },
            { key: 'duration', label: 'Thời lượng', children: formatDuration(call.durationSeconds) },
            { key: 'completedAt', label: 'Phân tích xong lúc', children: formatDateTime(analysis?.completedAt) },
          ]}
        />
      </Card>

      <TranscriptCard transcript={analysis?.transcript} />

      {analysis && analysis.status === 'COMPLETED' && <TechnicalCard analysis={analysis} />}

      <BlacklistFormModal
        open={blocking}
        onClose={() => setBlocking(false)}
        initialPhoneNumber={call.callerNumber ?? undefined}
      />
    </Space>
  );
}
