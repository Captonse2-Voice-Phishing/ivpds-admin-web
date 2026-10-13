import type { Rule } from 'antd/es/form';

/** Mật khẩu 8–72 ký tự, theo quy định của backend. */
export const passwordRules: Rule[] = [
  { required: true, message: 'Nhập mật khẩu mới' },
  { min: 8, max: 72, message: 'Mật khẩu dài từ 8 đến 72 ký tự' },
];
