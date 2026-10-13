// Access token chỉ nằm trong bộ nhớ; refresh token nằm trong localStorage để mở lại trang vẫn còn phiên.

const REFRESH_KEY = 'ivpds.admin.refreshToken';

let accessToken: string | null = null;

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },
  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  set(tokens: { accessToken: string; refreshToken: string }): void {
    accessToken = tokens.accessToken;
    try {
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    } catch {
      // Trình duyệt chặn localStorage: phiên chỉ sống tới khi tải lại trang.
    }
  },
  clear(): void {
    accessToken = null;
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // Không có gì để xóa.
    }
  },
};
