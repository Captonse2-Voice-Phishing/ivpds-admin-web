import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys, statisticsApi } from './admin';
import type { ApiError } from './errors';
import type { Statistics } from './types';

/** Kỳ thống kê mặc định; thanh bên và trang Tổng quan dùng chung để chỉ gọi API một lần. */
export const DEFAULT_STATISTICS_DAYS = 30;

export function useStatistics(days: number = DEFAULT_STATISTICS_DAYS) {
  return useQuery<Statistics, ApiError>({
    queryKey: [...queryKeys.statistics, days],
    queryFn: () => statisticsApi.get(days),
    placeholderData: keepPreviousData,
  });
}
