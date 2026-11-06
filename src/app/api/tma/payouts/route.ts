import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, route } from '@/server/http';
import { getPayouts } from '@/server/services/payouts';

/** Balances, the linked wallet and recent withdrawals. Releases matured rewards first. */
export const GET = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  return Response.json(await getPayouts(evaluator), { headers: PRIVATE_NO_STORE });
});
