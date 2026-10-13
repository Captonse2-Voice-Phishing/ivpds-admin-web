import type { ThemeConfig } from 'antd';

export const PRIMARY_COLOR = '#1F4E79';
export const PAGE_BACKGROUND = '#F5F7FA';

/** Màu của mức rủi ro, dùng nhất quán cho nhãn, biểu đồ và số liệu. */
export const RISK_COLORS = {
  HIGH: '#D4380D',
  MEDIUM: '#D48806',
  LOW: '#389E0D',
  NONE: '#8C8C8C',
} as const;

export const STATUS_COLORS = {
  success: '#389E0D',
  danger: '#D4380D',
  warning: '#D48806',
  neutral: '#8C8C8C',
  info: '#1677FF',
} as const;

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: PRIMARY_COLOR,
    colorLink: PRIMARY_COLOR,
    borderRadius: 8,
    fontSize: 14,
    colorBgLayout: PAGE_BACKGROUND,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  },
  components: {
    Layout: { siderBg: '#12314D', headerBg: '#FFFFFF', headerPadding: '0 24px' },
    Menu: { darkItemBg: '#12314D', darkSubMenuItemBg: '#12314D', darkItemSelectedBg: PRIMARY_COLOR },
  },
};
