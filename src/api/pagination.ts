// Backend đánh số trang từ 0, Ant Design từ 1. Mọi chỗ đổi qua lại đều dùng hai hàm này.

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Trang trên giao diện (từ 1) → trang gửi backend (từ 0). */
export function toApiPage(uiPage: number): number {
  return Number.isFinite(uiPage) ? Math.max(Math.trunc(uiPage) - 1, 0) : 0;
}

/** Trang backend trả về (từ 0) → trang trên giao diện (từ 1). */
export function toUiPage(apiPage: number): number {
  return Number.isFinite(apiPage) ? Math.max(Math.trunc(apiPage), 0) + 1 : 1;
}

/** Đọc số trang từ URL; giá trị sai thì về trang 1. */
export function parseUiPage(raw: string | null): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 ? value : 1;
}

/** Đọc cỡ trang từ URL; chỉ nhận các cỡ giao diện cho chọn. */
export function parsePageSize(raw: string | null): number {
  const value = Number(raw);
  return PAGE_SIZE_OPTIONS.includes(value) ? value : DEFAULT_PAGE_SIZE;
}
