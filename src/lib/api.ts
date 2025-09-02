import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let logoutFn: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function onLogout(fn: () => void) {
  logoutFn = fn;
}

export async function loadTokens() {
  accessToken = await SecureStore.getItemAsync('accessToken');
  refreshToken = await SecureStore.getItemAsync('refreshToken');
  return { accessToken, refreshToken };
}

export async function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  await Promise.all([
    SecureStore.setItemAsync('accessToken', access),
    SecureStore.setItemAsync('refreshToken', refresh),
  ]);
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync('accessToken'),
    SecureStore.deleteItemAsync('refreshToken'),
  ]);
}

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync('deviceId');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await SecureStore.setItemAsync('deviceId', id);
  }
  return id;
}

async function attemptRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) || {}),
    };
    if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
    return h;
  };

  let res = await fetch(`${BASE_URL}${path}`, { ...init, headers: buildHeaders() });

  if (res.status === 401 && refreshToken) {
    const ok = await tryRefresh();
    if (ok) {
      res = await fetch(`${BASE_URL}${path}`, { ...init, headers: buildHeaders() });
    } else {
      logoutFn?.();
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || 'Request failed', body);
  }

  return res.json() as Promise<T>;
}
