import { withdrawalSchema } from '@/lib/validation';
import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, parseBody, route } from '@/server/http';
import { requestWithdrawal } from '@/server/services/payouts';

/** Holds the amount and queues it for review. Paid out by scripts/payouts.ts. */
export const POST = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  const { amountCents } = await parseBody(request, withdrawalSchema);
  return Response.json(await requestWithdrawal(evaluator, amountCents), { status: 201, headers: PRIVATE_NO_STORE });
});
