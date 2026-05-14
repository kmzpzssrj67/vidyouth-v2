/**
 * Vidyouth auth client.
 *
 * Talks to the same Fastify backend used by the web auth pages — same
 * route shapes, same JWT response. The base URL adapts to the runtime:
 *   - web / iOS simulator → http://localhost:8080
 *   - Android emulator    → http://10.0.2.2:8080  (host machine alias)
 *
 * Override at runtime by stuffing `vidyouth_api_base_url` into
 * AsyncStorage (mirrors the localStorage hook used on the web).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  baseUrl: 'vidyouth_api_base_url',
  access:  'vidyouth_access_token',
  refresh: 'vidyouth_refresh_token',
  expires: 'vidyouth_token_expires_at',
};

function platformDefaultBaseUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}

let cachedBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.baseUrl);
    cachedBaseUrl = stored && stored.length > 0 ? stored : platformDefaultBaseUrl();
  } catch {
    cachedBaseUrl = platformDefaultBaseUrl();
  }
  return cachedBaseUrl;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  cachedBaseUrl = url;
  await AsyncStorage.setItem(STORAGE_KEYS.baseUrl, url);
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: 'Bearer';
  expires_in: number;
}

async function persistTokens(t: AuthTokens) {
  const expiresAt = String(Date.now() + (t.expires_in || 900) * 1000);
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.access, t.access_token],
    [STORAGE_KEYS.expires, expiresAt],
    ...(t.refresh_token ? [[STORAGE_KEYS.refresh, t.refresh_token] as [string, string]] : []),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.access);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEYS.access, STORAGE_KEYS.refresh, STORAGE_KEYS.expires]);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error('network_unreachable');
  }
  const text = await response.text();
  const payload = text ? safeJson(text) : {};
  if (!response.ok) {
    const error = (payload as { error?: string }).error ?? `http_${response.status}`;
    throw new Error(error);
  }
  return payload as T;
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return {}; }
}

// ── Endpoints ────────────────────────────────────────────────────────────

export interface LoginInput {
  identifier: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthTokens> {
  const tokens = await postJson<AuthTokens>('/auth/login', input);
  await persistTokens(tokens);
  return tokens;
}

export interface SignupInput {
  displayName: string;
  password: string;
  channel: 'email' | 'mobile';
  email?: string;
  mobile?: string;
}

export async function signup(input: SignupInput): Promise<AuthTokens> {
  const tokens = await postJson<AuthTokens>('/auth/signup', input);
  await persistTokens(tokens);
  return tokens;
}

export async function ping(): Promise<boolean> {
  try {
    const baseUrl = await getApiBaseUrl();
    const r = await fetch(`${baseUrl}/livez`, { method: 'GET' });
    return r.ok;
  } catch {
    return false;
  }
}
