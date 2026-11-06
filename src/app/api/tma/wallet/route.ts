import { linkWalletSchema } from '@/lib/validation';
import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, parseBody, route } from '@/server/http';
import { linkWallet, unlinkWallet } from '@/server/services/payouts';

/** Links the wallet that signed the ton_proof as this evaluator's payout wallet. */
export const PUT = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  const input = await parseBody(request, linkWalletSchema);
  return Response.json(await linkWallet(evaluator, input), { headers: PRIVATE_NO_STORE });
});

export const DELETE = route(async (request) => {
  const { evaluator } = await requireEvaluator(request);
  await unlinkWallet(evaluator);
  return Response.json({ ok: true }, { headers: PRIVATE_NO_STORE });
});
