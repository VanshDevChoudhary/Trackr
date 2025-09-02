import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;

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
