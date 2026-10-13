import { useQuery } from '@tanstack/react-query';
import { Button, Card, DatePicker, Flex, Segmented, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import { queryKeys, usersApi } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import type { AdminUser, AnalysisStatus, RiskLevel } from '@/api/types';
import { CallsTable } from '@/components/CallsTable';
import { PageHeader } from '@/components/PageHeader';
import { SearchBox } from '@/components/SearchBox';
import { endOfDayIso, startOfDayIso } from '@/lib/format';
import { ANALYSIS_STATUSES, ANALYSIS_STATUS_LABELS, RISK_LABELS, RISK_LEVELS } from '@/lib/labels';
import { oneOf, useUrlState } from '@/lib/useUrlState';
import { useCallList } from './useCallList';

const DATE = 'YYYY-MM-DD';
const isDate = (value: string | undefined): value is string =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).isValid());

export function CallsPage() {
  const url = useUrlState();
  const riskLevel = oneOf<RiskLevel>(url.get('riskLevel'), RISK_LEVELS);
  const status = oneOf<AnalysisStatus>(url.get('status'), ANALYSIS_STATUSES);
  const callerNumber = url.get('callerNumber');
  const userId = url.get('userId');
  // Khoảng ngày trên URL là ngày theo giờ Việt Nam; đổi sang ISO UTC khi gọi API.
  const fromDate = isDate(url.get('from')) ? url.get('from') : undefined;
  const toDate = isDate(url.get('to')) ? url.get('to') : undefined;

  const query = useCallList(
    {
      riskLevel,
      status,
      callerNumber,
      userId,
      from: fromDate ? startOfDayIso(fromDate) : undefined,
      to: toDate ? endOfDayIso(toDate) : undefined,
    },
    url.page,
    url.size,
  );

  // Đang lọc theo một người dùng: lấy email để ghi trên Tag.
  const owner = useQuery<AdminUser, ApiError>({
    queryKey: [...queryKeys.users, 'detail', userId],
    queryFn: () => usersApi.get(userId ?? ''),
    enabled: Boolean(userId),
  });

  const hasFilters = Boolean(riskLevel || status || callerNumber || userId || fromDate || toDate);

  return (
    <>
      <PageHeader title="Cuộc gọi" crumbs={[{ title: 'Cuộc gọi' }]} />
      <Card>
        <Flex vertical gap={16}>
          <Segmented
            value={riskLevel ?? 'ALL'}
            options={[
              { value: 'ALL', label: 'Tất cả' },
              ...RISK_LEVELS.map((level) => ({ value: level, label: RISK_LABELS[level] })),
            ]}
            onChange={(value) => url.update({ riskLevel: value === 'ALL' ? undefined : value })}
            style={{ alignSelf: 'flex-start' }}
          />
          <Flex gap={12} wrap align="center">
            <SearchBox
              value={callerNumber}
              placeholder="Tìm theo số người gọi"
              onSearch={(value) => url.update({ callerNumber: value })}
            />
            <Select<AnalysisStatus>
              allowClear
              placeholder="Trạng thái phân tích"
              style={{ width: 200 }}
              value={status}
              options={ANALYSIS_STATUSES.map((s) => ({ value: s, label: ANALYSIS_STATUS_LABELS[s] }))}
              onChange={(value) => url.update({ status: value })}
            />
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              allowEmpty={[true, true]}
              value={[fromDate ? dayjs(fromDate) : null, toDate ? dayjs(toDate) : null]}
              onChange={(range) => url.update({ from: range?.[0]?.format(DATE), to: range?.[1]?.format(DATE) })}
            />
            {userId && (
              <Tag closable color="blue" onClose={() => url.update({ userId: undefined })} style={{ padding: '4px 8px' }}>
                Người dùng: {owner.data?.email ?? (owner.isError ? 'không tìm thấy' : 'đang tải...')}
              </Tag>
            )}
            <Button
              disabled={!hasFilters}
              onClick={() =>
                url.update({
                  riskLevel: undefined,
                  status: undefined,
                  callerNumber: undefined,
                  userId: undefined,
                  from: undefined,
                  to: undefined,
                })
              }
            >
              Xóa bộ lọc
            </Button>
          </Flex>
          <CallsTable
            query={query}
            page={url.page}
            size={url.size}
            onPageChange={url.setPage}
            emptyText={hasFilters ? 'Không có cuộc gọi nào khớp bộ lọc' : 'Chưa có cuộc gọi nào'}
          />
        </Flex>
      </Card>
    </>
  );
}
