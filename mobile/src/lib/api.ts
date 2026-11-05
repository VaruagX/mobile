import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
const ACCESS_KEY = 'vos.auth.access';
const REFRESH_KEY = 'vos.auth.refresh';

export type ApiUser = { id: string; role: 'admin' | 'team' | 'client'; clientId?: string | null; name: string; email: string; phone?: string | null; jobTitle?: string | null; mustChangePassword?: boolean };
type AuthResponse = { user: ApiUser; accessToken: string; refreshToken: string };

async function saveAuth(data: AuthResponse) { await AsyncStorage.multiSet([[ACCESS_KEY, data.accessToken], [REFRESH_KEY, data.refreshToken]]); }
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (!API_BASE_URL) throw new Error('API is not configured');
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to sign in');
  await saveAuth(data);
  return data;
}
export async function logout() {
  const access = await AsyncStorage.getItem(ACCESS_KEY); const refresh = await AsyncStorage.getItem(REFRESH_KEY);
  if (API_BASE_URL && access) await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }) }).catch(() => {});
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
export async function apiFetch(path: string, init: RequestInit = {}) {
  const access = await AsyncStorage.getItem(ACCESS_KEY);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers: { ...(init.headers || {}), ...(access ? { Authorization: `Bearer ${access}` } : {}) } });
}
