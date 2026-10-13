import { SyncOutlined } from '@ant-design/icons';
import { Tag, Tooltip } from 'antd';
import type { CSSProperties } from 'react';
import type { AnalysisStatus, AnalysisSummary, CallSource, ReportStatus, RiskLevel, UserStatus } from '@/api/types';
import {
  ANALYSIS_STATUS_COLORS,
  ANALYSIS_STATUS_LABELS,
  CALL_SOURCE_LABELS,
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  ROLE_LABELS,
  USER_STATUS_COLORS,
  USER_STATUS_LABELS,
  indicatorHint,
  indicatorLabel,
  riskColor,
  riskLabel,
} from '@/lib/labels';
import { PRIMARY_COLOR } from '@/theme/theme';

const LARGE: CSSProperties = { fontSize: 16, padding: '4px 12px', lineHeight: '24px' };

/** Nhãn mức rủi ro; luôn có chữ, không chỉ dựa vào màu. */
export function RiskTag({ level, large }: { level: RiskLevel | null | undefined; large?: boolean }) {
  return (
    <Tag color={riskColor(level)} style={large ? LARGE : undefined}>
      {riskLabel(level)}
    </Tag>
  );
}

export function AnalysisStatusTag({ status, large }: { status: AnalysisStatus; large?: boolean }) {
  return (
    <Tag
      color={ANALYSIS_STATUS_COLORS[status]}
      icon={status === 'PROCESSING' ? <SyncOutlined spin /> : undefined}
      style={large ? LARGE : undefined}
    >
      {ANALYSIS_STATUS_LABELS[status]}
    </Tag>
  );
}

/** Mức rủi ro của một cuộc gọi: chưa xong hoặc lỗi thì hiện trạng thái phân tích thay cho mức. */
export function CallRiskTag({ analysis, large }: { analysis: AnalysisSummary | null; large?: boolean }) {
  if (!analysis) {
    return <RiskTag level={null} large={large} />;
  }
  if (analysis.status !== 'COMPLETED') {
    return <AnalysisStatusTag status={analysis.status} large={large} />;
  }
  return <RiskTag level={analysis.riskLevel} large={large} />;
}

export function UserStatusTag({ status }: { status: UserStatus }) {
  return <Tag color={USER_STATUS_COLORS[status]}>{USER_STATUS_LABELS[status]}</Tag>;
}

export function ReportStatusTag({ status }: { status: ReportStatus }) {
  return <Tag color={REPORT_STATUS_COLORS[status]}>{REPORT_STATUS_LABELS[status]}</Tag>;
}

export function SourceTag({ source }: { source: CallSource }) {
  return <Tag>{CALL_SOURCE_LABELS[source] ?? source}</Tag>;
}

export function RoleTag({ role }: { role: string }) {
  return <Tag color={role === 'ADMIN' ? PRIMARY_COLOR : undefined}>{ROLE_LABELS[role] ?? role}</Tag>;
}

/** Nhãn một dấu hiệu lừa đảo, có Tooltip giải thích; mã lạ thì hiện nguyên mã. */
export function IndicatorTag({ code }: { code: string }) {
  const tag = <Tag style={{ marginInlineEnd: 0 }}>{indicatorLabel(code)}</Tag>;
  const hint = indicatorHint(code);
  return hint ? <Tooltip title={hint}>{tag}</Tooltip> : tag;
}

/** Danh sách dấu hiệu; có `max` thì phần còn lại gộp thành "+N" kèm Tooltip. */
export function IndicatorTags({ codes, max }: { codes: string[] | null | undefined; max?: number }) {
  if (!codes || codes.length === 0) {
    return null;
  }
  const shown = max === undefined ? codes : codes.slice(0, max);
  const rest = max === undefined ? [] : codes.slice(max);
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
      {shown.map((code) => (
        <IndicatorTag key={code} code={code} />
      ))}
      {rest.length > 0 && (
        <Tooltip title={rest.map(indicatorLabel).join(', ')}>
          <Tag style={{ marginInlineEnd: 0 }}>+{rest.length}</Tag>
        </Tooltip>
      )}
    </span>
  );
}
