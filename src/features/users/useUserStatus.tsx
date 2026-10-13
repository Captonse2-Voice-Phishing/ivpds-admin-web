import { ExclamationCircleFilled } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { queryKeys, usersApi } from '@/api/admin';
import type { ApiError } from '@/api/errors';
import type { AdminUser, UserStatus } from '@/api/types';

/** Khóa (có xác nhận) và mở khóa tài khoản; dùng ở danh sách và trang chi tiết người dùng. */
export function useUserStatus() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const mutation = useMutation<AdminUser, ApiError, { id: string; status: UserStatus }>({
    mutationFn: ({ id, status }) => usersApi.setStatus(id, status),
    onSuccess: (saved) => {
      message.success(saved.status === 'LOCKED' ? `Đã khóa ${saved.email}` : `Đã mở khóa ${saved.email}`);
      // Số tài khoản bị khóa ở Tổng quan cũng đổi.
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
    },
    onError: (error) => {
      message.error(error.message);
      if (error.isNotFound) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      }
    },
  });

  const lock = (user: AdminUser) => {
    modal.confirm({
      title: `Khóa tài khoản ${user.email}?`,
      icon: <ExclamationCircleFilled />,
      content: 'Người dùng sẽ bị đăng xuất ngay và không đăng nhập lại được cho tới khi được mở khóa.',
      okText: 'Khóa tài khoản',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      // Trả Promise để nút xác nhận hiện trạng thái đang gửi; lỗi đã báo ở onError.
      onOk: () => mutation.mutateAsync({ id: user.id, status: 'LOCKED' }).catch(() => undefined),
    });
  };

  const unlock = (user: AdminUser) => mutation.mutate({ id: user.id, status: 'ACTIVE' });

  return { lock, unlock, pendingId: mutation.isPending ? mutation.variables?.id : undefined };
}
