/**
 * Centralized API base configuration and request helper for Anisume Web Client.
 *
 * In production (e.g., deployed on Vercel), VITE_API_URL can be configured with
 * your Render backend URL (e.g. "https://anisume.onrender.com/api" or "https://anisume.onrender.com").
 *
 * When VITE_API_URL is omitted or during local development, it defaults to '/api',
 * which is automatically proxied by Vite to http://127.0.0.1:4000.
 */

function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (!envUrl) {
    return '/api';
  }

  // Strip trailing slashes
  const cleanUrl = envUrl.replace(/\/+$/, '');

  // If provided domain/origin does not end with '/api', append it so all sub-paths
  // (/auth, /anime, /library, /lists, /recommendations, /preferences) resolve correctly.
  if (!cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }

  return cleanUrl;
}

export const API_BASE = resolveApiBase();

let inMemoryCsrfToken = '';

/**
 * Stores a CSRF token received in response body (supports cross-origin environments).
 */
export function setCsrfToken(token: string): void {
  if (token && typeof token === 'string') {
    inMemoryCsrfToken = token;
  }
}

/**
 * Extracts CSRF token from document.cookie ('anisume_csrf') or in-memory cache.
 */
export function getCsrfToken(): string {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^|;\\s*)anisume_csrf=([^;]*)'));
    if (match && match[2]) {
      return decodeURIComponent(match[2]);
    }
  }
  return inMemoryCsrfToken;
}

/**
 * Unified JSON request wrapper supporting:
 * - Centralized API URL resolution
 * - HTTP-only cross-origin cookie sessions (credentials: 'include')
 * - Automatic CSRF header injection on mutating requests
 * - Standardized error handling with status/code preservation
 */
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Double Submit Cookie pattern: Attach X-CSRF-Token on state-changing requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send and receive HTTP-only session cookies
  });

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (res.status === 500 || res.status === 502 || res.status === 504) {
        errorMsg = 'Connection error: Backend server is temporarily unreachable or restarting. Please try again.';
      } else {
        errorMsg = `API error ${res.status}: ${res.statusText}`;
      }
    }
    const error = new Error(errorMsg);
    (error as any).code = data?.code;
    (error as any).status = res.status;
    throw error;
  }

  return data as T;
}

