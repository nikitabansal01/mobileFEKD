import { Platform } from 'react-native';

export type ApiPlatform = 'android' | 'ios' | 'web' | 'unknown';

export interface ResolveApiBaseUrlOptions {
  configuredUrl?: string;
  platform: ApiPlatform;
  development: boolean;
}

const VERSION_PATH = '/api/v2';
const VERSIONED_API_PATH = /\/api\/v\d+(?:\/|$)/i;

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const localOriginFor = (platform: ApiPlatform): string =>
  platform === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

/**
 * Resolve the only supported API base URL.
 *
 * EXPO_PUBLIC_API_URL is an origin (for example https://api.auvra.com), not a
 * versioned path. This prevents individual services from silently selecting a
 * different API version.
 */
export function resolveApiBaseUrl({
  configuredUrl,
  platform,
  development,
}: ResolveApiBaseUrlOptions): string {
  const configured = configuredUrl?.trim();

  if (!configured) {
    if (!development) {
      throw new Error('EXPO_PUBLIC_API_URL is required outside development.');
    }
    return `${localOriginFor(platform)}${VERSION_PATH}`;
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be an absolute http(s) URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must use http or https.');
  }
  if (!development && url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must use https in production.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('EXPO_PUBLIC_API_URL cannot contain credentials, a query, or a fragment.');
  }

  const pathname = stripTrailingSlashes(url.pathname);
  if (VERSIONED_API_PATH.test(`${pathname}/`)) {
    throw new Error('EXPO_PUBLIC_API_URL must be an origin, without an /api/vN path.');
  }

  const originWithPrefix = stripTrailingSlashes(`${url.origin}${pathname}`);
  return `${originWithPrefix}${VERSION_PATH}`;
}

const runtimePlatform = (): ApiPlatform => {
  if (Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web') {
    return Platform.OS;
  }
  return 'unknown';
};

export const getApiBaseUrl = (): string =>
  resolveApiBaseUrl({
    configuredUrl: process.env.EXPO_PUBLIC_API_URL,
    platform: runtimePlatform(),
    development:
      typeof __DEV__ === 'boolean' ? __DEV__ : process.env.NODE_ENV !== 'production',
  });
