import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { ApiErrorBody } from '@/lib/api/types';
import { AppError, errors } from './errors';

// Route Handler toolkit for the BFF: every `/api/*` handler goes through `route()`
// so responses and errors share one shape the React Query client understands.

type RouteContext<P> = { params: Promise<P> };

export function route<P = Record<string, never>>(
  handler: (request: NextRequest, context: RouteContext<P>) => Promise<unknown>,
) {
  return async (request: NextRequest, context: RouteContext<P>) => {
    try {
      const result = await handler(request, context);
      return result instanceof Response ? result : Response.json(result);
    } catch (error) {
      unstable_rethrow(error); // framework signals (prerender bail-out, redirect, notFound)
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    const body: ApiErrorBody = { error: { code: error.code, message: error.message, details: error.details } };
    return Response.json(body, { status: error.status });
  }
  console.error('[api] unhandled error', error);
  const body: ApiErrorBody = { error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } };
  return Response.json(body, { status: 500 });
}

export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw errors.badRequest('Request body must be JSON.');
  }
  const result = schema.safeParse(json);
  if (!result.success) throw errors.validation('Invalid request.', z.flattenError(result.error).fieldErrors);
  return result.data;
}

export function parseParam<S extends z.ZodType>(value: unknown, schema: S): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw errors.notFound();
  return result.data;
}

/** Responses that depend on who is asking must never be stored by shared caches. */
export const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;
