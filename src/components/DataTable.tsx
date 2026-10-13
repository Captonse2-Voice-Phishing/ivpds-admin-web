import type { UseQueryResult } from '@tanstack/react-query';
import { Empty, Skeleton, Table, type TableProps } from 'antd';
import { useEffect } from 'react';
import type { ApiError } from '@/api/errors';
import { PAGE_SIZE_OPTIONS } from '@/api/pagination';
import type { PageResponse } from '@/api/types';
import { QueryError } from './QueryError';

interface Props<T> extends Omit<TableProps<T>, 'dataSource' | 'pagination' | 'loading' | 'locale' | 'size'> {
  query: UseQueryResult<PageResponse<T>, ApiError>;
  /** Trang trên giao diện, bắt đầu từ 1. */
  page: number;
  size: number;
  onPageChange: (page: number, size: number) => void;
  emptyText: string;
}

/**
 * Bảng phân trang phía server dùng chung: Skeleton khi tải lần đầu, mờ khi đổi trang,
 * Empty khi rỗng, Result kèm "Thử lại" khi lỗi.
 */
export function DataTable<T extends object>({ query, page, size, onPageChange, emptyText, ...table }: Props<T>) {
  // Trang trên URL vượt quá số trang hiện có (ví dụ vừa xóa dòng cuối): lùi về trang cuối.
  const lastPage = query.data ? Math.max(query.data.totalPages, 1) : undefined;
  useEffect(() => {
    if (lastPage !== undefined && page > lastPage) {
      onPageChange(lastPage, size);
    }
  }, [lastPage, page, size, onPageChange]);

  if (query.isPending) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }
  if (query.isError) {
    return <QueryError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  const data = query.data;
  return (
    <Table<T>
      size="middle"
      scroll={{ x: 'max-content' }}
      {...table}
      dataSource={data.items}
      loading={query.isFetching}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} /> }}
      pagination={{
        current: page,
        pageSize: size,
        total: data.totalItems,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (total) => `Tổng ${total.toLocaleString('vi-VN')} mục`,
        onChange: onPageChange,
      }}
    />
  );
}
