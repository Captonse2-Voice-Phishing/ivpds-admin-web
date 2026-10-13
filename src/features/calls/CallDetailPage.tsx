import { Space, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import { CallDetailView } from '@/components/CallDetailView';
import { PageHeader } from '@/components/PageHeader';
import { CallRiskTag } from '@/components/StatusTags';

const CRUMBS = [{ title: 'Cuộc gọi', to: '/calls' }, { title: 'Chi tiết' }];

export function CallDetailPage() {
  const { callId = '' } = useParams();
  return (
    <CallDetailView
      // Đổi cuộc gọi thì dựng lại, không giữ trạng thái của cuộc gọi trước.
      key={callId}
      callId={callId}
      fallbackHeader={<PageHeader title="Chi tiết cuộc gọi" crumbs={CRUMBS} backTo="/calls" />}
      renderHeader={(call, actions) => (
        <PageHeader
          crumbs={CRUMBS}
          backTo="/calls"
          title={
            <Space size={12} wrap>
              {call.callerNumber ? (
                <span className="phone-mono">{call.callerNumber}</span>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 20 }}>
                  Không rõ số người gọi
                </Typography.Text>
              )}
              <CallRiskTag analysis={call.analysis} large />
            </Space>
          }
          extra={actions}
        />
      )}
    />
  );
}
