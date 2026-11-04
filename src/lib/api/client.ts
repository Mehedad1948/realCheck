import type { ApiErrorBody } from './types';

/** An error response from the BFF, with the server's code and user-safe message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type AuthProvider = () => string | null;
let getAuthorization: AuthProvider = () => null;

/** Lets the Telegram provider supply `Authorization: tma <initData>` for every call. */
export function setApiAuthorization(provider: AuthProvider) {
  getAuthorization = provider;
}

type ApiOptions = Omit<RequestInit, 'body'> & { json?: unknown };

export async function api<T>(path: string, { json, headers, ...init }: ApiOptions = {}): Promise<T> {
  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');
  const authorization = getAuthorization();
  if (authorization) finalHeaders.set('Authorization', authorization);
  if (json !== undefined) finalHeaders.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: finalHeaders,
      body: json === undefined ? undefined : JSON.stringify(json),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'You appear to be offline. Check your connection and try again.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error.code ?? 'HTTP_ERROR',
      body?.error.message ?? `Request failed (${response.status}).`,
      body?.error.details,
    );
  }
  return (await response.json()) as T;
}
