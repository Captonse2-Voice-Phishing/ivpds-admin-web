import { Button, Result } from 'antd';
import type { ApiError } from '@/api/errors';

interface Props {
  error: ApiError;
  onRetry: () => void;
  retrying?: boolean;
}

/** Trạng thái lỗi của một vùng dữ liệu, kèm nút "Thử lại". */
export function QueryError({ error, onRetry, retrying }: Props) {
  return (
    <Result
      status={error.isNotFound ? '404' : 'error'}
      title={error.isNotFound ? 'Không tìm thấy dữ liệu' : 'Không tải được dữ liệu'}
      subTitle={error.message}
      extra={
        <Button type="primary" loading={retrying} onClick={onRetry}>
          Thử lại
        </Button>
      }
    />
  );
}
