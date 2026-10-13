import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, publicApi, setSessionListener } from './client';
import { ApiError } from './errors';
import { tokenStore } from './tokenStore';

// Giả lập localStorage vì test chạy trong Node.
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => void storage.set(key, value),
  removeItem: (key: string) => void storage.delete(key),
});

interface FakeResponse {
  status: number;
  data?: unknown;
}

/** Adapter giả: trả phản hồi do `handler` quyết định, sau một nhịp chờ để các request thật sự chồng nhau. */
function fakeAdapter(handler: (config: InternalAxiosRequestConfig) => FakeResponse): AxiosAdapter {
  return async (config) => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    const { status, data } = handler(config);
    const response = { status, data, statusText: '', headers: {}, config };
    if (status >= 200 && status < 300) {
      return response;
    }
    throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
  };
}

const unauthorized: FakeResponse = { status: 401, data: { code: 'UNAUTHORIZED', requestId: 'r1' } };

describe('làm mới token khi gặp 401', () => {
  let refreshCalls: number;
  let onExpired: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage.clear();
    refreshCalls = 0;
    onExpired = vi.fn();
    setSessionListener({ onRefreshed: () => {}, onExpired });
    tokenStore.set({ accessToken: 'old-access', refreshToken: 'refresh-1' });
  });

  it('nhiều request cùng 401 chỉ refresh một lần rồi đều được gửi lại bằng token mới', async () => {
    const seen: string[] = [];
    api.defaults.adapter = fakeAdapter((config) => {
      const auth = String(config.headers.get('Authorization'));
      seen.push(`${config.url} ${auth}`);
      return auth === 'Bearer new-access' ? { status: 200, data: { url: config.url } } : unauthorized;
    });
    publicApi.defaults.adapter = fakeAdapter((config) => {
      refreshCalls += 1;
      expect(config.url).toBe('/auth/refresh');
      expect(JSON.parse(String(config.data))).toEqual({ refreshToken: 'refresh-1' });
      return {
        status: 200,
        data: { accessToken: 'new-access', refreshToken: 'refresh-2', tokenType: 'Bearer', expiresIn: 900 },
      };
    });

    const results = await Promise.all([api.get('/admin/calls'), api.get('/admin/users'), api.get('/admin/blacklist')]);

    expect(refreshCalls).toBe(1);
    expect(results.map((r) => (r.data as { url: string }).url)).toEqual([
      '/admin/calls',
      '/admin/users',
      '/admin/blacklist',
    ]);
    // Ba lần đầu dùng token cũ, ba lần gửi lại dùng token mới.
    expect(seen.filter((line) => line.endsWith('Bearer old-access'))).toHaveLength(3);
    expect(seen.filter((line) => line.endsWith('Bearer new-access'))).toHaveLength(3);
    // Refresh token chỉ dùng một lần: phải lưu token mới.
    expect(tokenStore.getAccess()).toBe('new-access');
    expect(tokenStore.getRefresh()).toBe('refresh-2');
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('refresh thất bại thì xóa token, báo hết phiên và trả lỗi cho mọi request', async () => {
    api.defaults.adapter = fakeAdapter(() => unauthorized);
    publicApi.defaults.adapter = fakeAdapter(() => {
      refreshCalls += 1;
      return { status: 401, data: { code: 'INVALID_REFRESH_TOKEN', requestId: 'r2' } };
    });

    const results = await Promise.allSettled([api.get('/admin/calls'), api.get('/admin/users')]);

    expect(refreshCalls).toBe(1);
    for (const result of results) {
      expect(result.status).toBe('rejected');
      const reason = (result as PromiseRejectedResult).reason as ApiError;
      expect(reason).toBeInstanceOf(ApiError);
      expect(reason.code).toBe('UNAUTHORIZED');
    }
    expect(tokenStore.getAccess()).toBeNull();
    expect(tokenStore.getRefresh()).toBeNull();
    expect(onExpired).toHaveBeenCalled();
  });

  it('request đã gửi lại mà vẫn 401 thì không refresh thêm lần nữa', async () => {
    api.defaults.adapter = fakeAdapter(() => unauthorized);
    publicApi.defaults.adapter = fakeAdapter(() => {
      refreshCalls += 1;
      return {
        status: 200,
        data: { accessToken: 'new-access', refreshToken: 'refresh-2', tokenType: 'Bearer', expiresIn: 900 },
      };
    });

    await expect(api.get('/admin/calls')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(refreshCalls).toBe(1);
  });

  it('lỗi không phải 401 không kích hoạt refresh', async () => {
    api.defaults.adapter = fakeAdapter(() => ({ status: 404, data: { code: 'CALL_NOT_FOUND', requestId: 'r3' } }));
    publicApi.defaults.adapter = fakeAdapter(() => {
      refreshCalls += 1;
      return { status: 200, data: {} };
    });

    await expect(api.get('/admin/calls/x')).rejects.toMatchObject({ code: 'CALL_NOT_FOUND', status: 404 });
    expect(refreshCalls).toBe(0);
  });
});
