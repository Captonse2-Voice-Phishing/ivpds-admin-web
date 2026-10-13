import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { callsApi, queryKeys } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import { toApiPage } from '@/api/pagination';
import type { AdminCall, CallListParams, PageResponse } from '@/api/types';

type Filters = Omit<CallListParams, 'page' | 'size'>;

/** Danh sách cuộc gọi; `page` là trang trên giao diện (từ 1), được đổi sang trang của backend (từ 0). */
export function useCallList(filters: Filters, page: number, size: number) {
  const params: CallListParams = { ...filters, page: toApiPage(page), size };
  return useQuery<PageResponse<AdminCall>, ApiError>({
    queryKey: [...queryKeys.calls, 'list', params],
    queryFn: () => callsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
