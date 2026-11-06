import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, route } from '@/server/http';
import { getProofPayload } from '@/server/services/payouts';

/** A fresh nonce for the wallet to sign when connecting (TON Connect ton_proof). */
export const GET = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  return Response.json(getProofPayload(evaluator), { headers: PRIVATE_NO_STORE });
});
