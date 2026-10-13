import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parsePageSize, parseUiPage } from '@/api/pagination';

type Patch = Record<string, string | number | undefined | null>;

/**
 * Bộ lọc và trang hiện tại nằm trên URL, để tải lại hoặc gửi liên kết không mất trạng thái.
 * `page` trên URL bắt đầu từ 1 (như Ant Design); đổi sang 0 khi gọi API.
 */
export function useUrlState() {
  const [params, setParams] = useSearchParams();

  const page = parseUiPage(params.get('page'));
  const size = parsePageSize(params.get('size'));

  const update = useCallback(
    (patch: Patch, options: { keepPage?: boolean } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === null || value === '') {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          // Đổi bộ lọc thì quay về trang đầu.
          if (!options.keepPage) {
            next.delete('page');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setPage = useCallback(
    (nextPage: number, nextSize: number) => {
      // Đổi cỡ trang thì quay về trang đầu.
      update({ page: nextSize === size && nextPage > 1 ? nextPage : undefined, size: nextSize }, { keepPage: true });
    },
    [update, size],
  );

  const get = useCallback((key: string) => params.get(key) ?? undefined, [params]);

  return useMemo(() => ({ params, get, page, size, update, setPage }), [params, get, page, size, update, setPage]);
}

/** Chỉ nhận giá trị nằm trong danh sách cho phép; giá trị lạ trên URL bị bỏ qua. */
export function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}
