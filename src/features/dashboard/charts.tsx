import { Column, Pie } from '@ant-design/plots';
import { Empty } from 'antd';
import { useMemo } from 'react';
import type { DailyCount, RiskLevel } from '@/api/types';
import { formatDayMonth } from '@/lib/format';
import { NO_RESULT_LABEL, RISK_LABELS, RISK_LEVELS } from '@/lib/labels';
import { RISK_COLORS } from '@/theme/theme';

// Bốn lớp của biểu đồ cột chồng, theo thứ tự từ dưới lên; màu dùng đúng màu mức rủi ro.
const LAYERS: Array<{ field: 'high' | 'medium' | 'low' | 'unanalysed'; label: string; color: string }> = [
  { field: 'high', label: RISK_LABELS.HIGH, color: RISK_COLORS.HIGH },
  { field: 'medium', label: RISK_LABELS.MEDIUM, color: RISK_COLORS.MEDIUM },
  { field: 'low', label: RISK_LABELS.LOW, color: RISK_COLORS.LOW },
  { field: 'unanalysed', label: NO_RESULT_LABEL, color: RISK_COLORS.NONE },
];

interface TooltipItem {
  name?: string;
  value?: number | string;
  color?: string;
}

/** Tooltip hiện đủ bốn số và tổng của một ngày. */
function renderDailyTooltip(_event: unknown, { title, items }: { title?: string; items: TooltipItem[] }): string {
  const total = items.reduce((sum, item) => sum + Number(item.value ?? 0), 0);
  const rows = items
    .map(
      (item) =>
        `<div style="display:flex;justify-content:space-between;gap:24px;margin-top:4px">
           <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color ?? ''};margin-right:6px"></span>${item.name ?? ''}</span>
           <strong>${item.value ?? 0}</strong>
         </div>`,
    )
    .join('');
  return `<div style="min-width:170px">
            <div style="font-weight:600">Ngày ${title ?? ''}</div>
            ${rows}
            <div style="display:flex;justify-content:space-between;gap:24px;margin-top:6px;padding-top:6px;border-top:1px solid #f0f0f0">
              <span>Tổng</span><strong>${total}</strong>
            </div>
          </div>`;
}

/** Cột chồng theo ngày: số cuộc gọi mỗi ngày chia theo mức rủi ro. */
export function DailyCallsChart({ daily }: { daily: DailyCount[] }) {
  const data = useMemo(
    () =>
      daily.flatMap((day) =>
        LAYERS.map((layer) => ({ date: formatDayMonth(day.date), level: layer.label, count: day[layer.field] })),
      ),
    [daily],
  );

  if (daily.every((day) => day.calls === 0)) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có cuộc gọi nào trong kỳ" />;
  }

  return (
    <Column
      data={data}
      xField="date"
      yField="count"
      colorField="level"
      stack
      height={320}
      scale={{ color: { domain: LAYERS.map((l) => l.label), range: LAYERS.map((l) => l.color) } }}
      axis={{ x: { title: false, labelAutoHide: true }, y: { title: false } }}
      legend={{ color: { position: 'top', layout: { justifyContent: 'center' } } }}
      interaction={{ tooltip: { shared: true, render: renderDailyTooltip } }}
    />
  );
}

/** Vành khuyên tỉ lệ mức rủi ro; giữa vành là tổng số cuộc gọi đã phân tích. */
export function RiskDonutChart({ counts }: { counts: Record<RiskLevel, number> }) {
  const total = RISK_LEVELS.reduce((sum, level) => sum + (counts[level] ?? 0), 0);
  const data = useMemo(
    () => RISK_LEVELS.map((level) => ({ level: RISK_LABELS[level], count: counts[level] ?? 0 })),
    [counts],
  );

  if (total === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có cuộc gọi nào được phân tích" />;
  }

  return (
    <Pie
      data={data}
      angleField="count"
      colorField="level"
      innerRadius={0.62}
      height={320}
      scale={{
        color: { domain: RISK_LEVELS.map((l) => RISK_LABELS[l]), range: RISK_LEVELS.map((l) => RISK_COLORS[l]) },
      }}
      legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
      label={{ text: 'count', style: { fontWeight: 600 } }}
      tooltip={{ title: 'level', items: [{ field: 'count', name: 'Số cuộc gọi' }] }}
      annotations={[
        {
          type: 'text',
          style: {
            text: total.toLocaleString('vi-VN'),
            x: '50%',
            y: '46%',
            textAlign: 'center',
            fontSize: 30,
            fontWeight: 'bold',
          },
        },
        {
          type: 'text',
          style: { text: 'cuộc gọi đã phân tích', x: '50%', y: '56%', textAlign: 'center', fontSize: 12, fill: '#8c8c8c' },
        },
      ]}
    />
  );
}
