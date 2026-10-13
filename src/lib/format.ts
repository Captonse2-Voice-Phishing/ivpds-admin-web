import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { APP_TIME_ZONE } from '@/api/admin';

dayjs.extend(utc);
dayjs.extend(timezone);

const EMPTY = '—';

/** Thời điểm theo giờ Việt Nam, dạng 10/10/2026 13:15. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return EMPTY;
  }
  const value = dayjs(iso);
  return value.isValid() ? value.tz(APP_TIME_ZONE).format('DD/MM/YYYY HH:mm') : EMPTY;
}

/** Ngày dạng 2026-10-10 (đã chia theo múi giờ ở backend) → 10/10. */
export function formatDayMonth(date: string): string {
  const [, month, day] = date.split('-');
  return day && month ? `${day}/${month}` : date;
}

/** Thời lượng dạng "2 phút 30 giây". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return EMPTY;
  }
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} giờ`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} phút`);
  }
  if (rest > 0 || parts.length === 0) {
    parts.push(`${rest} giây`);
  }
  return parts.join(' ');
}

/** Số 0–1 thành phần trăm, ví dụ 0.98 → 98%. */
export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY;
  }
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : value.toLocaleString('vi-VN');
}

/** Ngày chọn trên giao diện (YYYY-MM-DD, giờ Việt Nam) → đầu ngày đó, dạng ISO UTC. */
export function startOfDayIso(date: string): string {
  return dayjs.tz(date, APP_TIME_ZONE).startOf('day').toISOString();
}

/** Ngày chọn trên giao diện (YYYY-MM-DD, giờ Việt Nam) → cuối ngày đó, dạng ISO UTC. */
export function endOfDayIso(date: string): string {
  return dayjs.tz(date, APP_TIME_ZONE).endOf('day').toISOString();
}
