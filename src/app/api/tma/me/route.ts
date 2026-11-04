import { requireEvaluator } from '@/server/auth/tma';
import { PRIVATE_NO_STORE, route } from '@/server/http';
import { getEvaluatorProfile } from '@/server/services/labeling';

/** Session bootstrap for the Mini App: verifies the launch, syncs the Telegram profile. */
export const GET = route(async (request) => {
  const { evaluator } = await requireEvaluator(request, { refreshProfile: true });
  return Response.json(await getEvaluatorProfile(evaluator), { headers: PRIVATE_NO_STORE });
});
