import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, parsePageSize, parseUiPage, toApiPage, toUiPage } from './pagination';

describe('đổi số trang giữa giao diện (từ 1) và backend (từ 0)', () => {
  it('trang 1 trên giao diện là trang 0 của backend', () => {
    expect(toApiPage(1)).toBe(0);
    expect(toApiPage(3)).toBe(2);
  });

  it('trang 0 của backend là trang 1 trên giao diện', () => {
    expect(toUiPage(0)).toBe(1);
    expect(toUiPage(2)).toBe(3);
  });

  it('đổi đi rồi đổi lại ra đúng số ban đầu', () => {
    for (const page of [1, 2, 7, 50]) {
      expect(toUiPage(toApiPage(page))).toBe(page);
    }
  });

  it('không bao giờ gửi trang âm', () => {
    expect(toApiPage(0)).toBe(0);
    expect(toApiPage(-4)).toBe(0);
    expect(toApiPage(Number.NaN)).toBe(0);
    expect(toUiPage(-1)).toBe(1);
  });

  it('đọc trang và cỡ trang từ URL, giá trị sai thì dùng mặc định', () => {
    expect(parseUiPage('4')).toBe(4);
    expect(parseUiPage(null)).toBe(1);
    expect(parseUiPage('0')).toBe(1);
    expect(parseUiPage('abc')).toBe(1);
    expect(parsePageSize('50')).toBe(50);
    expect(parsePageSize('1000')).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize(null)).toBe(DEFAULT_PAGE_SIZE);
  });
});
