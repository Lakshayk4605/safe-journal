export const API_BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/v1`
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    totalItems?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    [key: string]: unknown;
  };
  code?: string;
  details?: unknown;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiEnvelope<T>['meta'];
}

type QueryValue = string | number | boolean | undefined | null;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(
  path: string,
  options: RequestInit & { query?: Record<string, QueryValue> } = {},
): Promise<ApiResult<T>> {
  const { query, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    ...rest,
    body,
    credentials: 'include', // send/receive the httpOnly access/refresh cookies
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
  });

  // 204 / empty body responses
  const text = await res.text();
  const json: ApiEnvelope<T> = text ? JSON.parse(text) : { success: res.ok, message: '', data: undefined as T };

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || 'Something went wrong', json.code, json.details);
  }

  return { data: json.data, meta: json.meta };
}

/**
 * Wraps `request` with a single silent retry through POST /auth/refresh when a
 * call fails with 401 — the access-token cookie is short-lived (15m) by design,
 * so any page left open across that window would otherwise force a hard
 * re-login. Auth endpoints themselves are excluded to avoid infinite loops.
 */
async function requestWithRefresh<T>(
  path: string,
  options: RequestInit & { query?: Record<string, QueryValue> } = {},
): Promise<ApiResult<T>> {
  try {
    return await request<T>(path, options);
  } catch (err) {
    const isAuthRoute = path.startsWith('/auth/');
    if (err instanceof ApiError && err.status === 401 && !isAuthRoute) {
      try {
        await request('/auth/refresh', { method: 'POST' });
      } catch {
        throw err; // refresh failed too — surface the original 401
      }
      return request<T>(path, options);
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>) =>
    requestWithRefresh<T>(path, { method: 'GET', query }),

  post: <T>(path: string, body?: unknown) =>
    requestWithRefresh<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    requestWithRefresh<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: unknown) =>
    requestWithRefresh<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string, body?: unknown) =>
    requestWithRefresh<T>(path, { method: 'DELETE', body: body !== undefined ? JSON.stringify(body) : undefined }),
};
