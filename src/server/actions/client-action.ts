import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { requireClient, type Viewer } from '@/server/auth/dal';
import { AppError } from '@/server/errors';

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Wraps a dashboard Server Action: authenticates the client, validates the input
 * with zod (arguments to Server Actions are untrusted, whatever their TS type says)
 * and turns expected failures into a result object instead of a thrown error.
 */
export function clientAction<S extends z.ZodType, R>(
  schema: S,
  handler: (input: z.infer<S>, viewer: Viewer) => Promise<R>,
) {
  return async (input: z.input<S>): Promise<ActionResult<R>> => {
    try {
      const viewer = await requireClient();
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid input.',
          fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>,
        };
      }
      return { ok: true, data: await handler(parsed.data, viewer) };
    } catch (error) {
      unstable_rethrow(error); // let redirect() / notFound() through
      if (error instanceof AppError) return { ok: false, error: error.message };
      console.error('[action] unhandled error', error);
      return { ok: false, error: 'Something went wrong. Please try again.' };
    }
  };
}
